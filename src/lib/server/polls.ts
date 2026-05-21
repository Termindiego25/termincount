import { randomBytes } from 'node:crypto';
import type pg from 'pg';
import { error } from '@sveltejs/kit';
import { isLanguage, type Language } from '$lib/i18n';
import type { CreatePollPayload, PollOptionResult, PollResult } from '$lib/polls';
import {
	BAR_COLORS,
	MAX_OPTIONS,
	createCustomPoll,
	createDefaultPoll,
	type Poll
} from '$lib/voting';
import { getRetentionDays } from './config';
import { ensureDatabase, pool } from './db';
import { publishPollUpdate } from './realtime';

const titleMaxLength = 140;
const optionMaxLength = 80;
const idBytes = 16;

type Queryable = pg.Pool | pg.PoolClient;

interface PollRow {
	id: string;
	title: string;
	language: Language;
	is_default: boolean;
	created_at: Date | string;
	expires_at: Date | string;
	owner_session_hash: string;
}

interface OptionRow {
	id: string;
	position: number;
	label: string;
	bar_type: string;
	votes: number;
}

export interface PollSnapshot {
	poll: PollResult;
	ownerSessionHash: string;
}

export function normalizeCreatePollPayload(input: unknown): CreatePollPayload {
	if (!input || typeof input !== 'object') {
		error(400, 'Invalid poll payload.');
	}

	const payload = input as Record<string, unknown>;
	const language = typeof payload.language === 'string' && isLanguage(payload.language)
		? payload.language
		: 'en';

	const options = Array.isArray(payload.options)
		? payload.options
				.map((option) => String(option ?? '').trim().slice(0, optionMaxLength))
				.filter(Boolean)
				.slice(0, MAX_OPTIONS)
		: [];

	return {
		title: String(payload.title ?? '').trim().slice(0, titleMaxLength),
		options,
		language
	};
}

export async function createPoll(payload: CreatePollPayload, ownerSessionHash: string): Promise<PollResult> {
	await ensureDatabase();

	const customPoll = createCustomPoll(payload.title, payload.options, payload.language);
	const poll = customPoll.slots.length > 0 ? customPoll : createDefaultPoll(payload.language);
	const isDefault = poll.slots.length !== customPoll.slots.length;
	const expiresAt = new Date(Date.now() + getRetentionDays() * 24 * 60 * 60 * 1000);

	for (let attempt = 0; attempt < 5; attempt += 1) {
		const id = createPublicId();
		const client = await pool.connect();

		try {
			await client.query('BEGIN');
			await client.query(
				`
					INSERT INTO polls (id, title, language, is_default, owner_session_hash, expires_at)
					VALUES ($1, $2, $3, $4, $5, $6)
				`,
				[id, poll.question, payload.language, isDefault, ownerSessionHash, expiresAt]
			);

			await insertOptions(client, id, poll);
			await client.query('COMMIT');

			const created = await getPoll(id);
			if (!created) error(500, 'Created poll could not be loaded.');
			return created.poll;
		} catch (caught) {
			await client.query('ROLLBACK');

			if (isUniqueViolation(caught)) {
				continue;
			}

			throw caught;
		} finally {
			client.release();
		}
	}

	error(500, 'Could not allocate a poll id.');
}

async function insertOptions(client: pg.PoolClient, pollId: string, poll: Poll) {
	for (const [index, slot] of poll.slots.entries()) {
		await client.query(
			`
				INSERT INTO poll_options (poll_id, position, label, bar_type)
				VALUES ($1, $2, $3, $4)
			`,
			[pollId, index, slot.slotlabel, slot.barType]
		);
	}
}

export async function getPoll(id: string): Promise<PollSnapshot | null> {
	await ensureDatabase();
	const pollResult = await pool.query<PollRow>('SELECT * FROM polls WHERE id = $1 AND expires_at > now()', [id]);
	const row = pollResult.rows[0];
	if (!row) return null;

	return {
		poll: await serializePoll(row, pool),
		ownerSessionHash: row.owner_session_hash
	};
}

export async function recordVote(id: string, index: number, ownerSessionHash: string): Promise<PollResult> {
	await ensureDatabase();

	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const poll = await requireOwnedPoll(client, id, ownerSessionHash);
		const option = await client.query<OptionRow>(
			'SELECT * FROM poll_options WHERE poll_id = $1 AND position = $2 FOR UPDATE',
			[id, index]
		);

		const optionRow = option.rows[0];
		if (!optionRow) error(400, 'Invalid vote option.');

		await client.query('INSERT INTO vote_events (poll_id, option_id) VALUES ($1, $2)', [id, optionRow.id]);
		await client.query('UPDATE poll_options SET votes = votes + 1 WHERE id = $1', [optionRow.id]);
		await client.query('UPDATE polls SET last_event_id = last_event_id + 1 WHERE id = $1', [id]);
		await client.query('COMMIT');

		await publishPollUpdate(id);
		return await loadRequiredPoll(id, poll.owner_session_hash);
	} catch (caught) {
		await client.query('ROLLBACK');
		throw caught;
	} finally {
		client.release();
	}
}

export async function undoLastVote(id: string, ownerSessionHash: string): Promise<PollResult> {
	await ensureDatabase();

	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const poll = await requireOwnedPoll(client, id, ownerSessionHash);
		const latest = await client.query<{ id: string; option_id: string }>(
			`
				SELECT id, option_id
				FROM vote_events
				WHERE poll_id = $1
				ORDER BY id DESC
				LIMIT 1
				FOR UPDATE
			`,
			[id]
		);

		const event = latest.rows[0];
		if (!event) {
			await client.query('COMMIT');
			return await loadRequiredPoll(id, poll.owner_session_hash);
		}

		await client.query('DELETE FROM vote_events WHERE id = $1', [event.id]);
		await client.query('UPDATE poll_options SET votes = GREATEST(votes - 1, 0) WHERE id = $1', [
			event.option_id
		]);
		await client.query('UPDATE polls SET last_event_id = last_event_id + 1 WHERE id = $1', [id]);
		await client.query('COMMIT');

		await publishPollUpdate(id);
		return await loadRequiredPoll(id, poll.owner_session_hash);
	} catch (caught) {
		await client.query('ROLLBACK');
		throw caught;
	} finally {
		client.release();
	}
}

async function requireOwnedPoll(
	client: pg.PoolClient,
	id: string,
	ownerSessionHash: string
): Promise<PollRow> {
	const result = await client.query<PollRow>(
		'SELECT * FROM polls WHERE id = $1 AND expires_at > now() FOR UPDATE',
		[id]
	);
	const poll = result.rows[0];

	if (!poll) error(404, 'Poll not found.');
	if (poll.owner_session_hash !== ownerSessionHash) error(403, 'This session cannot modify the poll.');

	return poll;
}

async function loadRequiredPoll(id: string, expectedOwnerHash: string): Promise<PollResult> {
	const snapshot = await getPoll(id);
	if (!snapshot || snapshot.ownerSessionHash !== expectedOwnerHash) error(404, 'Poll not found.');
	return snapshot.poll;
}

async function serializePoll(row: PollRow, queryable: Queryable): Promise<PollResult> {
	const options = await queryable.query<OptionRow>(
		`
			SELECT id, position, label, bar_type, votes
			FROM poll_options
			WHERE poll_id = $1
			ORDER BY position ASC
		`,
		[row.id]
	);

	return {
		id: row.id,
		title: row.title,
		language: row.language,
		isDefault: row.is_default,
		createdAt: new Date(row.created_at).toISOString(),
		expiresAt: new Date(row.expires_at).toISOString(),
		options: options.rows.map(serializeOption)
	};
}

function serializeOption(row: OptionRow): PollOptionResult {
	const barType = BAR_COLORS.includes(row.bar_type as (typeof BAR_COLORS)[number])
		? (row.bar_type as PollOptionResult['barType'])
		: 'accent-9';

	return {
		id: String(row.id),
		position: row.position,
		label: row.label,
		barType,
		votes: Number(row.votes)
	};
}

function createPublicId(): string {
	return randomBytes(idBytes).toString('base64url');
}

function isUniqueViolation(errorValue: unknown): boolean {
	return Boolean(errorValue && typeof errorValue === 'object' && 'code' in errorValue && errorValue.code === '23505');
}

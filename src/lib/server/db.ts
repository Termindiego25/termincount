import pg from 'pg';
import { getCleanupIntervalMinutes, getDatabasePoolSize, getDatabaseUrl } from './config';

const { Pool } = pg;
export const POLL_UPDATE_CHANNEL = 'termincount_poll_updates';

export const pool = new Pool({
	connectionString: getDatabaseUrl(),
	max: getDatabasePoolSize(),
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 5_000
});

pool.on('error', (error) => {
	console.error('Idle PostgreSQL connection failed', error.message);
});

let initPromise: Promise<void> | null = null;
let cleanupTimer: NodeJS.Timeout | null = null;

export async function ensureDatabase(): Promise<void> {
	if (!initPromise) {
		initPromise = initializeDatabase().catch((error) => {
			initPromise = null;
			throw error;
		});
	}

	return initPromise;
}

async function initializeDatabase(): Promise<void> {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		// Serialize first-start schema creation across app replicas.
		await client.query('SELECT pg_advisory_xact_lock(2025, 1300)');
		await client.query(`
		CREATE TABLE IF NOT EXISTS polls (
			id text PRIMARY KEY,
			title text NOT NULL,
			language text NOT NULL,
			is_default boolean NOT NULL DEFAULT false,
			owner_session_hash text NOT NULL,
			created_at timestamptz NOT NULL DEFAULT now(),
			expires_at timestamptz NOT NULL,
			last_event_id bigint NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS poll_options (
			id bigserial PRIMARY KEY,
			poll_id text NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
			position integer NOT NULL,
			label text NOT NULL,
			bar_type text NOT NULL,
			votes integer NOT NULL DEFAULT 0,
			UNIQUE (poll_id, position)
		);

		CREATE TABLE IF NOT EXISTS vote_events (
			id bigserial PRIMARY KEY,
			poll_id text NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
			option_id bigint NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
			created_at timestamptz NOT NULL DEFAULT now()
		);

		CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON polls (expires_at);
		CREATE INDEX IF NOT EXISTS idx_poll_options_poll_position ON poll_options (poll_id, position);
		CREATE INDEX IF NOT EXISTS idx_vote_events_poll_created ON vote_events (poll_id, id DESC);
		`);
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK').catch(() => {});
		throw error;
	} finally {
		client.release();
	}

	await cleanupExpiredPolls();
	startCleanupLoop();
}

function startCleanupLoop() {
	if (cleanupTimer) return;

	cleanupTimer = setInterval(
		() => {
			cleanupExpiredPolls().catch((error) => {
				console.error('Failed to clean expired polls', error);
			});
		},
		getCleanupIntervalMinutes() * 60_000
	);

	cleanupTimer.unref?.();
}

export async function checkDatabase(): Promise<void> {
	await ensureDatabase();
	await pool.query('SELECT 1');
}

export async function cleanupExpiredPolls(): Promise<number> {
	const result = await pool.query('DELETE FROM polls WHERE expires_at <= now()');
	return result.rowCount ?? 0;
}

export async function closeDatabase(): Promise<void> {
	if (cleanupTimer) {
		clearInterval(cleanupTimer);
		cleanupTimer = null;
	}

	await pool.end();
	initPromise = null;
}

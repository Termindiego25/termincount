import pg from 'pg';
import type { PollResult } from '#lib/polls.js';
import { getDatabaseUrl } from './config';
import { ensureDatabase, POLL_UPDATE_CHANNEL } from './db';
import { getPoll } from './polls';

interface Subscriber {
	update: (poll: PollResult | null) => void;
	disconnect: () => void;
}

const subscribers = new Map<string, Set<Subscriber>>();
const refreshing = new Map<string, { dirty: boolean; promise: Promise<void> }>();
let listenerClient: pg.Client | null = null;
let listenerPromise: Promise<void> | null = null;

export async function ensureRealtimeListener(): Promise<void> {
	if (!listenerPromise) {
		listenerPromise = startListener().catch((error) => {
			listenerPromise = null;
			throw error;
		});
	}
	return listenerPromise;
}

async function startListener(): Promise<void> {
	await ensureDatabase();
	const client = new pg.Client({
		connectionString: getDatabaseUrl(),
		connectionTimeoutMillis: 5_000,
		application_name: 'termincount_realtime'
	});
	listenerClient = client;
	const disconnect = () => {
		if (listenerClient !== client) return;
		listenerClient = null;
		listenerPromise = null;
		for (const pollId of subscribers.keys()) disconnectPoll(pollId);
		void client.end().catch(() => {});
	};
	client.on('notification', (message) => {
		if (message.channel === POLL_UPDATE_CHANNEL && message.payload) void refreshPoll(message.payload);
	});
	client.on('error', (error) => {
		console.error('PostgreSQL realtime listener failed', error.message);
		disconnect();
	});
	client.on('end', disconnect);
	try {
		await client.connect();
		await client.query(`LISTEN ${POLL_UPDATE_CHANNEL}`);
	} catch (error) {
		disconnect();
		throw error;
	}
}

export function subscribeToPoll(pollId: string, subscriber: Subscriber): () => void {
	const existing = subscribers.get(pollId) ?? new Set<Subscriber>();
	existing.add(subscriber);
	subscribers.set(pollId, existing);
	return () => {
		existing.delete(subscriber);
		if (existing.size === 0) subscribers.delete(pollId);
	};
}

export async function refreshPoll(pollId: string): Promise<void> {
	const active = refreshing.get(pollId);
	if (active) {
		active.dirty = true;
		return active.promise;
	}
	const state = { dirty: true, promise: Promise.resolve() };
	refreshing.set(pollId, state);
	// Coalesce bursts and read one snapshot per poll, rather than once per viewer.
	state.promise = (async () => {
		while (state.dirty && subscribers.has(pollId)) {
			state.dirty = false;
			const snapshot = await getPoll(pollId);
			for (const subscriber of subscribers.get(pollId) ?? []) subscriber.update(snapshot?.poll ?? null);
		}
	})().catch(() => disconnectPoll(pollId)).finally(() => refreshing.delete(pollId));
	return state.promise;
}

function disconnectPoll(pollId: string): void {
	for (const subscriber of subscribers.get(pollId) ?? []) subscriber.disconnect();
}

export async function closeRealtimeListener(): Promise<void> {
	const client = listenerClient;
	listenerClient = null;
	listenerPromise = null;
	for (const pollId of subscribers.keys()) disconnectPoll(pollId);
	await client?.end();
}

import pg from 'pg';
import { getDatabaseUrl } from './config';
import { ensureDatabase, pool } from './db';

const { Client } = pg;
const channel = 'termincount_poll_updates';
const subscribers = new Map<string, Set<() => void>>();

let listenerClient: pg.Client | null = null;
let listenerPromise: Promise<void> | null = null;

export async function ensureRealtimeListener(): Promise<void> {
	if (!listenerPromise) {
		listenerPromise = startListener();
	}

	return listenerPromise;
}

async function startListener(): Promise<void> {
	await ensureDatabase();

	const client = new Client({ connectionString: getDatabaseUrl() });
	listenerClient = client;

	client.on('notification', (message) => {
		if (message.channel === channel && message.payload) {
			notifyLocalSubscribers(message.payload);
		}
	});

	client.on('error', (error) => {
		console.error('PostgreSQL realtime listener failed', error);
		listenerClient = null;
		listenerPromise = null;
	});

	await client.connect();
	await client.query(`LISTEN ${channel}`);
}

export function subscribeToPoll(pollId: string, callback: () => void): () => void {
	const existing = subscribers.get(pollId) ?? new Set<() => void>();
	existing.add(callback);
	subscribers.set(pollId, existing);

	return () => {
		existing.delete(callback);
		if (existing.size === 0) subscribers.delete(pollId);
	};
}

export async function publishPollUpdate(pollId: string): Promise<void> {
	await ensureDatabase();
	await pool.query(`SELECT pg_notify('${channel}', $1)`, [pollId]);
}

function notifyLocalSubscribers(pollId: string) {
	for (const callback of subscribers.get(pollId) ?? []) {
		callback();
	}
}

export async function closeRealtimeListener(): Promise<void> {
	await listenerClient?.end();
	listenerClient = null;
	listenerPromise = null;
}

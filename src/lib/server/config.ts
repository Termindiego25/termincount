import { readFileSync } from 'node:fs';

const defaultDatabaseUrl = 'postgres://termincount:termincount@127.0.0.1:5432/termincount';
const defaultRetentionDays = 7;

export function getDatabaseUrl(): string {
	const databaseUrl = readEnvOrFile('DATABASE_URL');
	if (databaseUrl) return databaseUrl;

	const host = readEnvOrFile('DB_HOST') || '127.0.0.1';
	const port = readEnvOrFile('DB_PORT') || '5432';
	const database = readEnvOrFile('DB_NAME') || readEnvOrFile('POSTGRES_DB') || 'termincount';
	const username = readEnvOrFile('DB_USER') || readEnvOrFile('POSTGRES_USER') || 'termincount';
	const password = readEnvOrFile('DB_PASSWORD') || readEnvOrFile('POSTGRES_PASSWORD') || 'termincount';

	if (!host && !database && !username && !password) return defaultDatabaseUrl;

	return `postgres://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}

export function getRetentionDays(): number {
	const raw = Number.parseInt(process.env.TERMINCOUNT_RETENTION_DAYS || '', 10);
	if (!Number.isFinite(raw)) return defaultRetentionDays;
	return Math.min(365, Math.max(1, raw));
}

export function getCleanupIntervalMinutes(): number {
	const raw = Number.parseInt(process.env.TERMINCOUNT_CLEANUP_INTERVAL_MINUTES || '', 10);
	if (!Number.isFinite(raw)) return 60;
	return Math.min(1440, Math.max(5, raw));
}

function readEnvOrFile(name: string): string | undefined {
	const value = process.env[name]?.trim();
	if (value) return value;

	const filePath = process.env[`${name}_FILE`]?.trim();
	if (!filePath) return undefined;

	return readSecretFile(filePath, name);
}

function readSecretFile(filePath: string, name: string): string {
	try {
		const value = readFileSync(filePath, 'utf8').trim();
		if (!value) throw new Error('Secret file is empty.');
		return value;
	} catch (error) {
		throw new Error(`Could not read ${name}_FILE at ${filePath}: ${(error as Error).message}`);
	}
}

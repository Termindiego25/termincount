const defaultDatabaseUrl = 'postgres://termincount:termincount@127.0.0.1:5432/termincount';
const defaultRetentionDays = 7;

export function getDatabaseUrl(): string {
	return process.env.DATABASE_URL || defaultDatabaseUrl;
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

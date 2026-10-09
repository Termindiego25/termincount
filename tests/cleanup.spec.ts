import { expect, test } from '@playwright/test';
import pg from 'pg';

test('batches expired cleanup, skips locks and cascades mutation receipts', async () => {
	const service = await import('../src/lib/server/db');
	await service.ensureDatabase();
	await service.cleanupExpiredPolls();
	const lock = await service.pool.connect();
	const observer = new pg.Client({ connectionString: process.env.DATABASE_URL ?? 'postgres://termincount:termincount@127.0.0.1:5432/termincount' });
	await observer.connect();
	const prefix = `cleanup-${crypto.randomUUID()}-`;
	try {
		await observer.query(`INSERT INTO polls (id, title, language, owner_session_hash, expires_at)
			SELECT $1 || n::text, 'Cleanup fixture', 'en', 'fixture', now() - interval '1 day' FROM generate_series(1, 205) n`, [prefix]);
		await observer.query(`INSERT INTO mutation_receipts (poll_id, request_id, kind)
			SELECT id, 'cleanup-receipt-0001', 'undo' FROM polls WHERE id LIKE $1`, [`${prefix}%`]);
		await lock.query('BEGIN');
		await lock.query('SELECT id FROM polls WHERE id = $1 FOR UPDATE', [`${prefix}1`]);
		await expect(service.cleanupExpiredPolls()).resolves.toBeGreaterThanOrEqual(204);
		expect(Number((await observer.query('SELECT count(*) FROM polls WHERE id LIKE $1', [`${prefix}%`])).rows[0].count)).toBe(1);
		await lock.query('COMMIT');
		await service.cleanupExpiredPolls();
		expect(Number((await observer.query('SELECT count(*) FROM mutation_receipts WHERE poll_id LIKE $1', [`${prefix}%`])).rows[0].count)).toBe(0);
	} finally {
		await lock.query('ROLLBACK');
		lock.release();
		await observer.query('DELETE FROM polls WHERE id LIKE $1', [`${prefix}%`]);
		await observer.end();
		await service.closeDatabase();
	}
});

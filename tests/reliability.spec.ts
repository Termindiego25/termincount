import { expect, test } from '@playwright/test';
import pg from 'pg';

const origin = 'http://127.0.0.1:4173';
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? 'postgres://termincount:termincount@127.0.0.1:5432/termincount' });
test.afterAll(() => db.end());

test('deduplicates retries and never replays an empty undo against a later vote', async ({ request }) => {
	const created = await request.post('/api/polls', { headers: { origin }, data: { options: ['Yes', 'No'] } });
	const { poll } = await created.json();
	const path = `/api/polls/${poll.id}`;
	expect((await request.post(`${path}/vote`, { headers: { origin, 'idempotency-key': 'bad' }, data: { index: 0 } })).status()).toBe(400);
	const headers = { origin, 'idempotency-key': 'same-vote-request-0001' };
	const replies = await Promise.all(Array.from({ length: 8 }, () => request.post(`${path}/vote`, { headers, data: { index: 0 } })));
	for (const reply of replies) expect(reply.status()).toBe(200);
	const last = await replies[replies.length - 1].json();
	expect(last.poll.revision).toBe('1');
	expect(last.poll.options[0].votes).toBe(1);
	expect((await request.post(`${path}/vote`, { headers, data: { index: 1 } })).status()).toBe(409);
	const undoHeaders = { origin, 'idempotency-key': 'same-undo-request-0001' };
	await request.post(`${path}/undo`, { headers: undoHeaders });
	const repeated = await request.post(`${path}/undo`, { headers: undoHeaders });
	expect((await repeated.json()).poll.revision).toBe('2');
	const emptyHeaders = { origin, 'idempotency-key': 'empty-undo-request-001' };
	await request.post(`${path}/undo`, { headers: emptyHeaders });
	await request.post(`${path}/vote`, { headers: { origin }, data: { index: 0 } });
	const emptyRetry = await request.post(`${path}/undo`, { headers: emptyHeaders });
	expect((await emptyRetry.json()).poll.options[0].votes).toBe(1);
});

test('rejects a vote that expires while waiting for the poll lock', async ({ request }) => {
	const created = await request.post('/api/polls', { headers: { origin }, data: {} });
	const { poll } = await created.json();
	const lock = await db.connect();
	try {
		await lock.query('BEGIN');
		await lock.query("UPDATE polls SET expires_at = clock_timestamp() + interval '2 seconds' WHERE id = $1", [poll.id]);
		const pending = request.post(`/api/polls/${poll.id}/vote`, { headers: { origin }, data: { index: 0 } });
		await expect.poll(async () => Number((await db.query("SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'")).rows[0].count)).toBeGreaterThan(0);
		await lock.query('SELECT pg_sleep(2.2)');
		await lock.query('COMMIT');
		expect((await pending).status()).toBe(404);
		expect(Number((await db.query('SELECT sum(votes) AS total FROM poll_options WHERE poll_id = $1', [poll.id])).rows[0].total)).toBe(0);
	} finally {
		await lock.query('ROLLBACK');
		lock.release();
	}
});

test('changes the tally and live subscription when navigating between result URLs', async ({ page }) => {
	const first = await page.request.post('/api/polls', { headers: { origin }, data: { title: 'First count' } });
	const second = await page.request.post('/api/polls', { headers: { origin }, data: { title: 'Second count' } });
	const firstPoll = (await first.json()).poll;
	const secondPoll = (await second.json()).poll;
	await page.goto(`/p/${firstPoll.id}`);
	await expect(page.locator('#question')).toHaveText('First count');
	await page.evaluate((id) => {
		const link = document.createElement('a');
		link.href = `/p/${id}`;
		link.textContent = 'Open second count';
		document.body.append(link);
	}, secondPoll.id);
	await page.getByRole('link', { name: 'Open second count' }).click();
	await expect(page).toHaveURL(new RegExp(secondPoll.id));
	await expect(page.locator('#question')).toHaveText('Second count');
	await page.locator('.vote-option[data-index="0"]').click();
	await expect(page.locator('#slot-0-label')).toHaveText('1');
	expect(Number((await db.query('SELECT sum(votes) AS total FROM poll_options WHERE poll_id = $1', [firstPoll.id])).rows[0].total)).toBe(0);
});

test('retries a lost response without duplicating the committed vote', async ({ page }) => {
	const created = await page.request.post('/api/polls', { headers: { origin }, data: {} });
	const { poll } = await created.json();
	let first = true;
	const keys: string[] = [];
	await page.route(`**/api/polls/${poll.id}/vote`, async (route) => {
		keys.push(route.request().headers()['idempotency-key']);
		if (first) {
			first = false;
			await route.fetch();
			await route.abort('connectionfailed');
		} else await route.continue();
	});
	await page.goto(`/p/${poll.id}`);
	await page.locator('.vote-option[data-index="0"]').click();
	await expect.poll(() => keys.length).toBe(2);
	await expect(page.locator('.vote-option[data-index="0"]')).toBeEnabled();
	expect(keys[0]).toBe(keys[1]);
	await expect(page.locator('#slot-0-label')).toHaveText('1');
	expect(Number((await db.query('SELECT count(*) FROM vote_events WHERE poll_id = $1', [poll.id])).rows[0].count)).toBe(1);
});

test('recovers the same pending action after reloading', async ({ page }) => {
	const created = await page.request.post('/api/polls', { headers: { origin }, data: {} });
	const { poll } = await created.json();
	let committed = false;
	await page.route(`**/api/polls/${poll.id}/vote`, async (route) => {
		if (!committed) {
			await route.fetch();
			committed = true;
		}
		await route.abort('connectionfailed');
	});
	await page.goto(`/p/${poll.id}`);
	await page.locator('.vote-option[data-index="0"]').click();
	await expect(page.locator('.vote-option[data-index="0"]')).toBeDisabled();
	await page.unroute(`**/api/polls/${poll.id}/vote`);
	await page.reload();
	await expect(page.locator('.vote-option[data-index="0"]')).toBeEnabled();
	await expect(page.locator('#slot-0-label')).toHaveText('1');
	expect(Number((await db.query('SELECT count(*) FROM vote_events WHERE poll_id = $1', [poll.id])).rows[0].count)).toBe(1);
	await expect.poll(() => page.evaluate((id) => sessionStorage.getItem(`termincount-actions:${id}`), poll.id)).toBeNull();
});


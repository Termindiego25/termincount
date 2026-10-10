import { expect, test } from '@playwright/test';
import pg from 'pg';

const origin = 'http://127.0.0.1:4173';

test('treats inherited object keys as unsupported languages', async ({ request }) => {
	for (const language of ['constructor', '__proto__', 'toString']) {
		const response = await request.post('/api/polls', { headers: { origin }, data: { language } });
		expect(response.status()).toBe(201);
		const { poll } = await response.json();
		expect(poll.language).toBe('en');
		expect((await request.get(`/p/${poll.id}`)).status()).toBe(200);
	}
});
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? 'postgres://termincount:termincount@127.0.0.1:5432/termincount' });
test.afterAll(() => db.end());

test('requires ownership and same-origin writes and rejects malformed input', async ({ request, playwright }) => {
	const created = await request.post('/api/polls', { headers: { origin }, data: { title: 'API review', options: ['Yes'] } });
	expect(created.status()).toBe(201);
	const { poll } = await created.json();
	const path = `/api/polls/${poll.id}`;
	const outsider = await playwright.request.newContext({ baseURL: origin });
	try {
		for (const action of ['vote', 'undo']) {
			const response = await outsider.post(`${path}/${action}`, { headers: { origin }, data: { index: 0 } });
			expect(response.status()).toBe(403);
		}
	} finally { await outsider.dispose(); }
	expect((await request.post(`${path}/vote`, { headers: { origin: 'https://attacker.example' }, data: { index: 0 } })).status()).toBe(403);
	expect((await request.post(`${path}/vote`, { data: { index: 0 } })).status()).toBe(403);
	for (const index of ['0oops', 0.5, -1, 9, null]) {
		expect((await request.post(`${path}/vote`, { headers: { origin }, data: { index } })).status()).toBe(400);
	}
	expect((await request.post('/api/polls', { headers: { origin }, data: { options: [{ label: 'bad' }] } })).status()).toBe(400);
	expect((await request.post('/api/polls', { headers: { origin }, data: { title: 'x'.repeat(20_000) } })).status()).toBe(413);
});

test('keeps a custom title with default options and prevents caching owner pages', async ({ request }) => {
	const created = await request.post('/api/polls', { headers: { origin }, data: { title: 'Assembly', options: [] } });
	const { poll } = await created.json();
	expect(poll.title).toBe('Assembly');
	expect(poll.options).toHaveLength(4);
	const response = await request.get(`/p/${poll.id}`);
	expect(response.headers()['cache-control']).toContain('no-store');
	expect(response.headers()['x-robots-tag']).toContain('noindex');
	expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
});

test('counts concurrent votes with a single pooled connection and ordered revisions', async ({ request }) => {
	const created = await request.post('/api/polls', { headers: { origin }, data: { options: ['Yes', 'No'] } });
	const { poll } = await created.json();
	const votes = await Promise.all(Array.from({ length: 20 }, (_, n) =>
		request.post(`/api/polls/${poll.id}/vote`, { headers: { origin }, data: { index: n % 2 } })
	));
	for (const response of votes) expect(response.status()).toBe(200);
	const results = await Promise.all(votes.map((response) => response.json()));
	expect(new Set(results.map(({ poll: result }) => result.revision)).size).toBe(20);
	const undone = await request.post(`/api/polls/${poll.id}/undo`, { headers: { origin } });
	const { poll: result } = await undone.json();
	expect(result.revision).toBe('21');
	expect(result.options.reduce((sum: number, option: { votes: number }) => sum + option.votes, 0)).toBe(19);
});

test('rejects reads and writes for expired polls', async ({ request }) => {
	const created = await request.post('/api/polls', { headers: { origin }, data: {} });
	const { poll } = await created.json();
	await db.query("UPDATE polls SET expires_at = now() - interval '1 minute' WHERE id = $1", [poll.id]);
	for (const path of [`/p/${poll.id}`, `/api/polls/${poll.id}/events`]) expect((await request.get(path)).status()).toBe(404);
	expect((await request.post(`/api/polls/${poll.id}/vote`, { headers: { origin }, data: { index: 0 } })).status()).toBe(404);
});

test('updates viewers on another replica after the LISTEN connection is lost', async ({ page, browser }) => {
	await page.goto('/');
	await page.locator('#startPoll').click();
	await expect(page).toHaveURL(/\/p\/[A-Za-z0-9_-]+$/);
	const viewerContext = await browser.newContext();
	try {
		const viewer = await viewerContext.newPage();
		await viewer.goto(page.url().replace(':4173', ':4174'));
		await expect(viewer.locator('.live-pill')).toHaveClass(/connected/);
		await db.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name = 'termincount_realtime'");
		await page.locator('.vote-option[data-index="0"]').click();
		await expect(viewer.locator('#slot-0-label')).toHaveText('1', { timeout: 15_000 });
		await expect(viewer.locator('.live-pill')).toHaveClass(/connected/);
	} finally { await viewerContext.close(); }
});

test('reopens an EventSource that received a temporary HTTP error', async ({ page, browser }) => {
	await page.goto('/');
	await page.locator('#startPoll').click();
	await expect(page).toHaveURL(/\/p\/[A-Za-z0-9_-]+$/);
	const context = await browser.newContext();
	try {
		const viewer = await context.newPage();
		let unavailable = true;
		let failures = 0;
		await viewer.route('**/api/polls/*/events', async (route) => {
			if (unavailable) {
				failures += 1;
				await route.fulfill({ status: 503 });
			} else await route.continue();
		});
		await viewer.goto(page.url());
		await expect.poll(() => failures).toBeGreaterThan(0);
		unavailable = false;
		await page.locator('.vote-option[data-index="0"]').click();
		await expect(viewer.locator('#slot-0-label')).toHaveText('1', { timeout: 15_000 });
		await expect(viewer.locator('.live-pill')).toHaveClass(/connected/);
	} finally { await context.close(); }
});

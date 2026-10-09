import { expect, test } from '@playwright/test';

test('preserves runtime HTTPS origin behind an HTTP reverse proxy', async ({ playwright }) => {
	const request = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:4175' });
	try {
		const origin = 'https://proxy.example.test';
		const created = await request.post('/api/polls', {
			headers: { origin, host: 'untrusted.example' }, data: { title: 'Proxy test' }
		});
		expect(created.status()).toBe(201);
		const { poll, url } = await created.json();
		expect(url).toBe(`${origin}/p/${poll.id}`);
		const cookie = created.headers()['set-cookie'];
		expect(cookie).toMatch(/HttpOnly/i);
		expect(cookie).toMatch(/Secure/i);
		const headers = { origin, cookie: cookie.split(';')[0] };
		const vote = await request.post(`/api/polls/${poll.id}/vote`, { headers, data: { index: 0 } });
		expect(vote.status()).toBe(200);
		const denied = await request.post(`/api/polls/${poll.id}/vote`, {
			headers: { ...headers, origin: 'https://untrusted.example' }, data: { index: 0 }
		});
		expect(denied.status()).toBe(403);
		const page = await request.get(`/p/${poll.id}`, { headers });
		expect(await page.text()).toContain(`${origin}/p/${poll.id}`);
	} finally {
		await request.dispose();
	}
});

test('preserves configured HTTP origin for direct local deployments', async ({ request }) => {
	const created = await request.post('/api/polls', {
		headers: { origin: 'http://127.0.0.1:4173' }, data: {}
	});
	expect(created.status()).toBe(201);
	expect((await created.json()).url).toMatch(/^http:\/\/127\.0\.0\.1:4173\/p\//);
	expect(created.headers()['set-cookie']).not.toMatch(/;\s*Secure/i);
});

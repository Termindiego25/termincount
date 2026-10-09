import { expect, test } from '@playwright/test';

test('styles the initial server render before JavaScript runs', async ({ browser, request }) => {
	const response = await request.get('/');
	const html = await response.text();
	expect(html).toContain('rel="stylesheet"');
	const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
	try {
		const page = await context.newPage();
		await page.goto('http://127.0.0.1:4173/');
		await expect(page.locator('.app-container')).toHaveCSS('max-width', '920px');
		await page.screenshot({ path: 'artifacts/initial-render-without-js.png', fullPage: true });
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
	} finally {
		await context.close();
	}
});

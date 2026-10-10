import { expect, test } from '@playwright/test';

test('preserves setup values entered before client hydration', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('termincount.lang', 'en'));
	let release: () => void = () => {};
	const ready = new Promise<void>((resolve) => { release = resolve; });
	await page.route(/\/_app\/.*\.js$/, async (route) => {
		await ready;
		await route.continue();
	});
	await page.goto('/', { waitUntil: 'commit' });
	await page.locator('#title').fill('Entered before hydration');
	await page.locator('#o1').fill('Preserved option');
	release();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await page.locator('#startPoll').click();
	await expect(page.locator('#question')).toHaveText('Entered before hydration');
	await expect(page.locator('.vote-option')).toHaveCount(1);
	await expect(page.locator('.option-label-text')).toHaveText('Preserved option');
});

test('preserves an early language selection ahead of the stored preference', async ({ page }) => {
	// On phones the selector is inside the JS-controlled closed menu; use a visible desktop selector.
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.addInitScript(() => localStorage.setItem('termincount.lang', 'es'));
	let release: () => void = () => {};
	const ready = new Promise<void>((resolve) => { release = resolve; });
	await page.route(/\/_app\/.*\.js$/, async (route) => {
		await ready;
		await route.continue();
	});
	await page.goto('/', { waitUntil: 'commit' });
	await page.locator('#lang-select').selectOption('en');
	release();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page).toHaveTitle('TerminCount - Vote Count');
	expect(await page.evaluate(() => localStorage.getItem('termincount.lang'))).toBe('en');
});

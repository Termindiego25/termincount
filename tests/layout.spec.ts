import { expect, test } from '@playwright/test';

test('fits long labels and controls from phones through desktop', async ({ page }, testInfo) => {
	await page.goto('/');
	await page.locator('#title').fill('A'.repeat(140));
	await page.locator('#o1').fill('B'.repeat(80));
	await page.locator('#startPoll').click();
	await expect(page).toHaveURL(/\/p\/[A-Za-z0-9_-]+$/);
	await expect(page.locator('.option-label-text')).toHaveText('B'.repeat(80));
	for (const width of [320, 390, 720, 768, 900, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
		const contained = await page.locator('.tool-panel').evaluateAll((panels) => panels.every((panel) => {
			const bounds = panel.getBoundingClientRect();
			return [...panel.querySelectorAll('button, input, h3')].every((element) => {
				const rect = element.getBoundingClientRect();
				return rect.left >= bounds.left && rect.right <= bounds.right + 1;
			});
		}));
		expect(contained).toBe(true);
		if (width === 390 || width === 1280) {
			await page.screenshot({ path: testInfo.outputPath(`layout-${width}.png`), fullPage: true });
		}
	}
});

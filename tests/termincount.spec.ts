import { expect, test } from '@playwright/test';

test('runs a default count and undo flow', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: /start counting|pasar a recuento|iniciar recompte/i }).click();

	await expect(page.locator('.vote-option')).toHaveCount(4);
	await page.locator('.vote-option[data-index="0"]').click();
	await page.locator('.vote-option[data-index="1"]').click();
	await page.getByRole('button', { name: /undo last vote|deshacer|desfer/i }).click();

	await expect(page.locator('#votos-emitidos')).toHaveText('1');
	await expect(page.locator('#slot-0-label')).toHaveText('1');
	await expect(page.locator('#slot-1-label')).toHaveText('0');
});

test('brand link returns to the setup screen', async ({ page }) => {
	await page.goto('/');
	await page.locator('#title').fill('Demo count');
	await page.locator('#startPoll').click();
	await page.locator('.vote-option[data-index="0"]').click();

	await expect(page.locator('#votos-emitidos')).toHaveText('1');
	await page.locator('.brand').click();

	await expect(page.locator('#startPoll')).toBeVisible();
	await expect(page.locator('#title')).toHaveValue('');
	await expect(page.locator('.vote-option')).toHaveCount(0);
});

test('escapes custom option labels', async ({ page }) => {
	await page.goto('/');
	await page.locator('#o1').fill('<img src=x onerror=alert(1)>');
	await page.locator('#startPoll').click();

	await expect(page.locator('.option-label-text')).toHaveText('<img src=x onerror=alert(1)>');
	await expect(page.locator('#option-container img')).toHaveCount(0);
});

test('updates language and theme controls', async ({ page }) => {
	await page.goto('/');
	await page.locator('#lang-select').selectOption('en');
	await expect(page).toHaveTitle('TerminCount - Vote Count');

	await page.locator('[data-action="theme-menu"]').click();
	await expect(page.locator('[data-theme-choice="auto"]')).toHaveText('System');
	await page.locator('[data-theme-choice="dark"]').click();

	await expect(page.locator('[data-theme-current]')).toHaveText('Dark');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

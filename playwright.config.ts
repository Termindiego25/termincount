import { defineConfig, devices } from '@playwright/test';

const databaseUrl =
	process.env.DATABASE_URL ?? 'postgres://termincount:termincount@127.0.0.1:5432/termincount';

export default defineConfig({
	testDir: './tests',
	timeout: 30_000,
	expect: {
		timeout: 5_000
	},
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'node build',
		url: 'http://127.0.0.1:4173',
		env: {
			DATABASE_URL: databaseUrl,
			HOST: '127.0.0.1',
			PORT: '4173',
			ORIGIN: 'http://127.0.0.1:4173',
			TERMINCOUNT_RETENTION_DAYS: '7'
		},
		reuseExistingServer: false
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});

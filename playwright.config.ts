import { defineConfig, devices } from '@playwright/test';

const databaseUrl =
	process.env.DATABASE_URL ?? 'postgres://termincount:termincount@127.0.0.1:5432/termincount';

export default defineConfig({
	testDir: './tests',
	workers: 1,
	timeout: 30_000,
	expect: {
		timeout: 5_000
	},
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'on-first-retry'
	},
	webServer: [4173, 4174, 4176].map((port) => ({
		command: 'node tools/server.mjs',
		url: `http://127.0.0.1:${port}`,
		env: {
			DATABASE_URL: databaseUrl,
			HOST: '127.0.0.1',
			PORT: String(port),
			ORIGIN: port === 4176 ? 'https://proxy.example.test' : `http://127.0.0.1:${port}`,
			TERMINCOUNT_RETENTION_DAYS: '7',
			TERMINCOUNT_DB_POOL_SIZE: '1',
			BODY_SIZE_LIMIT: '16K',
			SHUTDOWN_TIMEOUT: '1'
		},
		reuseExistingServer: false
	})),
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'webkit-mobile',
			testMatch: ['**/layout.spec.ts', '**/hydration.spec.ts'],
			use: { ...devices['iPhone 13'] }
		}
	]
});

# Contributing

Use Node.js 26.11.1 or newer and npm 12.2.0. Install with `npm ci`; keep package-lock.json in every dependency change. TypeScript remains on 6.0.3 because the latest SvelteKit and svelte-check peer ranges do not support TypeScript 7 yet. Do not bypass peer checks with force/legacy-peer-deps.

Copy the environment and secret examples as described in the README. Use a dedicated development/test database, never a production database. The integration tests create polls, expire test records, and terminate TerminCount's realtime database connections to exercise recovery.

Before submitting a change, run `npm test`, `npm run build`, and `npm run test:e2e`. The browser tests require PostgreSQL, Chromium/WebKit (`npx playwright install chromium webkit`), and free ports 4173-4175. They intentionally run with a one-connection pool, two ordinary app processes and a third HTTPS-origin proxy fixture. Set DATABASE_URL when using a non-default local database. The responsive-layout check also runs on WebKit with an iPhone profile.

Keep all five language dictionaries consistent, preserve keyboard and read-only workflows, and check mobile layouts. Describe the behavior changed and the checks performed in the pull request.

Release instructions are in [Maintainers](docs/MAINTAINERS.md); deployment and restore procedures are in [Operations](docs/OPERATIONS.md).

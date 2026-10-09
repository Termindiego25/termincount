# TerminCount

TerminCount is a lightweight manual vote counter with temporary, shareable live results. One operator registers votes during a meeting, assembly, or class; everyone else follows a read-only result page. It is part of TerminSuite and also works independently.

[Live app](https://termincount.diegosr.es) | [Docker Hub](https://hub.docker.com/r/termindiego25/termincount) | [Changelog](CHANGELOG.md)

## Features

- Optional title and up to nine custom options, or the default in favour / against / blank / null options.
- Click/tap vote controls, keyboard keys 1-9, and R to undo the last vote.
- Ordered, retry-safe vote/undo requests with recovery of pending actions in the same browser tab.
- Public random result URLs, a QR code, and a copy-link button for the creator.
- Owner-only writes through an HTTP-only browser-session cookie; public viewers cannot change votes.
- Live updates using Server-Sent Events and PostgreSQL LISTEN/NOTIFY, including across app replicas.
- Retention in days and automatic cleanup of expired polls.
- Spanish, Catalan, Galician, Basque, and English; light, neutral dark, and system themes.
- Responsive desktop/mobile views and an automatically updated copyright year.

## How it works

Create a poll with custom options, or leave the option fields empty for defaults. Starting the count stores it in PostgreSQL and opens `/p/{id}`. Each click/key press adds a vote; undo removes the most recent vote. Share the result URL to let others watch live.

The public ID contains 128 random bits and is not an editing credential. Anyone with the URL can read the result. Editing rights stay in the browser that created the count; clearing cookies, using a private browsing window, or switching browsers loses those rights. There is no account or ownership recovery yet.

Expired polls become inaccessible immediately. Database cleanup runs at startup and at the configured interval, so physical deletion may happen after expiry. Cleanup reclaims database capacity; PostgreSQL may retain allocated disk space for reuse.

TerminCount is a manual counter, not an authenticated remote-election platform. Participant voting and the future TerminVote integration are separate work.

## Quick start with Docker Compose

Clone or download this repository, then run these commands from its directory:

```bash
cp termincount.env.example termincount.env
cp postgresql.env.example postgresql.env
cp secrets/credentials/db_database.txt.example secrets/credentials/db_database.txt
cp secrets/credentials/db_username.txt.example secrets/credentials/db_username.txt
cp secrets/credentials/db_password.txt.example secrets/credentials/db_password.txt
```

Edit the password secret before starting. Keep `ORIGIN=http://localhost:8080` for this local example, then:

```bash
docker compose up -d
```

Open [http://localhost:8080](http://localhost:8080). The default Compose uses the `1.5.0` app and our refreshed PostgreSQL 18.6 image. Service/container names are `termincount_app` and `termincount_db`; each uses its own env file. Host ports bind to loopback: other computers must use a reverse proxy or an explicitly configured host binding. Database files persist in `./data/postgres`; credentials are mounted as Docker Secrets. Read the [dependency review](docs/DEPENDENCIES.md) for the database image's remaining upstream security findings.

On PowerShell, the same `cp` commands are available as aliases for `Copy-Item`. Docker and Docker Compose are required; Node/npm are only needed for development or building from source.

## Production behind Traefik

Use [deploy/compose.traefik.yaml](deploy/compose.traefik.yaml) as your deployment's docker-compose.yaml. Initialize the environment/secrets as above and create the shared proxy network if it does not exist:

```bash
docker network create termincount_net
```

Attach Traefik to this external network and adapt [deploy/traefik.example.yaml](deploy/traefik.example.yaml) to your hostname/certificate configuration. Set in termincount.env:

```env
ORIGIN=https://termincount.example.com
DB_HOST=termincount_db
```

Traefik forwards HTTP to `http://termincount:3000`. This Compose publishes no host ports and isolates PostgreSQL on an internal network. HTTPS certificates belong to Traefik; TerminCount does not mount or use them. `TERMINCOUNT_DOMAIN` from the old static server is obsolete.

The supplied Traefik example flushes SSE immediately and applies a write-only request limit. Preserve streaming through any other proxy. With Cloudflare, disable Rocket Loader for this host and bypass HTML/API/result-page caching; the application generates its own CSP and immutable asset filenames. See [Operations](docs/OPERATIONS.md) for network, certificate, backup, restore, and upgrade details.

## Running the Docker Hub image directly

Provide an existing PostgreSQL database. When the database is another container, both containers must join the same Docker network:

```bash
docker run -d --name termincount_app --network your-db-network \
  --restart unless-stopped --init --read-only --cap-drop ALL \
  --security-opt no-new-privileges:true \
  -p 127.0.0.1:8080:3000 \
  -e DATABASE_URL='postgres://user:password@your-db-host:5432/your-db-name' \
  -e ORIGIN='http://localhost:8080' \
  termindiego25/termincount:1.5.0
```

The connection string is an example: use your actual host/credentials, percent-encode reserved characters, and prefer `DATABASE_URL_FILE` or the individual `DB_*_FILE` variables with mounted secrets. Compose is the simpler deployment for most installations.

App image tags are `1.5.0` (this release), `1.5` (the release series), and `latest`. The separate database image is `termindiego25/termincount:postgres-18.6-1.5.0`; it does not replace the app's `latest` tag. Fix an exact version or digest for controlled upgrades. Both images support linux/amd64 and linux/arm64. The app runs as UID/GID 10001 on container port 3000 and uses Node 26 Current copied into scratch; rebuilding is still necessary to receive runtime/library security updates. ARM32 users must keep the older `1.3.2` image: official Node 26 images no longer provide linux/arm/v7.

## Configuration

Use KEY=value in env files. `termincount.env` holds app settings and credential-file paths, `postgresql.env` database initialization settings and credential-file paths, and `secrets/credentials/*.txt` database credentials. These files and database data are ignored by Git/build context; the `.example` files contain no real credentials.

| Variable | Default | Purpose |
| --- | --- | --- |
| `ORIGIN` | unset; local example uses `http://localhost:8080` | Browser-facing scheme + host + optional port, without credentials, path, query or fragment. Set explicitly for HTTP and HTTPS deployments. TerminCount preserves this runtime setting with adapter-node 6. |
| `DATABASE_URL` / `DATABASE_URL_FILE` | assembled from DB settings | Complete PostgreSQL URL or file containing it. Takes precedence over individual settings. |
| `DB_HOST` | `127.0.0.1` | Database hostname; use `termincount_db` in either Compose example. IPv6 hosts are supported. |
| `DB_PORT` | `5432` | Database port. |
| `DB_NAME` / `DB_NAME_FILE` | `termincount` | Database name or secret-file path. |
| `DB_USER` / `DB_USER_FILE` | `termincount` | Database user or secret-file path. |
| `DB_PASSWORD` / `DB_PASSWORD_FILE` | `termincount` | Database password or secret-file path; replace development defaults. |
| `TERMINCOUNT_RETENTION_DAYS` | `7` | Poll lifetime in days, bounded to 1-365. |
| `TERMINCOUNT_CLEANUP_INTERVAL_MINUTES` | `60` | Cleanup frequency, bounded to 5-1440 minutes. |
| `TERMINCOUNT_DB_POOL_SIZE` | `10` | Connections per app pool, integer 1-100; each replica also uses a LISTEN connection. |
| `HOST` / `PORT` | `0.0.0.0` / `3000` in Docker | Internal listening address/port. |
| `BODY_SIZE_LIMIT` | `16K` in Docker | Node adapter request limit; JSON endpoints also reject oversized declared payloads. |
| `SHUTDOWN_TIMEOUT` | `30` seconds | Node adapter grace period for connections during shutdown. |
| `TERMINCOUNT_VERSION` | `1.5.0` in Compose | App image tag, supplied through the shell/project .env. |
| `TERMINCOUNT_PORT` / `POSTGRES_PORT` | `8080` / `5432` in default Compose | Loopback host ports, supplied through the shell/project .env; absent from the Traefik Compose. |

An explicit environment value wins over its `_FILE` variant. `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` (also `_FILE`) are supported as legacy database-setting aliases. PostgreSQL's own `POSTGRES_*_FILE` initialization values are set in postgresql.env.

The project `.env` provides Compose substitutions. A service's env_file provides variables to that container; it does not set image tags or port substitutions for Compose. Database initialization secrets affect only an empty PostgreSQL data directory. See [Operations](docs/OPERATIONS.md) before changing them on an existing deployment.

## Persistence, backups, and scaling

Polls, options, vote events, mutation receipts, owner-session hashes, and expiry dates are stored in PostgreSQL. The browser queues actions in order and retries ambiguous responses with the same receipt key; with sessionStorage available, a reload of that tab resumes pending work. This is not an offline voting mode: wait for confirmation and do not clear browser storage with a pending action.

App containers can be replaced or replicated using the same database and public ORIGIN. Notifications reach every replica; sticky sessions are unnecessary. The supplied Compose intentionally uses fixed container names and cannot use `--scale` unchanged: replicas need distinct names/an override and a load balancer. PostgreSQL itself remains a single availability dependency unless you separately configure database HA.

Back up a live database with pg_dump. An offline folder copy is valid only after PostgreSQL is stopped and file permissions are preserved. Back up configuration/secrets securely and test a restore into a separate installation. The provided server configuration alone is not a data backup. Detailed commands are in [Operations](docs/OPERATIONS.md).

## Health and troubleshooting

`/healthz` returns 204 after initialization and a live database query, or 503 when the database is unavailable. Docker's health check uses this endpoint. Transient database/listener failures are retried; connected browsers reopen interrupted SSE streams.

For a proxy 404, check router loading/hostname rules. For a 502, check the shared network and upstream port 3000. For an unstyled page, check asset responses, CSP errors, and Cloudflare Rocket Loader. If creating a poll fails, check ORIGIN and database connectivity. An existing public link works without the owner's cookie but cannot edit votes.

## Development and checks

Use Node 26.11.1+ and npm 12.2.0. For a local database and dev server:

```bash
npm ci
cp .env.example .env
docker compose up -d termincount_db
npm run dev
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765). Match DATABASE_URL to your development secrets. For the built server, production does not automatically load `.env`; use `node --env-file=.env tools/server.mjs` with the matching ORIGIN/PORT. Do not bypass this entrypoint when relying on runtime ORIGIN.

```bash
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
npm audit
```

Use a dedicated test database. E2E/API tests start three app instances on 4173, 4174 and 4176 with single-connection pools and exercise ownership, input limits, concurrent writes, retry deduplication, lost responses, pending-action recovery, expiration under locks, result navigation, listener recovery, live results, HTTP/HTTPS proxy configuration, and mobile layout. Set DATABASE_URL in your shell when the test database differs from the example.

For local images, `docker build -t termindiego25/termincount:1.5.0 .` and `docker build -f deploy/postgres/Dockerfile -t termindiego25/termincount:postgres-18.6-1.5.0 .` build from the current source. Release/export/publishing instructions and SBOM/provenance handling are documented separately for [Maintainers](docs/MAINTAINERS.md).

Type checking uses TypeScript 7 through the official svelte-check `--tsgo` integration and `@typescript/native` alias. TypeScript 6 remains only as the compatibility library required by SvelteKit/checker's existing JavaScript APIs; no peer constraints are bypassed. npm's bundled node-gyp/Undici are updated together. See [Dependency review](docs/DEPENDENCIES.md) for exact versions, scan scope and unresolved upstream findings. Node 26 is Current, not LTS, and requires following its subsequent release/support cycle.

## Project structure

```text
src/lib/                 Shared UI, translations, and types
src/lib/server/          Database, session, poll transactions, realtime fan-out
src/routes/              Setup, results, API, and health endpoints
src/hooks.server.ts      Security/cache headers and shutdown cleanup
static/                  Icons, logo, and crawler policy
tests/                   Browser and API regression tests
deploy/                  Traefik and production Compose examples
docs/                    Operations and maintainer procedures
tools/                   Project checks and reproducible release export
tools/npm-bundle/        Locked fixes for npm's bundled build-tool dependencies
```

Built with SvelteKit, Svelte, TypeScript, Vite, PostgreSQL, Bootstrap CSS, and Playwright. See [Contributing](CONTRIBUTING.md) and [Security policy](SECURITY.md).

## License

GPL-3.0. See [LICENSE](LICENSE).

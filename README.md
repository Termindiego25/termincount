# TerminCount

TerminCount is a lightweight web app for creating temporary, shareable, live vote counts. It is designed for meetings, assemblies, classrooms, live demos, and any situation where one trusted operator needs to register votes while everyone else can follow the result in real time.

Live demo: [https://termincount.diegosr.es](https://termincount.diegosr.es)

Docker Hub: [termindiego25/termincount](https://hub.docker.com/r/termindiego25/termincount)

## Features

- Manual vote counting with custom options.
- Up to 9 voting options.
- Default options when no custom option is provided: in favour, against, blank, and null.
- Shareable result URL with a short random public id.
- Compact QR code and copy-link tools for the count creator.
- Read-only public result page.
- Owner-only vote controls protected by an HTTP-only session cookie.
- Live result updates through Server-Sent Events.
- Automatic expiration and cleanup of old vote counts.
- Keyboard shortcuts with keys `1` to `9`, plus `R` to undo the last vote.
- Spanish, Catalan, Galician, Basque, and English interface.
- Light, dark, and system theme modes.

## How It Works

1. Enter an optional poll title.
2. Add one or more voting options, or leave the setup empty to use the default options.
3. Start the count.
4. TerminCount stores the temporary poll in PostgreSQL and opens `/p/{id}`.
5. The creator can register votes by clicking an option or by pressing the matching number key.
6. Anyone with the result link can view the live result, but cannot modify votes.
7. The poll is deleted automatically after the configured retention period.

The public URL is not a permission token. Modification rights are tied to the browser session that created the count.

## Run With Docker Compose

The recommended deployment uses the app container plus PostgreSQL:

```bash
docker compose up -d --build
```

Open [http://localhost:8080](http://localhost:8080).

The Compose file starts:

- `termincount`: SvelteKit Node server.
- `termincount-db`: PostgreSQL 18 with persistent data in `./data/postgres`.

The `data/` folder is ignored by Git and Docker builds. To make a simple offline backup, stop the containers and back up the project folder, including `data/postgres`. For a live production backup, prefer a PostgreSQL dump so the backup is transaction-consistent.

## Run With Docker Hub

When using the published image directly, provide a PostgreSQL database through `DATABASE_URL`:

```bash
docker run -d \
  --name termincount \
  --restart unless-stopped \
  -p 8080:3000 \
  -e DATABASE_URL="postgres://termincount:termincount@db:5432/termincount" \
  -e ORIGIN="http://localhost:8080" \
  termindiego25/termincount:latest
```

For most installations, Docker Compose is easier because it includes PostgreSQL.

Available image tags:

- `1.3.0`: exact release.
- `1.3`: latest compatible release in the 1.3 series.
- `latest`: latest published release.

## Configuration

Environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://termincount:termincount@127.0.0.1:5432/termincount` | PostgreSQL connection string. |
| `POSTGRES_PASSWORD` | `termincount` in Compose | PostgreSQL password used by Docker Compose. Change it in production. |
| `POSTGRES_PORT` | `5432` in Compose | Host port exposed for PostgreSQL. |
| `TERMINCOUNT_PORT` | `8080` in Compose | Host port exposed for the web app. |
| `TERMINCOUNT_RETENTION_DAYS` | `7` | Number of days before temporary polls expire. |
| `TERMINCOUNT_CLEANUP_INTERVAL_MINUTES` | `60` | Interval for automatic cleanup of expired polls. |
| `ORIGIN` | unset | Public origin used by SvelteKit behind proxies. Set this in production. |
| `HOST` | `0.0.0.0` in Docker | Host used by the Node server. |
| `PORT` | `3000` in Docker | Port used by the Node server. |

Retention is intentionally configured in days because result links are meant to be temporary but useful after the meeting.

## Persistence And Scaling

Polls, vote options, vote events, owner session hashes, expiration dates, and live update counters are stored in PostgreSQL. The SvelteKit app containers are stateless, so multiple app instances can serve the same installation as long as they point to the same PostgreSQL database and share the same public `ORIGIN`.

PostgreSQL `LISTEN` / `NOTIFY` broadcasts result changes to every app instance, so live result pages keep updating even when traffic is split between replicas. Put a reverse proxy or load balancer in front of the app containers instead of publishing the same host port from every replica.

## HTTPS

TerminCount serves HTTP inside the container. For production, run it behind a reverse proxy that handles HTTPS, certificates, compression, and HTTP-to-HTTPS redirects. Good options include Traefik, Caddy, Nginx Proxy Manager, Cloudflare Tunnel, or your hosting platform's built-in proxy.

When using a reverse proxy, set `ORIGIN` to the public HTTPS URL, for example:

```yaml
environment:
  ORIGIN: https://termincount.example.com
```

For live updates, make sure the proxy does not buffer Server-Sent Events responses from `/api/polls/*/events`.

## Health Check

The app exposes:

```text
/healthz
```

It returns `204 No Content` when the app can connect to PostgreSQL and the schema is ready.

## Local Development

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
docker compose up -d db
```

Start the development server:

```bash
npm run dev -- --port 8765
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765).

Copy `.env.example` if you want to customize the database URL or retention settings locally.

## Checks

Run Svelte/TypeScript validation and project smoke checks:

```bash
npm test
```

Build the production server:

```bash
npm run build
```

Run end-to-end browser tests after PostgreSQL is available:

```bash
npm run build
npm run test:e2e
```

If Playwright has not installed Chromium yet:

```bash
npx playwright install chromium
```

## Technology

- [SvelteKit](https://svelte.dev/docs/kit) with `adapter-node` for full-stack routing.
- [TypeScript](https://www.typescriptlang.org/) for safer application logic.
- [PostgreSQL](https://www.postgresql.org/) for temporary poll persistence and concurrency.
- PostgreSQL `LISTEN` / `NOTIFY` plus Server-Sent Events for live result updates.
- [Vite](https://vite.dev/) for development and optimized builds.
- [Bootstrap CSS](https://getbootstrap.com/) as a managed npm dependency, without Bootstrap JavaScript.
- [Playwright](https://playwright.dev/) for browser regression tests.

## Docker Image

The production image is built from Node 22 Alpine and finishes on a minimal `scratch` runtime running as a non-root user. That keeps the image small, removes unused shell/package-manager tools from production, and preserves common multi-architecture targets including `linux/amd64`, `linux/arm64`, and `linux/arm/v7`.

The image includes OCI metadata for title, description, author, vendor, documentation, source, version, revision, creation date, and license.

Release images should be published with SBOM and provenance attestations so Docker Scout can evaluate the supply chain metadata attached to the image.

## Project Structure

```text
src/
  app.html                 HTML template
  app.css                  Global styles and theme tokens
  lib/
    AppShell.svelte        Shared app chrome, language, and theme controls
    i18n.ts                Translation dictionaries and helpers
    polls.ts               Shared poll/result types
    voting.ts              Voting helpers
    server/                PostgreSQL, sessions, poll writes, realtime events
  routes/
    +page.svelte           Poll creation screen
    p/[id]/                Shareable live result page
    api/polls/             Poll creation, voting, undo, and SSE endpoints
    healthz/               Container health endpoint

static/
  images/                  Logo, manifest, and favicons

tests/
  termincount.spec.ts      End-to-end tests

tools/
  smoke-test.mjs           Project sanity checks
```

## Future Direction

Version 1.3 adds temporary shared result pages and live updates. The next natural step is a separate voting app that lets participants submit votes directly while TerminCount keeps the live tally and owner controls.

## License

GPL-3.0. See [LICENSE](LICENSE).

# TerminCount

TerminCount is a lightweight web app for setting up and running manual vote counts from the browser. It is designed for meetings, assemblies, classrooms, live demos, and any situation where you need a fast, clear way to count votes across a small set of options.

Live demo: [https://termincount.diegosr.es](https://termincount.diegosr.es)

Docker Hub: [termindiego25/termincount](https://hub.docker.com/r/termindiego25/termincount)

## Features

- Manual vote counting with custom options.
- Up to 9 voting options.
- Default options when no custom option is provided: in favour, against, blank, and null.
- Keyboard shortcuts with keys `1` to `9`, plus `R` to undo the last vote.
- Clickable and keyboard-focusable vote rows.
- Live totals and percentages.
- Spanish, Catalan, Galician, Basque, and English interface.
- Light, dark, and system theme modes.
- Logo/title link that returns to the setup screen.
- Fully local counting workflow. Votes are not sent to any remote service.

## How It Works

1. Enter an optional poll title.
2. Add one or more voting options, or leave the setup empty to use the default options.
3. Start the count.
4. Register votes by clicking an option or by pressing the matching number key.
5. Use `R` or the undo button to undo the last vote.
6. Click the logo/title to return to the setup screen.

Language and theme preferences are stored in the browser with `localStorage`. Vote counts are kept in the current browser session only.

## Run With Docker Hub

The easiest way to run TerminCount is to use the published Docker image:

```bash
docker run -d \
  --name termincount \
  --restart unless-stopped \
  -p 8080:80 \
  termindiego25/termincount:latest
```

Open [http://localhost:8080](http://localhost:8080).

You can also pin a specific version:

```bash
docker run -d \
  --name termincount \
  --restart unless-stopped \
  -p 8080:80 \
  termindiego25/termincount:1.2.0
```

Available tags:

- `1.2.0`: exact release.
- `1.2`: latest compatible release in the 1.2 series.
- `latest`: latest published release.

By default, the container serves HTTP on internal port `80`. Internal port `443` is only enabled when TLS certificates are mounted into the container.

## Run From GitHub

Clone the repository:

```bash
git clone https://github.com/Termindiego25/termincount.git
cd termincount
```

Start the app with Docker Compose:

```bash
docker compose up -d --build
```

Open [http://localhost:8080](http://localhost:8080).

## Optional HTTPS

For production deployments, the recommended setup is to run TerminCount behind a reverse proxy that handles HTTPS, such as Traefik, Caddy, Nginx Proxy Manager, Cloudflare Tunnel, or your hosting platform's built-in proxy. In that setup, TerminCount can keep serving plain HTTP inside the private Docker network while the proxy handles certificates, renewals, and HTTP-to-HTTPS redirects.

The container can also serve HTTPS directly if you mount TLS certificates at `/etc/termincount/certs` with these filenames:

- `fullchain.pem`
- `privkey.pem`

Example:

```bash
docker run -d \
  --name termincount \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v ./ssl:/etc/termincount/certs:ro \
  termindiego25/termincount:latest
```

When both certificate files are present, the container serves HTTPS and redirects HTTP to HTTPS. If the certificates are not mounted, publishing `443:443` has no effect because the HTTPS server is not started.

For local HTTPS testing, you can map `8443:443`, then open `https://localhost:8443`. You will need certificates valid for that hostname, or you will need to accept the browser warning when using self-signed certificates.

## Health Check

The container exposes a health endpoint:

```text
/healthz
```

It returns `204 No Content` when the server is running.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

By default, Vite serves the app at [http://127.0.0.1:8765](http://127.0.0.1:8765), or at the next available port if that one is already in use.

## Checks

Run Svelte/TypeScript validation and project smoke checks:

```bash
npm test
```

Build the static production output:

```bash
npm run build
```

Run end-to-end browser tests:

```bash
npm run build
npm run test:e2e
```

If Playwright has not installed Chromium yet:

```bash
npx playwright install chromium
```

## Technology

- [SvelteKit](https://svelte.dev/docs/kit) for the app structure and future backend routes.
- [TypeScript](https://www.typescriptlang.org/) for safer application logic.
- [Vite](https://vite.dev/) for development and optimized builds.
- [Bootstrap CSS](https://getbootstrap.com/) as a managed npm dependency, without Bootstrap JavaScript.
- [Playwright](https://playwright.dev/) for browser regression tests.
- A minimal Go static server in a `scratch` Docker runtime image.

## Docker Image

The production image is intentionally small. Build dependencies are kept in intermediate stages, while the final image contains only:

- the static SvelteKit build output
- the TerminCount static server binary

The final runtime image is based on `scratch`, exposes ports `80` and `443`, and includes OCI metadata for title, description, author, vendor, documentation, source, version, revision, creation date, and license.

## Project Structure

```text
src/
  app.html                 HTML template
  app.css                  Global styles and theme tokens
  lib/
    i18n.ts                Translation dictionaries and helpers
    voting.ts              Voting types and pure helpers
    server/                Reserved boundary for future backend code
  routes/
    +layout.ts             Global imports and prerender configuration
    +page.svelte           Main interface

static/
  images/                  Logo, manifest, and favicons

tests/
  termincount.spec.ts      End-to-end tests

tools/
  smoke-test.mjs           Project sanity checks
  static-server/           Minimal Docker runtime server
```

## Future Direction

Version 1.2 keeps the current manual counting workflow, while the migration to SvelteKit leaves a cleaner foundation for future features such as shareable result URLs, temporary database storage, and a connected voting app.

The intended path for those features is:

1. Keep the interface in SvelteKit.
2. Add routes such as `/results/[id]` and `/vote/[id]`.
3. Switch from `@sveltejs/adapter-static` to a server adapter if backend execution is needed.
4. Add database access under `src/lib/server`.
5. Choose polling, SSE, WebSockets, or a realtime provider depending on the final hosting model.

## License

GPL-3.0. See [LICENSE](LICENSE).

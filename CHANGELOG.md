# Changelog

## 1.5.1 - 2026-10-10

- Run the single-process Node server directly, without an unnecessary Docker init binary that can fail to execute under rootless deployments.
- Preserve the adapter's native graceful shutdown; verify signal handling with an active live-result stream.
- Drain live streams as soon as shutdown starts, rather than waiting for the adapter's 30-second forced connection deadline.
- Preserve a language selected before hydration instead of reverting it to the stored preference.

No schema, cookie or poll URL changes from 1.5.0. This patch does not change host/Docker permissions or the unresolved upstream database findings.

## 1.5.0 - 2026-10-10

- Enable TypeScript 7 through the official svelte-check alias/--tsgo integration, retaining TypeScript 6 only for upstream JavaScript API compatibility.
- Upgrade npm's bundled node-gyp to 13.1.0 and Undici to 8.11.2 together; test a real native addon/header download in CI.
- Update Node types to 26.6.5 and pin/watch the latest Node 26.11.1 and PostgreSQL 18.6 image versions.
- Deduplicate keyed vote/undo retries in PostgreSQL, including empty undo operations; recover pending browser-tab actions after a lost response or reload.
- Reject writes that expire while waiting on a database lock; reset the result view/subscription when navigating between polls.
- Preserve options typed before JavaScript hydration completes, including slow/mobile connections.
- Clean expired polls in background batches with lock skipping instead of one startup-blocking delete.
- Restore fixed termincount_app/termincount_db container names, per-service env files and Docker Secrets; keep Traefik's termincount alias.
- Add a separately tagged PostgreSQL image with available Alpine security updates and su-exec 0.3 instead of the old Go startup helper. Document unresolved upstream libxml2 findings rather than suppressing them.

The new receipt table is additive; existing PostgreSQL 18 data, owner cookies and URLs remain compatible. Review the Compose-name migration and pending-action/rollback precautions in Operations before deployment.

## 1.4.0 - 2026-10-09

- Move the runtime and CI to Node 26 Current and npm 12; migrate to SvelteKit 3 and adapter-node 6 with matching Node 26 types.
- Move configuration into the Vite plugin, use native subpath imports and remove the obsolete cookie 1 override.
- Preserve runtime ORIGIN, owner cookies and CSRF checks across direct HTTP and HTTPS reverse-proxy deployments.
- Include Node 26's required libatomic library in the non-root scratch runtime.
- Upgrade Alpine packages during releases and patch vulnerable npm-bundled libraries using locked, API-compatible dependency updates.
- Check the real container startup in CI, not just JavaScript dependencies.
- Add HTTP/HTTPS-origin regression tests. Existing data, poll URLs, secrets and owner cookies remain compatible.

Images now target linux/amd64 and linux/arm64. Official Node 26 images do not support linux/arm/v7; 1.3.2 remains the last published ARM32 release. This release retained TypeScript 6; the official TypeScript 7 compatibility integration was adopted in 1.5.0.

## 1.3.2 - 2026-10-09

- Include global styles in the initial server-rendered HTML instead of waiting for client-side JavaScript.
- Add a regression check for styled, overflow-free initial rendering with JavaScript disabled.

No data, cookie, schema, or configuration migration is required from 1.3.1.

## 1.3.1 - 2026-10-09

- Update compatible SvelteKit, Svelte, Vite, PostgreSQL client, and browser-test dependencies; track the npm lockfile for reproducible builds.
- Recover after database startup failures, idle connection failures, and interrupted realtime listeners.
- Reopen browser SSE connections after temporary HTTP failures, with bounded retry backoff.
- Commit vote changes and notifications together; prevent pool exhaustion and stale responses from reversing the displayed result.
- Read one consistent snapshot per poll and share realtime reads between viewers on each replica.
- Release canceled SSE connections and expire streams even when no new votes arrive.
- Preserve custom titles when default options are used; label all option inputs for assistive technology.
- Reject cross-origin writes, malformed vote indices, and oversized requests; prevent caching of session-specific pages.
- Restore the TerminCount manifest metadata after the icon update.
- Keep unbroken long titles and tool controls inside mobile/tablet viewports.
- Add deployment examples, backup/restore instructions, release tooling, and integration coverage for security, concurrency, expiration, and replicas.

Existing PostgreSQL tables, poll URLs, owner cookies, and Docker Secrets remain compatible. No database migration or PostgreSQL major-version change is required.

## 1.3.0

Temporary PostgreSQL-backed polls, public read-only URLs, QR sharing, owner-only controls, and live updates through SSE and PostgreSQL LISTEN/NOTIFY. Follow-up fixes added mobile stacking, the neutral dark theme, automatic copyright years, and new icons.

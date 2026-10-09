# Changelog

## 1.4.0 - 2026-10-09

- Move the runtime and CI to Node 26 Current and npm 12; migrate to SvelteKit 3 and adapter-node 6 with matching Node 26 types.
- Move configuration into the Vite plugin, use native subpath imports and remove the obsolete cookie 1 override.
- Preserve runtime ORIGIN, owner cookies and CSRF checks across direct HTTP and HTTPS reverse-proxy deployments.
- Include Node 26's required libatomic library in the non-root scratch runtime.
- Upgrade Alpine packages during releases and patch vulnerable npm-bundled libraries using locked, API-compatible dependency updates.
- Check the real container startup in CI, not just JavaScript dependencies.
- Add HTTP/HTTPS-origin regression tests. Existing data, poll URLs, secrets and owner cookies remain compatible.

Images now target linux/amd64 and linux/arm64. Official Node 26 images do not support linux/arm/v7; 1.3.2 remains the last published ARM32 release. TypeScript 7 is not yet supported by the latest Svelte tooling and is not forced into the dependency tree.

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

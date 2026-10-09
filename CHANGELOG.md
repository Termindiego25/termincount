# Changelog

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

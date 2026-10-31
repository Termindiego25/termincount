# Changelog

## Unreleased

- Review Dependabot #23-26: the pinned Wolfi PostgreSQL snapshot, moby/sys/user 0.5.0, npm's compatible ip-address 10.7.5 repair and Svelte 5.57.3.
- Repair the Go updater's empty-module failure using build-tagged dependency imports, locked checksums and non-mutating tidy checks against the real upstream helper source. Verify both repaired modules in the generated helper inventory.
- Refresh Node to 26.13.0, the stable release that starts Node 26's Lithium LTS phase; Node 27 alpha is not a production release.
- Update compatible SvelteKit 3.1.1, adapter-node 6.0.1 and Node type 26.6.6 patches, preserving the TypeScript 6 API bridge.
- Exercise replacement of the published 1.6.1 Wolfi database image without changing fixture data or collation versions.
- Document the newly reviewed low-severity deepmerge build-tool advisory, its lack of an upstream patched release and its exclusion from production dependencies. Do not force obsolete framework downgrades to hide the warning.

These source changes do not rebuild or overwrite the published 1.6.1 images and do not deploy an installation. Publication and controlled maintenance remain separate steps; preserve all existing database migration checkpoints.

## 1.6.1 - 2026-10-23

- Review and integrate Dependabot updates #17-20: the pinned Wolfi database snapshot, Syft 1.55.0 and Undici 8.12.3 for both application APIs and npm's build-tool repairs.
- Update Node to the 26.12.1 security release, npm to 12.2.1, Vite to 8.3.5 and the gosu build compiler to Go 1.27.3.
- Refresh the application/build Alpine 3.24 base to the available 3.24.3 image and APK updates.
- Require Alpine 3.24's vendor-patched musl 1.2.6-r3 or newer in both app stages. Record the Scout stable/edge revision mismatch without suppressing the finding.
- Refresh npm's compatible postcss-selector-parser repair to 7.1.7.
- Replace the helper's actual vendor inventory dynamically instead of assuming the old gosu package revision. Test that exactly one inventory remains and matches the locked x/sys version.
- Exercise replacement of a published 1.6.0 Wolfi database container with the reviewed image, retaining data and collation versions, before the full browser/API tests.
- Remove the obsolete 1.5.1 image selection from the project env example and guard release-version alignment across both Compose examples and Dockerfiles.

Install both 1.6.1 images to receive these fixes; the old 1.6.0 tags remain unchanged. Existing 1.6.0 Wolfi clusters use the same engine/data contract and need a verified backup and controlled container replacement, not another Alpine-to-Wolfi cutover. Preserve the original migration's rollback checkpoint. There are no schema, cookie, poll URL, credential or env-file changes.

## 1.6.0 - 2026-10-17

- Migrate the database image to digest-pinned Wolfi PostgreSQL 18.6 with libxml2 2.15.4, rebuilding gosu 1.19 with Go 1.27.2 and locked current dependencies instead of retaining the vulnerable helper.
- Refresh the Wolfi snapshot on release day, including OpenSSL 4.0.3-r7, SQLite 3.54.1-r0 and Heimdal 7.8.0-r54.
- Require a verified logical database migration for the libc change; reject legacy clusters without modifying them and test dump/restore, Secret initialization, XML, persistence and the complete browser/API suite.
- Refresh compatible transitive Rolldown 1.2.14/native bindings/types and PostCSS 8.5.30.
- Update the Node build/runtime images to 26.12.0 and align the minimum engine and smoke checks.
- Update SvelteKit to 3.1.0, svelte-check to 4.7.7 and Playwright to 1.64.1.
- Update the SHA-pinned setup-node action to 7.1.0 and npm's bundled ip-address repair to 10.7.4.
- Update the compatible npm Undici repair to 8.12.2 and recheck native addon compilation.
- Install Undici 8.12.2's matching web APIs before development, build and production startup, including container health checks. Node 26.12.0 still embeds the older 8.11.2; the application no longer relies on those globals. Add an uppercase-integrity regression test for the new security fixes.

This release preserves the application schema, credentials, poll URLs, env files and Secret paths. Both Compose examples select the new images. **Existing Alpine database installations must complete the [logical migration](docs/OPERATIONS.md#wolfi-database-migration) before starting the new database image.** An image swap or app-only recreate is not sufficient. Keep the old images, data directory and verified backup for rollback; never overwrite the 1.5.1 tags.

## 1.5.1 - 2026-10-10

- Run the single-process Node server directly, without an unnecessary Docker init binary that can fail to execute under rootless deployments.
- Preserve the adapter's native graceful shutdown; verify signal handling with an active live-result stream.
- Drain live streams as soon as shutdown starts, rather than waiting for the adapter's 30-second forced connection deadline.
- Preserve a language selected before hydration instead of reverting it to the stored preference.
- Validate locales against dictionary own keys and normalize unsupported legacy locale values when reading polls.

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

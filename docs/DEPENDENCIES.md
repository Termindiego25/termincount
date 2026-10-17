# Dependency and Service Review

Dependency review for 1.6.0, with engine versions rechecked on 2026-10-17. This covers TerminCount's source, build tools, app image and PostgreSQL service, not the host OS or Docker installation. Version freshness and known vulnerabilities are separate checks; no scan proves absence of unknown vulnerabilities. See the changelog for release changes; publication does not migrate existing installations automatically.

## Versions

| Surface | Reviewed version | Notes |
| --- | --- | --- |
| Node | 26.12.0 Current | Latest released version, explicitly selected over LTS; amd64/arm64 images. |
| App/build Alpine | 3.24.2 / 3.24 repositories | Current stable branch; available APK updates applied during builds. |
| npm | 12.2.0 | Latest npm, with reviewed bundled-library repairs below. |
| Svelte / SvelteKit | 5.57.2 / 3.1.0 | Latest releases. |
| adapter-node / Vite plugin | 6.0.0 / 7.3.1 | Runtime ORIGIN preserved by tools/server.mjs. |
| Vite / svelte-check | 8.3.4 / 4.7.7 | Type checking uses the native TypeScript 7 integration. |
| TypeScript | 7.0.2 compiler + 6.0.3 API bridge | Official alias pattern; no forced peer overrides. |
| Node types / Playwright | 26.6.5 / 1.64.1 | Latest releases. |
| pg / Bootstrap CSS / qrcode | 8.23.1 / 5.3.8 / 1.5.4 | Latest releases; no Bootstrap JavaScript or jQuery. |
| PostgreSQL | 18.6 | Latest stable engine; PostgreSQL 19 is RC1, not a production stable release. |
| PostgreSQL base / libxml2 | Wolfi / 2.15.4-r1 | 1.6.0 migration from the Alpine database image; base pinned by digest. |
| PostgreSQL startup helper | gosu 1.19 / Go 1.27.2 | Verified upstream source with locked user 0.4.1 / x/sys 0.49.0 repairs. |
| Helper SBOM generator | Syft 1.54.1 | Build-only; regenerates the inventory from the rebuilt executable. |
| Transitive build tools | Rolldown 1.2.14 / PostCSS 8.5.30 | Refreshed within the declared parent ranges, including matching native bindings/types. |
| setup-node / npm ip-address / Undici repairs | 7.1.0 / 10.7.4 / 8.12.2 | SHA-pinned CI action; compatible build-toolchain repairs. |

Verify current releases again when publishing, using the npm registry and official [Node](https://nodejs.org/en/about/previous-releases), [Alpine](https://www.alpinelinux.org/releases/) and [PostgreSQL](https://www.postgresql.org/docs/release/) release information. Pinned releases are reviewed and reproducible, not permanently up to date. Dependabot watches application/build dependencies, actions and both Dockerfiles.

GitHub Dependabot vulnerability alerts and automated security-update pull requests were enabled and verified on 2026-10-16. These are separate from the weekly version-update schedule in dependabot.yaml. New pull requests still require review and passing checks; enabling security updates does not automatically merge or deploy them.

`npm outdated --all` also lists optional packages for other platforms, different release channels and versions outside upstream libraries' declared ranges. These are not all actionable upgrades. Do not force newer incompatible majors into another package's internals or downgrade prerelease-channel packages just to clear that report. Refresh compatible lockfile ranges, update the owning package when available, and record the remaining contract (notably the required TypeScript 6 API bridge).

## TypeScript and npm Compatibility

The [official svelte-check integration](https://github.com/sveltejs/language-tools/blob/master/packages/svelte-check/README.md) installs TypeScript 7 as `@typescript/native` and uses `--tsgo`. TypeScript 6 remains for upstream tools using the JavaScript compiler API that TypeScript 7 removed. It is not the active type checker. The bridge's major is excluded from automatic Dependabot upgrades until those consumers migrate; the active compiler alias remains monitored. Deleting this bridge or using force/legacy-peer-deps would break supported tooling. The checker was verified with an intentional type error, not just a passing run. Generated checker cache is reset to avoid stale virtual files after a component is deleted/renamed.

npm 12 bundles node-gyp 13.0.0, whose Undici range is version 6. Our locked build repairs first update node-gyp to 13.1.0, within npm's accepted range; that parent supports Undici 8, so Undici 8.12.2 is then installed without overriding a conflicting parent requirement. A real native addon test downloads/checks Node headers, compiles and loads the addon. The other compatible bundled repairs remain locked/audited. See [npm bundle](../tools/npm-bundle/README.md).

### Embedded Node HTTP Library

Node 26.12.0 still reports `process.versions.undici === '8.11.2'`. The [Undici 8.12.2 security release](https://github.com/nodejs/undici/releases/tag/v8.12.2), published after that Node release, fixes TLS/client denial of service, certificate-option handling, cache redirects, integrity validation and streaming bounds. A zero-result npm/Scout scan does not override these upstream advisories.

TerminCount therefore also locks Undici 8.12.2 as a runtime dependency and calls its [official install() API](https://github.com/nodejs/undici/tree/v8.12.2#global-installation) before loading the server, dev/build tools or container health check. This replaces fetch, its matching body/header classes, WebSocket and EventSource together. Tests verify the installed identities and reject mismatched integrity with both lowercase and uppercase algorithm tokens. This protects the application's active web APIs; it does not remove or patch the older code inside the Node binary. Recheck the embedded version when the vendor publishes its next release, and do not describe the binary as vulnerability-free.

## Container Findings

### Published Alpine Database Images

The published 1.5.1 database image uses Alpine 3.24 and libxml2 2.13.9-r2. Rebuilding that image on 2026-10-16 retained 11 findings: one high, five medium and five low. Neither another PostgreSQL 18.6 tag nor Debian stable repairs those library findings; the engine is already current. PostgreSQL 19 RC1 is not an appropriate production security fix for an operating-system library. No findings were suppressed.

### Wolfi Database Migration in 1.6.0

The database source now uses the [Chainguard PostgreSQL image](https://images.chainguard.dev/directory/image/postgres/overview), pinned by its multiarch digest, with the same PostgreSQL 18.6 engine and libxml2 2.15.4-r1. It preserves UID 70, native Docker Secrets, the PostgreSQL entrypoint and the deployment's data path. Unlike a library copied over an incompatible ABI, this PostgreSQL package is built against the newer XML library. The source archive of gosu 1.19 is checksum verified and rebuilt with the latest Go 1.27.2 and locked user/x/sys dependencies; this removes the remaining vulnerable Go dependency in that base. The full refreshed filesystem is copied into a scratch final stage, so an older helper binary is not retained in distributed layers.

Local final-image scans on 2026-10-16 found zero vulnerabilities in both amd64 and arm64 Wolfi builds. Syft regenerates the helper's SPDX inventory from the rebuilt executable rather than keeping the base's obsolete x/sys 0.1.0 inventory. No advisory is ignored or suppressed. The older 1.5.1 images remain unchanged; these scan results do not establish that a running server has been migrated.

This changes musl to glibc and therefore requires a verified logical dump/restore into a fresh data directory, not an in-place image swap. The startup guard refuses unmarked legacy clusters without changing their contents. A new cluster creates a per-cluster `wolfi-glibc-v1` marker beside PGDATA; retain this marker in physical backups. It is migration metadata, not a backup. Never manufacture the marker on an old cluster to bypass the check. See [Operations](OPERATIONS.md#wolfi-database-migration).

CI tests Secret-file initialization, rejection of a legacy cluster, unchanged legacy data, full dump/restore, UTF-8 values, owner-like hashes, JSON vote data, expiry timestamps, identity sequences, XML queries, restart persistence and all browser/API tests against the restored database. Production migration and image publication remain separate gates. Rebuild and scan both final architectures before publishing; a new base is not a permanent vulnerability-free guarantee.

The database retains root startup for directory initialization, then runs PostgreSQL as UID 70 with the existing reduced capabilities/read-only Compose contract. A policy requiring a non-root image USER may still flag initialization; do not mislabel that result compliant. App image and npm build-base scans are separate, and their zero results do not invalidate the embedded Node advisories discussed above.

## Source Review and Verification

The review included poll/session authorization, Origin handling, input limits and parameterized SQL, transactions, realtime subscriptions/recovery, cleanup, browser mutation flow, route changes, sharing, layout, themes, server startup and deployment/release documentation. It found and reproduced duplicate retries, writes expiring while blocked, stale tally/subscription state after SPA navigation and options lost when typed before hydration completed. Regression tests now cover their repairs, lost-response/reload recovery and receipt cleanup.

Expired cleanup now runs in bounded background transactions with SKIP LOCKED; it no longer performs one unbounded startup delete. Vote/undo row-lock waits and statements are time limited. PostgreSQL remains the shared source of truth, with atomic receipts/votes/notifications. The current SvelteKit/PostgreSQL stack supports these contracts without another framework migration.

Browser tests cover desktop/mobile layout, ownership, XSS escaping, public live updates, single-connection pool concurrency, HTTP/HTTPS proxy origins, listener/EventSource recovery, sharing, keyboard/theme accessibility and initial rendering without JavaScript. Container checks cover Secrets, read-only startup, existing PostgreSQL data, dump/restore, native build tools and both supported architectures. Deployment on the actual server is a separate gate; local fixture results do not confirm production has been updated.

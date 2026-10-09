# Dependency and Service Review

Reviewed on 2026-10-10. This covers TerminCount's source, build tools, app image and PostgreSQL service, not the host OS or Docker installation. Version freshness and known vulnerabilities are separate checks; no scan proves absence of unknown vulnerabilities.

## Versions

| Surface | Reviewed version | Notes |
| --- | --- | --- |
| Node | 26.11.1 Current | Latest released version, explicitly selected over LTS; amd64/arm64 images. |
| Alpine | 3.24.2 / 3.24 repositories | Current stable branch; available APK updates applied during builds. |
| npm | 12.2.0 | Latest npm, with reviewed bundled-library repairs below. |
| Svelte / SvelteKit | 5.57.2 / 3.0.1 | Latest releases. |
| adapter-node / Vite plugin | 6.0.0 / 7.3.1 | Runtime ORIGIN preserved by tools/server.mjs. |
| Vite / svelte-check | 8.3.4 / 4.7.6 | Type checking uses the native TypeScript 7 integration. |
| TypeScript | 7.0.2 compiler + 6.0.3 API bridge | Official alias pattern; no forced peer overrides. |
| Node types / Playwright | 26.6.5 / 1.64.0 | Latest releases. |
| pg / Bootstrap CSS / qrcode | 8.23.1 / 5.3.8 / 1.5.4 | Latest releases; no Bootstrap JavaScript or jQuery. |
| PostgreSQL | 18.6 | Latest stable engine; PostgreSQL 19 is still beta. |
| PostgreSQL startup helper | su-exec 0.3 | Alpine package replacing the old Go-built gosu. |

Verify current releases again when publishing, using the npm registry and official [Node](https://nodejs.org/en/about/previous-releases), [Alpine](https://www.alpinelinux.org/releases/) and [PostgreSQL](https://www.postgresql.org/docs/release/) release information. Pinned releases are reviewed and reproducible, not permanently up to date. Dependabot watches application/build dependencies, actions and both Dockerfiles.

## TypeScript and npm Compatibility

The [official svelte-check integration](https://github.com/sveltejs/language-tools/blob/master/packages/svelte-check/README.md) installs TypeScript 7 as `@typescript/native` and uses `--tsgo`. TypeScript 6 remains for upstream tools using the JavaScript compiler API that TypeScript 7 removed. It is not the active type checker. The bridge's major is excluded from automatic Dependabot upgrades until those consumers migrate; the active compiler alias remains monitored. Deleting this bridge or using force/legacy-peer-deps would break supported tooling. The checker was verified with an intentional type error, not just a passing run. Generated checker cache is reset to avoid stale virtual files after a component is deleted/renamed.

npm 12 bundles node-gyp 13.0.0, whose Undici range is version 6. Our locked build repairs first update node-gyp to 13.1.0, within npm's accepted range; that parent supports Undici 8, so Undici 8.11.2 is then installed without overriding a conflicting parent requirement. A real native addon test downloads/checks Node headers, compiles and loads the addon. The other compatible bundled repairs remain locked/audited. See [npm bundle](../tools/npm-bundle/README.md).

## Container Findings

Docker Scout's all-severity review found no known CVEs in the app image or repaired base build stage. npm audit also reports no known vulnerabilities in application dependencies and the locked npm repair manifest. These results describe the scanned builds, not every version of the upstream base tags.

The official PostgreSQL 18.6 Alpine image had 73 findings on the reviewed ARM64 image, including an old Go standard library in gosu and outdated APK packages. The separate TerminCount PostgreSQL image refreshes those packages and replaces the startup helper with [su-exec 0.3, documented by gosu's maintainer](https://github.com/tianon/gosu/blob/master/README.md#su-exec). Its final stage copies the refreshed filesystem, so the removed executable is not distributed in inherited layers. The upstream engine, user IDs, entrypoint, locale, PGDATA, volume and shutdown signal are preserved.

**11 findings remain in libxml2 2.13.9-r2: one high, five medium and five low.** The current Alpine 3.24 package repository has no corrected version for these findings. They are not suppressed or claimed non-affected. Do not expose PostgreSQL publicly; limit database/secret access and do not accept arbitrary SQL/XML. The application does not expose an XML-processing endpoint, but containment is not a fix for the library. Rebuild/rescan after an upstream repair. Switching to Debian simply to change scanner results would also require reviewing locale/collation behavior and is not automatically safer.

The database image retains upstream root startup to initialize/chown a fresh bind-mounted directory, then runs PostgreSQL as UID 70. Compose grants only the required ownership/user-switch capabilities, uses no-new-privileges and a read-only root filesystem with writable data/tmpfs mounts. A scanner requiring a non-root image USER may still flag this database initialization contract; that policy result must not be mislabeled compliant.

## Source Review and Verification

The review included poll/session authorization, Origin handling, input limits and parameterized SQL, transactions, realtime subscriptions/recovery, cleanup, browser mutation flow, route changes, sharing, layout, themes, server startup and deployment/release documentation. It found and reproduced duplicate retries, writes expiring while blocked and stale tally/subscription state after SPA navigation. Regression tests now cover their repairs, lost-response/reload recovery and receipt cleanup.

Expired cleanup now runs in bounded background transactions with SKIP LOCKED; it no longer performs one unbounded startup delete. Vote/undo row-lock waits and statements are time limited. PostgreSQL remains the shared source of truth, with atomic receipts/votes/notifications. The current SvelteKit/PostgreSQL stack supports these contracts without another framework migration.

Browser tests cover desktop/mobile layout, ownership, XSS escaping, public live updates, single-connection pool concurrency, HTTP/HTTPS proxy origins, listener/EventSource recovery, sharing, keyboard/theme accessibility and initial rendering without JavaScript. Container checks cover Secrets, read-only startup, existing PostgreSQL data, dump/restore, native build tools and both supported architectures. Deployment on the actual server is a separate gate; local fixture results do not confirm production has been updated.

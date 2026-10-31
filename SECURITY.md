# Security Policy

Security fixes are provided for the current 1.6 release series. Install the latest patch release and rebuild/pull images regularly to receive runtime updates. The reviewed source selects Node 26.13.0 Lithium LTS; published 1.6.1 images still use 26.12.1 until a new release is built and deployed. Keep following vendor security patches. Existing 1.5 installations require the documented database migration when adopting 1.6.

Report vulnerabilities through the repository's private GitHub vulnerability reporting facility when enabled, or email diego@diegosr.es. Do not include credentials, owner cookies, database dumps, or private poll links in public issues.

TerminCount is a manual counter, not an authenticated election system. Anyone who knows a public result URL can read it. Only the browser with the owner session cookie can change votes; clearing that cookie loses ownership. There is currently no recovery or account system.

Run behind HTTPS, keep PostgreSQL private, protect secret files and backups, and apply request limits at the edge for an Internet-facing installation. Browser writes require the matching Origin header. Do not enable Cloudflare Rocket Loader or cache HTML, API, or SSE responses.

Dependency audits and container scans report known issues at the time of scanning; they are not a guarantee that the application is free of vulnerabilities.

On 2026-10-31, npm reports the low-severity [deepmerge advisory GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) through the Svelte build plugin. The vendor has not published a patched release. This dependency merges developer-controlled build configuration and is not installed in the production dependency set. Do not expose the development server publicly, build untrusted pull requests with credentials, suppress the warning, or apply npm audit fix --force's obsolete framework downgrade. See the dependency review for the scoped assessment; it is not a claim that the upstream library is repaired.

The 2026-10-21 [Node 26.12.1 security release](https://nodejs.org/en/blog/release/v26.12.1) repairs issues affecting the Node 26.12.0 binary in TerminCount 1.6.0. TerminCount 1.6.1 selects 26.12.1; deploy the new app image to apply it. GitHub npm alerts alone do not cover embedded runtime libraries or establish that a running container is patched.

The 2026-10-23 build-base scan's musl CVE-2026-107891 finding is retained in the raw report. Alpine 3.24 records its backport as fixed in r3, while the scanner requires edge's r6; the matching vendor patch and package floor are documented in the [dependency review](docs/DEPENDENCIES.md#161-maintenance-reviewed-on-2026-10-23). Do not suppress unrelated findings or infer that an empty scratch-image scan validates its source libraries.

Scan the PostgreSQL image separately from the TerminCount image. Official database images can include flagged operating-system libraries and startup helpers even when PostgreSQL itself is current. Review the affected component and reachable code paths, apply upstream updates when available, and retain network isolation. A clean application-image scan does not establish a clean deployment; do not suppress findings merely to obtain a passing badge.

The older 1.5.1 database image has unresolved libxml2 findings in Alpine 3.24. Version 1.6.0 uses the repaired XML library on Wolfi and requires logical dump/restore; do not replace the old database image against existing files. See [Dependency review](docs/DEPENDENCIES.md) and [Operations](docs/OPERATIONS.md#wolfi-database-migration). Do not expose the database port publicly or use it as an untrusted SQL/XML processing service. Network isolation reduces exposure; it does not remove a vulnerability.

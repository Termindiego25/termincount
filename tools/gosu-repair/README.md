# PostgreSQL Startup Helper Repair

The Wolfi PostgreSQL base includes gosu 1.19 with an outdated Go dependency. The database Dockerfile downloads the exact upstream 1.19 source archive with a verified SHA-256 and rebuilds it with Go 1.27.3, github.com/moby/sys/user 0.5.0 and golang.org/x/sys 0.49.0. The latter replaces the vulnerable x/sys 0.1.0 (CVE-2026-39824). The source/API remains gosu 1.19; no upstream implementation is vendored or rewritten here.

The go.mod/go.sum files lock and verify those repairs with the Go checksum database. The tools-tagged tools.go file makes the upstream imports visible to dependency tools without vendoring gosu. Without that anchor, a Go updater sees an empty local package and go mod tidy removes the required modules/checksums instead of updating them. The build checks tidy -diff against both this metadata and the actual extracted gosu source; it never silently resolves missing modules to unreviewed versions. The anchor is not copied into the upstream compilation directory. Dependabot monitors the locks and builder image.

The cross-compiled, static helper is tested with the target PostgreSQL UID before packaging. Go and its build tools are not included in the database runtime. The final scratch stage omits inherited layers containing the older binary.

Syft 1.55.0 regenerates the helper's SPDX inventory from the actual rebuilt binary. The build locates the single vendor `gosu-*.spdx.json` file rather than assuming a package revision, then replaces it with the accurate inventory. A missing or ambiguous inventory fails the build. The vendor's stale x/sys 0.1.0 must not survive after the executable is repaired; the migration fixture checks that exactly one inventory records both locked module versions. No advisory is ignored or dismissed, and final-image scans must still pass independently.

Review source and API compatibility when updating these modules. Keep the source archive checksum in the Dockerfile aligned with any gosu release change. Run the database migration fixture, both architecture builds and all-severity final-image scans; do not infer security from a passing Go build alone.

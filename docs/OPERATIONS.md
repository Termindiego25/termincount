# Operations

## Files and persistence

The deployment directory contains docker-compose.yaml, termincount.env, postgresql.env, secrets/credentials/, and data/postgres/. Compose env files use KEY=value, not YAML syntax. Compose substitution variables (for example TERMINCOUNT_VERSION and host ports) come from the shell or project .env; env_file supplies container variables and does not change Compose substitutions.

Polls, options, votes, owner-session hashes, and expiration dates live in PostgreSQL. The browser's owner cookie is separate: restoring a database does not restore a lost cookie. A server archive that contains only configuration and secrets is not a database backup.

Docker Compose secrets are mounted files on a standalone Docker host; they are not an encrypted secret vault. Restrict access to the directory and backups. Initialization secrets apply when PostgreSQL creates an empty data directory. Changing their files afterwards does not rename a database/user or rotate an existing database password.

The app runs as UID 10001 and must be able to read mounted credential files. File-backed Compose secrets are bind mounts: setting a secret's `mode`/`uid` in Compose does not remap the host file. Protect the parent secrets directory on the host while keeping the mounted files readable by the container. Do not blindly chmod the files to 600 under a different host UID and then expect the non-root app to read them.

## Backup

The service/container names are `termincount_db` and `termincount_app` in both examples. Run from the deployment directory:

```bash
umask 077
mkdir -p backups
chmod 700 backups
backup="backups/termincount-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T termincount_db sh -c 'exec pg_dump -U "$(cat /run/secrets/db_username)" -d "$(cat /run/secrets/db_database)" -Fc' > "$backup"
test -s "$backup"
chmod 600 "$backup"
docker compose exec -T termincount_db pg_restore --list < "$backup" >/dev/null
```

Save configuration/secrets securely as well and keep a copy off the server. Use a physical copy of data/postgres only after PostgreSQL is stopped, preserving ownership/permissions and restoring with the same PostgreSQL major version. Do not copy live database files as a backup or mount a single data directory into multiple PostgreSQL containers.

Check inherited ACLs as well as mode bits: a default ACL can grant access even when the process uses a restrictive umask. The chmod commands above remove effective access for group/other ACL entries on the backup.

## Restore

Restore into a new, empty database to validate a backup; do not overwrite production while testing recovery. Start the PostgreSQL service with the original initialization secrets, then restore:

```bash
docker compose up -d termincount_db
docker compose exec -T termincount_db sh -c 'exec pg_restore -U "$(cat /run/secrets/db_username)" -d "$(cat /run/secrets/db_database)" --no-owner --no-privileges --exit-on-error' < backups/termincount.dump
docker compose up -d termincount_app
```

Expired polls retain their original expiry dates and may be cleaned on startup. A restore does not extend retention.

## Upgrading from 1.3.0

Make a verified dump first and record the running image digest/revision. Set the app image to `termindiego25/termincount:1.3.2` and keep the PostgreSQL 18 volume and credentials. Pull and recreate only the app when updating code. The 1.3.1 and 1.3.2 patches use the existing schema and are compatible with 1.3.0 data/cookies; rollback to the old app image is possible.

## Upgrading to 1.4

The Node 26 / SvelteKit 3 migration preserves the schema, poll URLs, owner-session cookies, ORIGIN and Docker Secrets. Use the published 1.4 app image and keep PostgreSQL 18 data/credentials; no database major upgrade is part of this migration. Recreate only the app after a backup and validation. ARM64 Raspberry Pi deployments are supported; ARM32 images are no longer produced for this series.

Keep ORIGIN in termincount.env. Adapter-node 6 no longer reads that setting itself, so tools/server.mjs validates it and pins the adapter's protocol/host headers to the configured public origin before request handling. The header values are overwritten, not trusted from arbitrary clients. The adapter's native graceful shutdown remains in use. For source deployments run this entrypoint rather than node build.

Application images, build tools, database images and host OS are separate maintenance surfaces. A refreshed Alpine image does not update Debian on the Docker host, and apt updates do not update running containers. Check all of them, publish rebuilt images and recreate the affected services deliberately. Host Debian/Docker upgrades can affect every project on that server and require their own backup and maintenance window.

When adopting the Traefik Compose example, its database network/container names differ from older setups: stop the original Compose project before starting the replacement, and ensure the external proxy network exists. Preserve data/postgres and secrets. Do not run old and new PostgreSQL containers against the same directory. Keep the original Compose and image digest for rollback.

Do not upgrade PostgreSQL to another major by changing its image tag against the existing data directory. Use PostgreSQL's documented upgrade/dump-and-restore procedures.

PostgreSQL minor updates within version 18 normally reuse the existing data directory after a clean shutdown; read the release notes first and test recovery. Record the database image digest as well as the app digest before updating. Do not switch between Alpine and Debian just to change scanner results: their locale/collation implementations can differ. Scan database images independently and review unresolved upstream findings instead of treating the app scan as coverage of the whole stack.

## Upgrading to 1.5

This release adds `mutation_receipts` automatically under the existing schema initialization lock. Its foreign key deletes receipts with their poll. Existing URLs, cookies and PostgreSQL 18 data remain compatible; the vote/undo API still accepts legacy clients without an idempotency key, but only keyed requests are retry-safe. Deploy all app replicas together before relying on retries. An old application does not understand receipt keys: settle pending actions and refresh browser clients before any rollback.

The Compose service and container names are now `termincount_app` and `termincount_db`. Existing env filenames and Secret paths are unchanged. Set `DB_HOST=termincount_db` in termincount.env, retaining the public ORIGIN. The `termincount` network alias remains valid for Traefik. Fixed names are intended for a single installation, not unchanged `--scale` use.

Before replacing the old Compose, stop the old app, take and validate a fresh dump with the **old** database service name, and save its Compose/env files and both running image digests. Download and validate the new Compose separately. Pull both new images before stopping PostgreSQL; then stop/remove the old containers without deleting volumes or data, install the new Compose and start it. Never start a second database container on the same data directory. Keep the database's initialization credentials unchanged for this update.

The refreshed `postgres-18.6-1.5.1` image derives from official PostgreSQL 18.6 Alpine 3.24. It upgrades available APK packages and replaces the old Go-built gosu binary with Alpine's su-exec 0.3, retaining the upstream entrypoint, UID, PGDATA and locale settings. It is not a different PostgreSQL major or an Alpine-to-Debian migration. A backup and recovery test are still required; do not assume an old Alpine branch is equivalent just because its engine also says 18.6. See [Dependency review](DEPENDENCIES.md) for unresolved libxml2 findings.

Poll expiry uses the database wall clock after row locks are acquired. Cleanup runs in background batches of 100 polls, skipping locked rows and yielding between transactions. Logical expiry does not wait for cleanup; skipped rows are retried at the next interval. Graceful shutdown waits for an active cleanup job.

### Rootless init failure

An exit code 126 with `exec: "/sbin/docker-init": permission denied` occurs before Node starts. This is not an application exception or database error. TerminCount does not spawn child processes and does not need an external init/reaper: from 1.5.1 its Compose and direct-run examples omit `init: true` / `--init`. Node handles SIGTERM/SIGINT through the adapter, immediately drains live streams, waits for ordinary requests/database work and exits directly. CI verifies a clean SSE end and exit code zero in less than ten seconds, without an external init. Keep the Compose stop grace period longer than the adapter's shutdown timeout. Do not make Docker's files world-writable to work around this failure.

## Wolfi Database Migration

Version 1.6.0 uses PostgreSQL 18.6 on Wolfi/glibc with libxml2 2.15.4. This replaces the older Alpine/musl database base, not the database engine or application schema. The `postgres-18.6-1.5.1` tag remains the old image; no existing version tag is overwritten. Do not deploy 1.6.0 by treating it as a routine app-only update. These instructions also apply to any custom Alpine-to-Wolfi database adoption.

Changing libc can change collation order and invalidate existing indexes even at the same PostgreSQL version. Use a logical dump/restore so indexes are rebuilt by the target library. This migration preserves records, IDs, owner-session hashes and existing expiry timestamps; it does not restore a missing browser cookie or extend retention.

For upgrades from 1.5.1 or another Alpine database image, use this controlled sequence:

1. Pull the separately versioned app/database images and record both old image digests and the exact Compose/env/Secret files. Keep the existing credentials unchanged.
2. Test a fresh dump in an isolated target database before the maintenance window. The portable local/CI fixture is `node tools/check-database-migration.mjs <new-database-image>`; it uses only its own containers/volumes and synthetic data.
3. Stop every app replica to quiesce writes, take and verify a final `pg_dump -Fc`, then stop PostgreSQL cleanly. Keep the dump and configuration/Secret backup restricted and off the server as well.
4. Preserve the complete old `data/postgres` directory, including permissions, in a clearly named rollback location. Provision a new empty `data/postgres` directory for the new image; never delete or overwrite the original, and never mount it into both old and new servers.
5. Start only the new database with the original initialization Secret files. Restore the final dump using `--no-owner --no-privileges --exit-on-error` for the dedicated TerminCount role, as in the Restore section. For installations with additional custom roles/grants/databases, preserve and migrate those separately instead of discarding their permissions.
6. Verify the restored records/counts, sequences and owner-session data before starting the app. Then check health, create/vote/undo, the existing owner browser and a separate live viewer. Original expiry dates remain in force; expired polls may be removed normally by cleanup.
7. Retain the old stopped data directory, final dump, old images and exact configuration until acceptance is complete. Rollback requires stopping the new stack and using the old image with its matching old directory, not putting the old image on the newly created glibc cluster. Writes made after cutover require an explicit reconciliation/restore plan before rollback.

The target refuses an existing cluster unless a `wolfi-glibc-v1` marker exists at `${PGDATA}.termincount-runtime`. New empty clusters create this metadata beside PGDATA before initialization. Do not create/copy a marker onto legacy data to bypass the guard; it cannot repair index order. Preserve the entire `data/postgres` directory, including that marker, for cold physical backups, and pair physical restores with the same reviewed database image.

### Maintenance after 1.6.0

Version 1.6.1 remains PostgreSQL 18.6 on Wolfi/glibc. Its fixture additionally opens a disposable cluster initialized with the published 1.6.0 image and checks unchanged data and database/actual collation versions. This is distinct from the Alpine migration above: do not move the data directory again or reuse/remove `backups/migration-1.6.0` when preparing this patch.

Before adopting any newly published maintenance images, take a verified fresh dump, record the currently running image digests/configuration, and validate the update on an isolated copy. Stop app writers and PostgreSQL cleanly before replacing the database container. The marker only identifies the runtime family; it is not proof that every future libc/image update is compatible. A changed collation version requires its own reviewed reindex/restore plan. Source review does not itself publish or deploy the patch.

## Rotating a database password

After a verified backup, stop only the app and open PostgreSQL's interactive client. Use your database service name:

```bash
docker compose stop termincount_app
docker compose exec termincount_db sh -c 'exec psql -U "$(cat /run/secrets/db_username)" -d "$(cat /run/secrets/db_database)"'
```

At the psql prompt, run `\password` (without a username to change the current role), enter a strong unique password twice, then `\q`. This avoids placing plaintext credentials in shell/SQL history. Update the password secret to the same value using a hidden Bash prompt:

```bash
IFS= read -r -s -p 'New database password for the secret: ' tc_new_password
printf '\n'
printf '%s\n' "$tc_new_password" > secrets/credentials/db_password.txt
unset tc_new_password
docker compose up -d --force-recreate termincount_app
```

Use the existing file permissions so UID 10001 can still read the mount; protect its parent directory on the host. The role change and file update must both be completed before restarting the app. Update secure copies of deployment secrets after rotation; do not post credentials in issues/chat.

## Traefik and Cloudflare

The file-provider example in deploy/traefik.example.yaml uses `http://termincount:3000` on the shared `termincount_net` network. The production Compose keeps PostgreSQL on a separate internal network and does not publish app/database ports on the host.

`tls: {}` is valid when Traefik's static configuration/default certificate store provides the certificate. Configure a certificate resolver if your installation instead issues certificates through ACME. The app itself does not terminate TLS.

The example explicitly flushes streaming responses immediately. Its write-only router applies a request limit to POST /api/polls requests without throttling asset loads or SSE connections. Behind Cloudflare/Tunnel, configure trusted forwarded headers/IP handling on Traefik before relying on a per-client rate limit; otherwise several users may share one proxy address.

Disable Rocket Loader for the app host and bypass caching for HTML, /api/, and /p/. Do not buffer/compress SSE streams. Immutable /_app/ assets can be cached. Development Mode only changes cache behavior, not script rewriting.

## Checks and replicas

The app /healthz returns 204 only after schema initialization and a live database query; outages return 503. Docker marks unhealthy containers but does not automatically restart them just for being unhealthy. The app reconnects after transient database/listener failures.

The same PostgreSQL database can serve several app containers. Each uses up to TERMINCOUNT_DB_POOL_SIZE pooled connections plus one dedicated LISTEN connection. Reserve PostgreSQL capacity for these and for administration. PostgreSQL notifications reach every replica; each reads one snapshot per affected poll and fans it out to its viewers. Sticky sessions are not required. PostgreSQL remains a separate availability dependency, not a multi-node database cluster.

Remove/override the fixed app container name and give replicas distinct names when configuring a load-balanced deployment. Never scale the database service against one shared directory. Restrict requests at Traefik/your edge; polling endpoints alone are not an abuse-prevention service.

After deploying, check health, image metadata, new poll creation, owner vote/undo, and a read-only live viewer on a second device. Reconnect a viewer after temporarily interrupting its network. Mobile and projector/desktop views should remain readable.

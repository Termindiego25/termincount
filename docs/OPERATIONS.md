# Operations

## Files and persistence

The deployment directory contains docker-compose.yaml, termincount.env, postgresql.env, secrets/credentials/, and data/postgres/. Compose env files use KEY=value, not YAML syntax. Compose substitution variables (for example TERMINCOUNT_VERSION and host ports) come from the shell or project .env; env_file supplies container variables and does not change Compose substitutions.

Polls, options, votes, owner-session hashes, and expiration dates live in PostgreSQL. The browser's owner cookie is separate: restoring a database does not restore a lost cookie. A server archive that contains only configuration and secrets is not a database backup.

Docker Compose secrets are mounted files on a standalone Docker host; they are not an encrypted secret vault. Restrict access to the directory and backups. Initialization secrets apply when PostgreSQL creates an empty data directory. Changing their files afterwards does not rename a database/user or rotate an existing database password.

The app runs as UID 10001 and must be able to read mounted credential files. File-backed Compose secrets are bind mounts: setting a secret's `mode`/`uid` in Compose does not remap the host file. Protect the parent secrets directory on the host while keeping the mounted files readable by the container. Do not blindly chmod the files to 600 under a different host UID and then expect the non-root app to read them.

## Backup

Use the correct database service name: `db` for the default Compose, `termincount_db` for the Traefik example. Run from the deployment directory:

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
docker compose up -d termincount
```

Expired polls retain their original expiry dates and may be cleaned on startup. A restore does not extend retention.

## Upgrading from 1.3.0

Make a verified dump first and record the running image digest/revision. Set the app image to `termindiego25/termincount:1.3.1` and keep the PostgreSQL 18 volume and credentials. Pull and recreate only the app when updating code. Version 1.3.1 uses the existing schema and is compatible with 1.3.0 data/cookies; rollback to the old app image is possible.

When adopting the Traefik Compose example, its database network/container names differ from older setups: stop the original Compose project before starting the replacement, and ensure the external proxy network exists. Preserve data/postgres and secrets. Do not run old and new PostgreSQL containers against the same directory. Keep the original Compose and image digest for rollback.

Do not upgrade PostgreSQL to another major by changing its image tag against the existing data directory. Use PostgreSQL's documented upgrade/dump-and-restore procedures.

PostgreSQL minor updates within version 18 normally reuse the existing data directory after a clean shutdown; read the release notes first and test recovery. Record the database image digest as well as the app digest before updating. Do not switch between Alpine and Debian just to change scanner results: their locale/collation implementations can differ. Scan database images independently and review unresolved upstream findings instead of treating the app scan as coverage of the whole stack.

## Rotating a database password

After a verified backup, stop only the app and open PostgreSQL's interactive client. Use your database service name:

```bash
docker compose stop termincount
docker compose exec termincount_db sh -c 'exec psql -U "$(cat /run/secrets/db_username)" -d "$(cat /run/secrets/db_database)"'
```

At the psql prompt, run `\password` (without a username to change the current role), enter a strong unique password twice, then `\q`. This avoids placing plaintext credentials in shell/SQL history. Update the password secret to the same value using a hidden Bash prompt:

```bash
IFS= read -r -s -p 'New database password for the secret: ' tc_new_password
printf '\n'
printf '%s\n' "$tc_new_password" > secrets/credentials/db_password.txt
unset tc_new_password
docker compose up -d --force-recreate termincount
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

After deploying, check health, image metadata, new poll creation, owner vote/undo, and a read-only live viewer on a second device. Reconnect a viewer after temporarily interrupting its network. Mobile and projector/desktop views should remain readable.

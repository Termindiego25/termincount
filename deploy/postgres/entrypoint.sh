#!/bin/sh
set -eu

for argument do
	case "$argument" in --help|--version|-V) exec /usr/bin/docker-entrypoint.sh "$@" ;; esac
done

case "${1:-}" in
	postgres|-*)
		marker="${PGDATA}.termincount-runtime"
		if [ -s "$PGDATA/PG_VERSION" ] && [ "$(cat "$marker" 2>/dev/null || true)" != 'wolfi-glibc-v1' ]; then
			echo >&2 'This PostgreSQL directory predates the Wolfi/glibc image. A verified dump/restore into a new data directory is required; see docs/OPERATIONS.md. Existing data has not been modified.'
			exit 1
		fi
		if [ ! -s "$PGDATA/PG_VERSION" ]; then
			mkdir -p "$(dirname "$PGDATA")"
			printf '%s\n' 'wolfi-glibc-v1' > "$marker"
		fi
		;;
esac

exec /usr/bin/docker-entrypoint.sh "$@"

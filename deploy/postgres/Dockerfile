# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM anchore/syft:v1.55.0 AS sbom-tool
FROM --platform=$BUILDPLATFORM golang:1.27.3-alpine3.24 AS startup-helper

ARG TARGETARCH
WORKDIR /src
ADD --checksum=sha256:cd9719b775dbfedae53923c9b0dc792b66d42c51e0b36652ed6f747fbadc0164 https://github.com/tianon/gosu/archive/refs/tags/1.19.tar.gz /tmp/gosu.tar.gz
RUN tar -xzf /tmp/gosu.tar.gz --strip-components=1 -C /src
COPY tools/gosu-repair/go.mod tools/gosu-repair/go.sum ./
RUN go mod download all \
    && go mod verify \
    && CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -trimpath -ldflags='-s -w' -o /out/gosu .
COPY --from=sbom-tool /syft /usr/local/bin/syft
RUN syft scan file:/out/gosu -o spdx-json=/out/gosu.spdx.json

FROM cgr.dev/chainguard/postgres:latest@sha256:8ec81cdb3615544e874a3ecd71a8511a215b7017e8e92ff7571bbab457b831f1 AS refreshed
COPY --from=startup-helper /out/gosu /usr/bin/gosu
COPY --from=startup-helper /out/gosu.spdx.json /tmp/termincount-gosu.spdx.json
RUN set -eu; set -- /var/lib/db/sbom/gosu-*.spdx.json; \
    test "$#" -eq 1 && test -f "$1" \
    && cp /tmp/termincount-gosu.spdx.json "$1" \
    && rm /tmp/termincount-gosu.spdx.json \
    && test "$(postgres --version)" = 'postgres (PostgreSQL) 18.6' \
    && gosu postgres sh -c 'test "$(id -u)" = 70'
COPY --chmod=755 deploy/postgres/entrypoint.sh /usr/local/bin/termincount-postgres-entrypoint

FROM scratch
COPY --from=refreshed / /
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    LANG=en_US.UTF-8 \
    PG_MAJOR=18 \
    PG_VERSION=18.6 \
    PGDATA=/var/lib/postgresql/18/docker
VOLUME /var/lib/postgresql
EXPOSE 5432
STOPSIGNAL SIGINT
ENTRYPOINT ["/usr/local/bin/termincount-postgres-entrypoint"]
CMD ["postgres"]

ARG VERSION=1.6.1
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown
LABEL org.opencontainers.image.title="TerminCount PostgreSQL" \
      org.opencontainers.image.description="PostgreSQL 18 on Wolfi with patched libxml2 and reviewed gosu for TerminCount" \
      org.opencontainers.image.authors="Termindiego25" \
      org.opencontainers.image.source="https://github.com/Termindiego25/termincount" \
      org.opencontainers.image.documentation="https://github.com/Termindiego25/termincount/blob/master/docs/OPERATIONS.md" \
      org.opencontainers.image.version="18.6" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="PostgreSQL" \
      es.diegosr.termincount.release="${VERSION}"

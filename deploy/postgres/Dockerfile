# syntax=docker/dockerfile:1
FROM postgres:18.6-alpine3.24 AS refreshed

# Keep the upstream engine, locale, data layout and initialization contract.
# su-exec 0.3+ is the Alpine alternative documented by gosu's maintainer.
RUN apk upgrade --no-cache \
    && apk add --no-cache 'su-exec>=0.3' \
    && rm /usr/local/bin/gosu \
    && ln -s /sbin/su-exec /usr/local/bin/gosu \
    && gosu postgres sh -c 'test "$(id -u)" = 70' \
    && postgres --version

FROM scratch
COPY --from=refreshed / /
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    LANG=en_US.utf8 \
    PG_MAJOR=18 \
    PG_VERSION=18.6 \
    PGDATA=/var/lib/postgresql/18/docker
VOLUME /var/lib/postgresql
EXPOSE 5432
STOPSIGNAL SIGINT
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres"]

ARG VERSION=1.5.1
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown
LABEL org.opencontainers.image.title="TerminCount PostgreSQL" \
      org.opencontainers.image.description="PostgreSQL 18 with refreshed Alpine packages and su-exec for TerminCount" \
      org.opencontainers.image.authors="Termindiego25" \
      org.opencontainers.image.source="https://github.com/Termindiego25/termincount" \
      org.opencontainers.image.documentation="https://github.com/Termindiego25/termincount/blob/master/docs/OPERATIONS.md" \
      org.opencontainers.image.version="18.6" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="PostgreSQL" \
      es.diegosr.termincount.release="${VERSION}"

# syntax=docker/dockerfile:1.7

FROM --platform=$BUILDPLATFORM node:22-alpine AS base

WORKDIR /app

ARG NPM_VERSION=11.15.0
RUN npm install -g "npm@${NPM_VERSION}"

FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build

COPY . .
RUN npm run build

FROM base AS production-dependencies

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime-base

FROM scratch AS runtime

WORKDIR /app

ARG VERSION=1.3.0
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="TerminCount" \
      org.opencontainers.image.description="Shareable live vote counter web app built with SvelteKit and PostgreSQL" \
      org.opencontainers.image.authors="Termindiego25" \
      org.opencontainers.image.vendor="Termindiego25" \
      org.opencontainers.image.documentation="https://github.com/Termindiego25/termincount#readme" \
      org.opencontainers.image.url="https://termincount.diegosr.es" \
      org.opencontainers.image.source="https://github.com/Termindiego25/termincount" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="GPL-3.0"

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    TERMINCOUNT_RETENTION_DAYS=7 \
    TERMINCOUNT_CLEANUP_INTERVAL_MINUTES=60

COPY --from=runtime-base /usr/local/bin/node /usr/local/bin/node
COPY --from=runtime-base /lib/ld-musl-*.so.1 /lib/
COPY --from=runtime-base /usr/lib/libgcc_s.so.1 /usr/lib/
COPY --from=runtime-base /usr/lib/libstdc++.so.6* /usr/lib/
COPY --from=runtime-base /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./

EXPOSE 3000

USER 10001:10001

HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD ["/usr/local/bin/node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT || 80}/healthz`).then((r)=>process.exit(r.status===204?0:1)).catch(()=>process.exit(1))"]

CMD ["/usr/local/bin/node", "build"]

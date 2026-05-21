FROM node:alpine AS build

WORKDIR /app

ARG NPM_VERSION=11.15.0

RUN npm install -g "npm@${NPM_VERSION}"

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM golang:alpine AS static-server

WORKDIR /src
COPY tools/static-server/main.go .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/termincount-server ./main.go

FROM scratch

ARG VERSION=1.2.0
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="TerminCount" \
      org.opencontainers.image.description="Lightweight vote counter web app built with SvelteKit" \
      org.opencontainers.image.authors="Termindiego25" \
      org.opencontainers.image.vendor="Termindiego25" \
      org.opencontainers.image.documentation="https://github.com/Termindiego25/termincount#readme" \
      org.opencontainers.image.url="https://termincount.diegosr.es" \
      org.opencontainers.image.source="https://github.com/Termindiego25/termincount" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="GPL-3.0"

ENV PORT=80 \
    TLS_PORT=443 \
    STATIC_DIR=/srv/termincount \
    TERMINCOUNT_DOMAIN=localhost

COPY --from=build /app/build /srv/termincount
COPY --from=static-server /out/termincount-server /termincount-server

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD ["/termincount-server", "-healthcheck"]

ENTRYPOINT ["/termincount-server"]

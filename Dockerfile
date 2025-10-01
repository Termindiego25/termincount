FROM nginx:1.29.1-alpine

LABEL org.opencontainers.image.title="TerminCount" \
      org.opencontainers.image.description="Lightweight vote counter web app" \
      org.opencontainers.image.url="https://github.com/Termindiego25/termincount" \
      org.opencontainers.image.licenses="MIT"

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY www /usr/share/nginx/html

EXPOSE 443

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- --no-check-certificate https://localhost/ || exit 1


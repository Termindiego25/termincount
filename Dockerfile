FROM nginx:1.29.1-alpine-slim

LABEL org.opencontainers.image.title="TerminCount" \
      org.opencontainers.image.description="Lightweight vote counter web app" \
      org.opencontainers.image.url="https://github.com/Termindiego25/termincount" \
      org.opencontainers.image.licenses="GPL-3.0"

# Default domain (can be overridden at runtime with -e DOMAIN=yourdomain.com)
ENV TERMINCOUNT_DOMAIN=localhost

# Remove default nginx web root and add app files
RUN rm -rf /usr/share/nginx/html/*
COPY www /usr/share/nginx/html

# Copy nginx templates and entrypoint script
COPY nginx-http.conf.template /etc/nginx/templates/nginx-http.conf.template
COPY nginx-https.conf.template /etc/nginx/templates/nginx-https.conf.template
COPY entrypoint.sh /entrypoint.sh

# Expose HTTP and HTTPS
EXPOSE 80 443

# Healthcheck (works even if HTTPS is enabled, because HTTP is always available internally)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]

#!/bin/sh
# Exit immediately if a command fails
set -e

# Default to localhost if TERMINCOUNT_DOMAIN is not set
: "${TERMINCOUNT_DOMAIN:=localhost}"

# Choose HTTPS template if both certs exist, otherwise fallback to HTTP
if [ -f "/etc/nginx/certs/fullchain.pem" ] && [ -f "/etc/nginx/certs/privkey.pem" ]; then
  echo "[Entrypoint] TLS certificates found, enabling HTTPS for domain: $TERMINCOUNT_DOMAIN"
  envsubst '${TERMINCOUNT_DOMAIN}' < /etc/nginx/templates/nginx-https.conf.template > /etc/nginx/conf.d/default.conf
else
  echo "[Entrypoint] No TLS certificates found, using HTTP only for domain: $TERMINCOUNT_DOMAIN"
  envsubst '${TERMINCOUNT_DOMAIN}' < /etc/nginx/templates/nginx-http.conf.template > /etc/nginx/conf.d/default.conf
fi

# Validate and start Nginx
nginx -t
exec nginx -g "daemon off;"

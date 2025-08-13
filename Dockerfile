# Simple production-ready container for TerminCount static site
# Stage 1 (optional) - could add build steps / linting later
FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="TerminCount" \
      org.opencontainers.image.description="Lightweight vote counter web app" \
      org.opencontainers.image.url="https://github.com/Termindiego25/termincount" \
      org.opencontainers.image.licenses="MIT"

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy configuration & static assets
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY images /usr/share/nginx/html/images

# Expose port
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://localhost/ || exit 1

# nginx entrypoint & cmd from base image

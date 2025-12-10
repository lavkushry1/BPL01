FROM node:20-alpine as builder

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set production environment variables
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production image - Using nginx:alpine for lightweight serving
FROM nginx:alpine

# Copy security hardening configs
RUN rm /etc/nginx/conf.d/default.conf

# Create nginx configuration for SPA with security headers
RUN echo 'server { \
    listen 5173; \
    root /usr/share/nginx/html; \
    index index.html; \
    server_tokens off; \
    \
    # Security headers \
    add_header X-Content-Type-Options "nosniff"; \
    add_header X-Frame-Options "DENY"; \
    add_header X-XSS-Protection "1; mode=block"; \
    add_header Content-Security-Policy "default-src '\''self'\''; connect-src '\''self'\'' http://localhost:4001 ws://localhost:4001; img-src '\''self'\'' data: https:; style-src '\''self'\'' '\''unsafe-inline'\'' https:; script-src '\''self'\'' '\''unsafe-inline'\'' '\''unsafe-eval'\''"; \
    add_header Referrer-Policy "strict-origin-when-cross-origin"; \
    \
    # Handle SPA routing \
    location / { \
        try_files $uri $uri/ /index.html; \
        expires 1h; \
        add_header Cache-Control "public, max-age=3600"; \
    } \
    \
    # Cache static assets aggressively \
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 30d; \
        add_header Cache-Control "public, max-age=2592000"; \
    } \
    \
    # Handle errors \
    error_page 404 /index.html; \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Create nginx cache directories and fix permissions for non-root
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    /tmp/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chmod -R 755 /var/cache/nginx \
    && chown -R nginx:nginx /var/run \
    && chmod -R 755 /var/run \
    && touch /run/nginx.pid \
    && chown nginx:nginx /run/nginx.pid \
    && chown -R nginx:nginx /usr/share/nginx/html

# Copy built app from builder stage
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Use non-root user from the nginx image
USER nginx

# Expose port
EXPOSE 5173

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

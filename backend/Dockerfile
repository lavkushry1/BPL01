FROM node:20-alpine AS builder

# Install dependencies needed for bcrypt
RUN apk add --no-cache python3 make g++ git

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run prisma:generate
RUN npm run build

# Production image
FROM node:20-alpine

# Install necessary runtime dependencies including curl for health checks
RUN apk add --no-cache tzdata openssl curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create app directory and set ownership
WORKDIR /app
RUN chown -R appuser:appgroup /app

# Set to production environment
ENV NODE_ENV=production

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Install bcrypt manually to ensure it's built for alpine
RUN apk add --no-cache python3 make g++ \
    && npm install bcrypt \
    && apk del python3 make g++

# Copy built app from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy necessary files like migrations and public directories
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/db/migrations ./dist/db/migrations


# Create and set permissions for storage directories
RUN mkdir -p public/tickets public/qrcodes logs \
    && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Expose the API port
EXPOSE 4000

# Run the application
CMD ["node", "dist/server.js"]

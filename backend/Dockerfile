# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

COPY . .

# Build TypeScript code
RUN npm run build
# Copy static assets that tsc doesn't handle
RUN cp src/config/openapi.yaml dist/src/config/openapi.yaml 2>/dev/null || true
# Compile seed script
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --target ES2022 --module commonjs --moduleResolution node --skipLibCheck
# Generate Prisma Client
# We need a dummy DATABASE_URL for prisma generate to work if it's referenced in schema
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate

# Production Stage
FROM node:20-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY start.sh ./

# Install OpenSSL (required for Prisma on Alpine 3.23+)
RUN apk add --no-cache libssl3 libcrypto3 && chmod +x start.sh

# Create uploads directory
RUN mkdir -p uploads && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start command
CMD ["./start.sh"]

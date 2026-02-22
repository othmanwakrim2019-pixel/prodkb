#!/bin/sh
set -e

# ─────────────────────────────────────────────
# ProdKB — Docker Entrypoint
# ─────────────────────────────────────────────

# 1. Validate that migrations exist
MIGRATIONS_DIR="prisma/migrations"
if [ ! -d "$MIGRATIONS_DIR" ] || [ -z "$(ls -A "$MIGRATIONS_DIR" 2>/dev/null)" ]; then
    echo "ERROR: No Prisma migrations found in $MIGRATIONS_DIR"
    echo "  Run 'npx prisma migrate dev --name <name>' locally to create migrations."
    echo "  Then rebuild the Docker image."
    exit 1
fi

# 2. Apply pending migrations (safe for production — never drops data)
echo "Applying database migrations..."
if [ -z "$DATABASE_URL" ]; then
    echo "🚨 FATAL ERROR: DATABASE_URL is empty at runtime!"
    exit 1
fi
npx prisma migrate deploy
echo "Migrations applied successfully."

# 3. Generate Prisma Client (in case it wasn't generated at build time)
npx prisma generate

# 4. Seed database (only in non-production OR if SEED=true is explicitly set)
if [ "$NODE_ENV" != "production" ] || [ "$SEED" = "true" ]; then
    echo "Seeding database (NODE_ENV=$NODE_ENV, SEED=$SEED)..."
    node dist/prisma/seed.js || echo "WARN: Seed script failed (non-fatal)"
else
    echo "Skipping seed (production mode, SEED not set)"
fi

# 5. Start the application
echo "Starting ProdKB server..."
exec node dist/src/server.js

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

# 2. Wait for database to be reachable
echo "Waiting for database to be ready..."
MAX_RETRIES=15
RETRY_INTERVAL=2
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_HOST=${DB_HOST:-pgbouncer}
DB_PORT=${DB_PORT:-5432}
echo "  Checking $DB_HOST:$DB_PORT..."
for i in $(seq 1 $MAX_RETRIES); do
    if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        echo "Database is ready!"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        echo "ERROR: Database not reachable after $MAX_RETRIES retries"
        exit 1
    fi
    echo "  Attempt $i/$MAX_RETRIES failed, retrying in ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
done

# 3. Apply pending migrations (safe for production — never drops data)
echo "Applying database migrations..."
if [ -z "$DATABASE_URL" ]; then
    echo "FATAL ERROR: DATABASE_URL is empty at runtime!"
    exit 1
fi

# Prisma migrations cannot run through PGBouncer transaction mode.
# We use a direct connection to postgres (bypassing pgbouncer) for migrations.
DIRECT_URL=$(echo "$DATABASE_URL" | sed 's/@pgbouncer:5432/@postgres:5432/')
echo "Using direct connection for migrations..."

# Check if there are any pending migrations first (avoid advisory lock if nothing to do)
MIGRATE_STATUS=$(DATABASE_URL="$DIRECT_URL" npx prisma migrate status 2>&1 || true)
if echo "$MIGRATE_STATUS" | grep -q "Database schema is up to date"; then
    echo "No pending migrations — skipping migrate deploy."
else
    echo "Pending migrations found. Applying..."
    # Retry up to 5 times — concurrent container restarts can race for the advisory lock
    MIGRATE_RETRIES=5
    MIGRATE_DELAY=15
    for i in $(seq 1 $MIGRATE_RETRIES); do
        if PRISMA_MIGRATE_TIMEOUT=30000 DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy; then
            echo "Migrations applied successfully."
            break
        fi
        if [ $i -eq $MIGRATE_RETRIES ]; then
            echo "ERROR: Migrations failed after $MIGRATE_RETRIES attempts. Exiting."
            exit 1
        fi
        echo "Migration attempt $i/$MIGRATE_RETRIES failed (advisory lock?). Retrying in ${MIGRATE_DELAY}s..."
        sleep $MIGRATE_DELAY
    done
fi

# 3. Generate Prisma Client (in case it wasn't generated at build time)
npx prisma generate

# 4. Seed database (only in non-production OR if SEED=true is explicitly set)
if [ "$NODE_ENV" != "production" ] || [ "$SEED" = "true" ]; then
    echo "Seeding database (NODE_ENV=$NODE_ENV, SEED=$SEED)..."
    node dist/prisma/seeds/index.js || echo "WARN: Seed script failed (non-fatal)"
else
    echo "Skipping seed (production mode, SEED not set)"
fi

# 5. Start the application
echo "Starting ProdKB server..."
exec node dist/src/server.js

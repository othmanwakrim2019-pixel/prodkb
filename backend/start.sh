#!/bin/sh
set -e

echo "Pushing database schema..."
npx prisma db push --accept-data-loss

echo "Seeding database..."
node dist/prisma/seed.js

echo "Starting application..."
exec node dist/src/server.js

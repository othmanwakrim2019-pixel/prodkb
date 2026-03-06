#!/bin/bash
echo "=== Step 1: Terminate all connections to prodkb DB to clear advisory locks ==="
docker exec prodkb-postgres psql -U prodkb -d prodkb << 'SQL'
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='prodkb' AND pid <> pg_backend_pid();
SQL

echo "=== Step 2: Restart backend cleanly ==="
docker restart prodkb-backend

echo "=== Waiting 90s for backend to initialize and pass health check ==="
sleep 90

echo "=== Final status ==="
docker ps --format "{{.Names}}: {{.Status}}" | grep -E "backend|frontend"

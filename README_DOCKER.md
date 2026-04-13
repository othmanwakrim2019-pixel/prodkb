# ProdKB — Docker Compose Reference

## Prerequisites

- Docker Engine 24+ and Docker Compose v2 (`docker compose`, not `docker-compose`)
- A `.env` file — copy from `.env.example` and fill in all required values

## Quick Start

```bash
# Build images and start all services in the background
docker compose up -d --build

# Run database migrations (required on first boot and after each deploy)
docker compose exec backend npx prisma migrate deploy

# (First deploy only) Seed initial data
docker compose exec backend npx prisma db seed
```

The app is available at **http://localhost:8080**.

---

## Service Port Map

| Service | Host Port | Notes |
|---|---|---|
| Frontend (Nginx) | `8080` | Public — serves the React SPA |
| Backend API | `3000` | Public — REST API + Swagger |
| PostgreSQL | `5434` | Dev access only — not exposed in production |
| PgBouncer | `6432` | Dev access only |
| Redis | `6379` | Dev access only |
| MinIO API | `9002` | Object storage API |
| MinIO Console | `9001` | Object storage admin UI |
| Prometheus | `9090` | Observability — restrict in production |
| Grafana | `3001` | Observability dashboard |
| Alertmanager | `9093` | Alert routing |
| Loki | `3100` | Log aggregation |
| node-exporter | `9100` | Host metrics scraper |
| Adminer | `8081` | DB admin UI — dev only |

> **Production note**: Ports `6379`, `6432`, `5434`, `8081`, `9090`, `9093`, `3100`, `9100`, and `3001`
> should be bound to `127.0.0.1` or removed entirely. They must not be publicly accessible.

---

## Common Operations

### View logs

```bash
docker compose logs -f              # all services
docker compose logs -f backend      # single service
```

### Stop & remove containers

```bash
docker compose down
```

### Wipe data volumes (full reset)

```bash
docker compose down -v
```

### Rolling deploy (zero downtime)

```bash
docker compose up -d --no-deps --build backend
docker compose up -d --no-deps --build sla-worker
docker compose up -d --no-deps --build frontend
docker compose exec backend npx prisma migrate deploy
```

### Container name conflict

```bash
docker compose down && docker compose up -d --build
```

---

## Environment Variables

Key variables (see `.env.example` for the full list):

| Variable | Description |
|---|---|
| `JWT_SECRET` | **Required.** Minimum 32-char random string |
| `POSTGRES_USER` | DB user (default: `prodkb`) |
| `POSTGRES_PASSWORD` | DB password |
| `POSTGRES_DB` | DB name (default: `prodkb`) |
| `REDIS_URL` | Redis connection string |
| `NODE_ENV` | `production` or `development` |
| `SECURITY_MODE` | Set to `strict` when running with HTTPS |
| `GRAFANA_PASSWORD` | Grafana admin password |

---

## Backup VM Setup (Primary → VM2 nightly pg_dump)

This setup runs a nightly `pg_dump` on the primary VM and `rsync`s the backup to VM2.

### On the primary VM

Create `/opt/prodkb/backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/opt/prodkb/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/prodkb_$TIMESTAMP.sql.gz"
VM2_USER="backup"
VM2_HOST="<VM2-IP-OR-HOSTNAME>"
VM2_DEST="/opt/prodkb/backups/"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

# Dump via the running postgres container
docker compose -f /opt/prodkb/docker-compose.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-prodkb}" "${POSTGRES_DB:-prodkb}" \
  | gzip > "$BACKUP_FILE"

echo "Backup written: $BACKUP_FILE"

# Transfer to VM2 over SSH (requires key-based auth pre-configured)
rsync -az --delete "$BACKUP_DIR/" "$VM2_USER@$VM2_HOST:$VM2_DEST"

echo "Sync to VM2 complete."

# Remove local backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete
```

Make executable and add to crontab:

```bash
chmod +x /opt/prodkb/backup.sh

# Run at 02:00 every night
crontab -e
# Add: 0 2 * * * /opt/prodkb/backup.sh >> /var/log/prodkb-backup.log 2>&1
```

### SSH key setup (primary → VM2)

```bash
# On primary VM — generate key if not already done
ssh-keygen -t ed25519 -C "prodkb-backup"

# Copy public key to VM2
ssh-copy-id backup@<VM2-IP>

# Test
ssh backup@<VM2-IP> "ls /opt/prodkb/backups/"
```

### Restore from backup

```bash
# On the primary VM (or VM2)
gunzip -c /opt/prodkb/backups/prodkb_<TIMESTAMP>.sql.gz \
  | docker compose exec -T postgres \
    psql -U "${POSTGRES_USER:-prodkb}" "${POSTGRES_DB:-prodkb}"
```

---

## Health Check

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","components":{"database":"connected","redis":"connected","slaWorker":"healthy"}}
```

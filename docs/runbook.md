# ProdKB — Production Runbook

## Table of Contents
- [Deployment](#deployment)
- [Rollback](#rollback)
- [Secret Rotation](#secret-rotation)
- [Common Incidents](#common-incidents)
- [Monitoring](#monitoring)
- [Escalation](#escalation)

---

## Deployment

### Docker Compose (Standard)
```bash
# Pull latest images and deploy
docker compose pull
docker compose up -d

# Run database migrations
docker compose exec backend npx prisma migrate deploy

# Seed initial data (first deploy only)
docker compose exec backend npx prisma db seed

# Verify health
curl http://localhost:3000/health
```

### Rolling Restart (Zero Downtime)
```bash
docker compose up -d --no-deps --build backend
docker compose up -d --no-deps --build sla-worker
docker compose up -d --no-deps --build frontend
```

---

## Rollback

### Application Rollback
```bash
# Tag current images before deploying
docker tag prodkb-backend:latest prodkb-backend:rollback

# If deployment fails, restore previous images
docker tag prodkb-backend:rollback prodkb-backend:latest
docker compose up -d
```

### Database Rollback
```bash
# List migration history
npx prisma migrate status

# Rollback last migration (CAUTION: may lose data)
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Secret Rotation

### JWT Secret Rotation
1. Generate new secret: `openssl rand -base64 64`
2. Update `JWT_SECRET` in production environment
3. Restart all backend instances
4. **Impact**: All existing sessions will be invalidated — users must re-login

### SendGrid / SMTP Password Rotation
1. Generate new API key in SendGrid dashboard
2. Update `SMTP_PASS` in production environment
3. Restart backend and SLA worker
4. Test: `curl -X POST /api/v1/config/email/test`

### Database Password Rotation
1. Update password in PostgreSQL
2. Update `DATABASE_URL` in all services
3. Restart backend, SLA worker, and cleanup worker

---

## Common Incidents

### Redis Connection Lost
**Symptoms**: Auth cache degradation, SLA enforcement stops
**Impact**: Auth falls back to DB queries (slower but functional). SLA breaches may go undetected.
**Steps**:
1. Check Redis container: `docker compose logs redis`
2. Verify connectivity: `docker compose exec redis redis-cli ping`
3. If crashed, restart: `docker compose restart redis`
4. Check `/health` endpoint — `components.redis` should show `connected`

### SLA Worker Stopped
**Symptoms**: BullMQ queue grows, SLA breaches not detected
**Steps**:
1. Check worker logs: `docker compose logs sla-worker`
2. Check Bull Board dashboard: `http://localhost:3000/admin/queues`
3. If crashed, restart: `docker compose restart sla-worker`
4. Check `/health` — `components.slaWorker` should show `healthy`

### Database Connection Pool Exhausted
**Symptoms**: 503 errors, slow responses, health check shows `database: disconnected`
**Steps**:
1. Check active connections: `SELECT count(*) FROM pg_stat_activity;`
2. Kill idle connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < NOW() - INTERVAL '5 minutes';`
3. Consider adding PgBouncer for connection pooling

### High Memory Usage
**Symptoms**: Node.js process consuming >512MB
**Steps**:
1. Check Prometheus metrics: `prodkb_nodejs_heap_size_total_bytes`
2. Check for webhook retry storms in Bull Board
3. Consider restarting the backend: `docker compose restart backend`

---

## Monitoring

### Health Check
```bash
# Returns component-level status
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "components": {
#     "database": "connected",
#     "redis": "connected",
#     "slaWorker": "healthy"
#   }
# }
```

### Prometheus Metrics
- **Endpoint**: `http://localhost:3000/metrics`
- **Key metrics**:
  - `prodkb_http_request_duration_seconds` — request latency
  - `prodkb_http_errors_total` — error count
  - `prodkb_active_connections` — concurrent requests
  - `prodkb_nodejs_heap_size_total_bytes` — memory

### Bull Board
- **URL**: `http://localhost:3000/admin/queues`
- Shows SLA queue status, failed jobs, retry history

---

## Escalation

| Severity | Response Time | Contact |
|----------|--------------|---------|
| P0 — Data loss / security breach | 15 minutes | On-call engineer + CTO |
| P1 — Service down | 30 minutes | On-call engineer |
| P2 — Degraded performance | 4 hours | Engineering team |
| P3 — Minor issue | Next business day | Engineering team |

# ProdKB — Production Knowledge Base & Incident Management

An internal platform for logging production incidents, managing Standard Operating Procedures (SOPs), enforcing SLAs, and coordinating automated escalations.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, React Hook Form, Zod |
| **Backend** | Node.js 20, Express 5, TypeScript, Prisma ORM, BullMQ |
| **Database** | PostgreSQL 16 (via PgBouncer connection pooler) |
| **Cache / Queues** | Redis 7 |
| **Object Storage** | MinIO (S3-compatible) |
| **Observability** | Prometheus, Grafana, Loki, Promtail |

## Requirements

- [Docker](https://docs.docker.com/engine/install/) & Docker Compose v2
- Node.js 20+ (for local development only)

## Quick Start (Docker — recommended)

```bash
# 1. Clone
git clone <repository-url>
cd prodkb

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET to a random 64-char string

# 3. Start the full stack
docker compose up -d

# 4. Run database migrations
docker compose exec backend npx prisma migrate deploy

# 5. Open the app
open http://localhost:8080
```

Default seed credentials: `admin@prodkb.com` / `password123` — **change immediately in production**.

> See [README_DOCKER.md](README_DOCKER.md) for full Docker reference including backup VM setup.

## Local Development (without Docker)

Requires PostgreSQL 16 and Redis 7 running locally.

```bash
# Backend
cd backend
cp .env.example .env      # fill in DATABASE_URL, REDIS_URL, JWT_SECRET
npm install
npx prisma migrate dev
npm run dev               # http://localhost:3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Running Tests

```bash
# Backend (Jest)
cd backend
npm test

# Frontend (Vitest)
cd frontend
npm test
```

## Key URLs (Docker stack)

| URL | Description |
|---|---|
| `http://localhost:8080` | Frontend |
| `http://localhost:3000` | Backend API |
| `http://localhost:3000/health` | Health check |
| `http://localhost:3000/api-docs` | Swagger UI |
| `http://localhost:3000/admin/queues` | Bull Board (ADMIN only) |

## Documentation

- [README_DOCKER.md](README_DOCKER.md) — Docker Compose reference & backup VM
- [CONTRIBUTING.md](CONTRIBUTING.md) — Branch strategy, PR process, code standards
- [SECURITY.md](SECURITY.md) — Security measures & vulnerability reporting
- [docs/runbook.md](docs/runbook.md) — Deployment, rollback, incident playbooks
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Architecture contract & design rules
- `http://localhost:3000/api-docs` — Interactive API reference (Swagger)

## License

ISC

# Contributing to ProdKB

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional, for full stack)

### Local Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Development Workflow

### Branch Strategy
- `main` — production-ready, protected
- `develop` — integration branch
- `feature/<name>` — new features
- `fix/<name>` — bug fixes

### Pull Request Process
1. Create a branch from `develop`
2. Make your changes
3. Before pushing, run the full pre-push checklist:
   ```bash
   # Backend
   cd backend
   npm run lint          # ESLint — must pass with 0 errors
   npx tsc --noEmit      # Type check — must pass
   npm test              # Jest — all tests must pass

   # Frontend
   cd frontend
   npm run lint
   npx tsc --noEmit
   npm test
   ```
4. Submit PR to `develop`
5. Get at least 1 approval
6. Squash and merge

---

## Code Standards

### TypeScript
- **No `any` types** — use `unknown` and narrow with type guards
- Use Prisma generated types for database models
- Define interfaces for API request/response shapes

### API Endpoints
- Follow REST conventions
- Use Zod schemas for input validation
- Return consistent responses via `createResponse()`
- Use proper HTTP status codes

### Error Handling
- Use custom error classes (`AppError`, `NotFoundError`, etc.)
- Never swallow errors — log them with context
- Notifications should not fail the request (use try/catch)

### Testing
- Unit tests: `backend/tests/` (Jest)
- Frontend tests: `frontend/src/__tests__/` (Vitest)
- Minimum 70% code coverage for new code
- Integration tests for critical business flows

### Commit Messages
Follow conventional commits:
```
feat: add SLA breach email notifications
fix: resolve N+1 query in dashboard stats
docs: update runbook with Redis recovery steps
chore: upgrade Prisma to v6.19
```

---

## Architecture Overview

```
backend/
├── src/
│   ├── common/          # Shared: middleware, utils, services, errors
│   ├── config/          # Environment validation (env.ts, cors.ts, helmet.ts)
│   ├── modules/         # Feature modules (auth, incidents, sla, etc.)
│   ├── workers/         # Background workers (sla, webhook, cleanup)
│   ├── app.ts           # Express app setup (middleware, routes)
│   └── server.ts        # Entry point (cluster, listen, graceful shutdown)
├── prisma/              # Database schema + migrations
└── tests/               # Test suites

frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page-level components
│   ├── services/        # API client services
│   ├── hooks/           # Custom React hooks
│   └── contexts/        # React contexts (Auth, etc.)
```

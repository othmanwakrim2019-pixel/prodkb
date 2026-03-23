# Security Policy

## Security Measures in Place

### Authentication & Session Management

- **Passwords**: hashed with `bcrypt` (cost factor 12)
- **Access tokens**: short-lived JWTs (15 min), signed with `JWT_SECRET`
- **Refresh tokens**: long-lived (7 days), stored in **HTTP-Only, SameSite=Strict cookies** — not accessible to JavaScript (XSS-safe)
- **Token revocation**: refresh token blacklist stored in Redis; logout immediately invalidates the session
- **Account lockout**: after 5 consecutive failed login attempts the account is locked for 15 minutes

### CSRF Protection

Double-submit cookie pattern (`csrf.middleware.ts`):

- A `csrf-token` cookie is set on login
- All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) must include the token in the `X-CSRF-Token` header
- The middleware compares cookie value vs. header value; mismatch returns `403`

### Rate Limiting

- **Auth endpoints** (`/auth/*`): stricter limit (prevent brute-force)
- **API endpoints** (`/api/*`): general limit (prevent scraping/DoS)
- **Upload endpoints**: separate limit for file upload abuse
- Counters stored in Redis using a sliding window

### HTTP Security Headers (Helmet)

All responses include:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (strict mode only) |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | restrictive policy (see `helmet.ts`) |
| `X-Request-ID` | UUID per request for log correlation |

### Authorization

- Role-based access control (RBAC): `ADMIN`, `EXPERT`, `OPERATOR`, `VIEWER`
- Permission checks enforced server-side on every protected route via `authorize()` middleware
- No security decisions are made on the frontend alone

### Input Validation

- All incoming request bodies validated with **Zod** schemas at the controller boundary
- Prisma ORM with parameterized queries — no raw SQL string interpolation (SQL injection prevention)

### Infrastructure

- PostgreSQL, Redis, PgBouncer, and the observability stack are not exposed on public interfaces
- Object storage (MinIO) uses pre-signed URLs with short expiry for file access
- All secrets are injected via environment variables — never committed to the repo

---

## Deployment Hardening Checklist

1. Set `JWT_SECRET` to a random 64-character string: `openssl rand -base64 64`
2. Change all default passwords (`POSTGRES_PASSWORD`, `GRAFANA_PASSWORD`, admin seed user)
3. Set `SECURITY_MODE=strict` when running behind HTTPS (enables HSTS + Secure cookies)
4. Bind internal service ports to `127.0.0.1` only (see [README_DOCKER.md](README_DOCKER.md))
5. Keep dependencies updated: run `npm audit` regularly in both `backend/` and `frontend/`
6. Review audit logs (`/api/v1/audit`) periodically for suspicious activity

---

## Reporting a Vulnerability (Internal)

ProdKB is an internal tool. If you find a security issue:

1. **Do not open a public issue.**
2. **Contact the infrastructure/backend team directly** via your internal communication channel (e.g., Teams/Slack #security or by direct message to the tech lead).
3. **Include:**
   - Clear description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix if you have one

### Response Timeline

| Stage | Target |
|---|---|
| Acknowledgment | Within 24 hours |
| Impact assessment | Within 3 business days |
| Fix — critical (auth bypass, data exposure) | Within 5 business days |
| Fix — non-critical | Within 2 sprints |

### Scope

In scope:
- Authentication/authorization bypasses
- CSRF, XSS, injection vulnerabilities
- Privilege escalation
- Sensitive data exposure

Out of scope:
- DoS via resource exhaustion
- Social engineering
- Vulnerabilities in third-party libraries (report upstream to the library maintainer)

---

## Supported Versions

| Version | Supported |
|---|---|
| 1.x (current) | ✅ |
| < 1.0 | ❌ |

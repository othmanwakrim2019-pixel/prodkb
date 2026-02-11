# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ProdKB, please report it responsibly.

### How to Report

1. **Email:** Send a detailed report to the project maintainers (do not open a public issue).
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if applicable)

### Response Timeline

| Stage | Timeframe |
|-------|-----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix (critical) | Within 7 business days |
| Fix (non-critical) | Within 30 business days |

### Scope

The following are in scope for security reports:

- Authentication and authorization bypasses
- SQL injection, XSS, CSRF, and other OWASP Top 10 vulnerabilities
- Privilege escalation
- Data exposure or leakage
- Insecure default configurations

### Out of Scope

- Denial-of-service attacks
- Social engineering
- Issues in third-party dependencies (report to the respective maintainer)
- Issues requiring physical access to the server

## Security Best Practices for Deployment

1. **Change all default credentials** before deploying to production. See `.env.example`.
2. **Use a strong, random `JWT_SECRET`** (minimum 32 characters).
3. **Change the default admin password** immediately after the initial seed.
4. **Enable HTTPS** via a reverse proxy (e.g., Nginx) in front of the backend.
5. **Restrict database access** to the backend service only (no public port exposure).
6. **Keep dependencies updated** — run `npm audit` regularly.
7. **Review audit logs** periodically for suspicious activity.

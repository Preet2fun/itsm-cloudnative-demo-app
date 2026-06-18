# Changelog — user-service

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Planned (v0.3.0 — Phase 6)
- RS256 JWT signing — private key loaded from `JWT_PRIVATE_KEY` env var
- JWKS endpoint updated to serve RSA public key (`kty: RSA`) for Istio RequestAuthentication
- `iss` claim added to JWT payload (`itsm-user-service`)

### Planned (v0.4.0 — Sprint 1)
- `POST /api/v1/auth/mfa/send` — generate email OTP, store in Redis (5 min TTL), send via SMTP
- `POST /api/v1/auth/mfa/verify` — validate OTP, issue JWT on success
- Login response updated: returns `{"mfa_required": true, "session_id": "..."}` before OTP step
- SMTP sender with dev-mode fallback (logs OTP to stdout when `SMTP_HOST` unset)

---

## [0.2.0] - 2026-04-20

### Added
- `POST /api/v1/auth/login` — credential validation, HS256 JWT issuance
- `POST /api/v1/auth/refresh` — token refresh with sliding expiry
- `GET /api/v1/.well-known/jwks.json` — JWKS endpoint (HS256/oct format, to be replaced in v0.3.0)
- `GET /api/v1/users` — list users (admin only, scoped to `X-Tenant-ID`)
- `GET /api/v1/users/:id` — get user by ID (tenant-scoped)
- Multi-tenant JWT claims: `tenant_id`, `role`, `email`, `sub`, `jti`
- OTel auto-instrumentation + manual spans (`itsm.user.login`, `itsm.user.list`)
- `tenant.id` and `user.role` attributes on all business spans
- Health endpoint: `GET /api/v1/health`

### Architecture
- Go 1.22, Chi v5 router, pgx/v5 for PostgreSQL
- PostgreSQL `search_path` set per-connection from `X-Tenant-ID` header (not in DSN)
- No JWT validation inside handlers — reads `X-Tenant-ID` / `X-User-Role` headers from Istio

---

## [0.1.0] - 2026-04-15

### Added
- Initial service scaffold: Go module, Chi v5 router, config loader
- `GET /api/v1/health` endpoint
- PostgreSQL connection via `DATABASE_URL`
- Dockerfile (multi-stage, distroless final image)
- OTel tracer initialisation

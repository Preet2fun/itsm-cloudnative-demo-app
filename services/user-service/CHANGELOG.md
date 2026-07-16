# Changelog — user-service

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

---

## [0.4.0] - 2026-07-09

### Added (Sprint 1)
- `POST /api/v1/auth/mfa/send` — generates a 6-digit email OTP, stores it in Redis (`itsm:{tenant_slug}:otp:{session_id}`, 5 min TTL); logs the code to stdout in dev mode (`SMTP_HOST` unset) rather than sending real email
- `POST /api/v1/auth/mfa/verify` — validates the OTP, issues the RS256 JWT on success (single-use code, deleted immediately on a correct match)
- `POST /api/v1/auth/login` now returns `{"mfa_required": true, "session_id": "..."}` instead of issuing a token directly — the pending-login user/tenant association is stored at `itsm:auth-session:{session_id}` (10 min TTL)
- New `itsm.user.mfa_send` and `itsm.user.mfa_verify` OTel spans (`tenant.id`, `user.role` attributes)
- New OTel metrics: `itsm_login_attempts_total{tenant, result}`, `itsm_mfa_otp_sent_total{tenant}`, `itsm_mfa_verify_attempts_total{tenant, result}` — first metrics in this service; `telemetry.Init` now also registers a `MeterProvider`
- New `REDIS_URL` (required) and `SMTP_HOST` (optional, empty = dev mode) environment variables

### Changed
- `itsm.user.login` span's `login_success` event renamed to `credentials_valid` — the true "fully authenticated" event is now `mfa_verify_success` on the new `itsm.user.mfa_verify` span

---

## [0.3.0] - 2026-07-08

### Added (Phase 6 — Istio + OPA, retroactively documented; this work shipped before this CHANGELOG entry was written)
- RS256 JWT signing — private key loaded from `JWT_PRIVATE_KEY` env var
- JWKS endpoint updated to serve RSA public key (`kty: RSA`) for Istio RequestAuthentication
- `iss` claim added to JWT payload (`itsm-user-service`)

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

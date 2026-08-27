# Changelog — asset-service

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Planned (v0.3.0 — Sprint 3)
- Asset list + detail API wired to Synap UI (Sprint 3)
- Pagination: `?page=` + `?per_page=` query params

---

## [0.2.0] - 2026-05-01

### Added
- `GET /api/v1/assets` — list assets, tenant-scoped via `X-Tenant-ID`
- `GET /api/v1/assets/:id` — asset detail
- `POST /api/v1/assets` — create asset (admin/agent only)
- `PUT /api/v1/assets/:id` — update asset
- `DELETE /api/v1/assets/:id` — soft-delete asset
- Redis cache with key pattern `itsm:{tenant_slug}:assets:list:{hash}` (5 min TTL)
- Cache invalidation on write operations
- OTel instrumentation: `itsm.asset.list`, `itsm.asset.get`, `itsm.asset.create`
- Custom metrics: `itsm_assets_active_count{tenant, asset_type}` gauge
- Health endpoint: `GET /api/v1/health`

### Architecture
- Python 3.12, FastAPI 0.111+, SQLAlchemy 2.x async, asyncpg
- PostgreSQL `search_path` set per-connection from `X-Tenant-ID` header
- `tenant.id` and `user.role` on every span

---

## [0.1.0] - 2026-04-20

### Added
- Initial service scaffold: FastAPI, SQLAlchemy 2.x async, config loader
- `GET /api/v1/health` endpoint
- Dockerfile (multi-stage, python:3.12-slim final image)
- OTel tracer initialisation

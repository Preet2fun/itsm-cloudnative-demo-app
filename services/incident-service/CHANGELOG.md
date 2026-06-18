# Changelog — incident-service

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Planned (v0.3.0 — Sprint 4)
- Incident list + detail API wired to Synap UI (Sprint 4)
- Filter by status, priority, assignee

---

## [0.2.0] - 2026-05-01

### Added
- `GET /api/v1/incidents` — list incidents, tenant-scoped via `X-Tenant-ID`
- `GET /api/v1/incidents/:id` — incident detail with timeline
- `POST /api/v1/incidents` — create incident; publishes `incident.created` event to RabbitMQ
- `PUT /api/v1/incidents/:id` — update incident (status, priority, assignee)
- `POST /api/v1/incidents/:id/resolve` — resolve incident; publishes `incident.resolved` event
- RabbitMQ event publishing with W3C TraceContext `traceparent` header in AMQP message headers
- OTel instrumentation: `itsm.incident.create`, `itsm.incident.list`, `itsm.incident.resolve`
- Custom metrics: `itsm_incidents_created_total{tenant, priority}` counter, `itsm_incidents_resolved_duration_seconds{priority}` histogram
- Health endpoint: `GET /api/v1/health`

### Architecture
- Python 3.12, FastAPI 0.111+, SQLAlchemy 2.x async, asyncpg, aio-pika
- PostgreSQL `search_path` set per-connection from `X-Tenant-ID` header
- `tenant.id` and `user.role` on every span

---

## [0.1.0] - 2026-04-20

### Added
- Initial service scaffold: FastAPI, SQLAlchemy 2.x async, aio-pika, config loader
- `GET /api/v1/health` endpoint
- Dockerfile (multi-stage, python:3.12-slim final image)
- OTel tracer initialisation

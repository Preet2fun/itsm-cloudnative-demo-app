# Changelog

## Phase 1 — Repository Scaffold & Documentation Foundation
**Date:** 2026-04-13
**Status:** ✅ Complete

### Added
- Complete repository directory structure as defined in `SYSTEM_PROMPT.md` Section 4
- `README.md` — project overview, ASCII architecture diagram, tech stack, quick start, phase status table, `/etc/hosts` setup, environment switching guide
- `CONTRIBUTING.md` — branch naming, commit conventions (Conventional Commits), PR checklist, OPA policy testing guide
- `.gitignore` — Python, Go, Node, K8s secrets, `.env*` files, kubeconfig
- `docs/00_Overview.md` — full architecture narrative, request flow walkthrough, multi-tenancy layer diagram, OPA RBAC flow, GitOps delivery model
- `docs/02_App_Architecture/01_Service_Design.md` — all service responsibilities, language rationale, inter-service communication patterns, why no dedicated API Gateway
- `docs/02_App_Architecture/03_Multi_Tenancy.md` — seven-layer isolation model with YAML examples, JWT structure, adding a new tenant guide
- `docs/03_Deployment/03_Environment_Guide.md` — `ENV=dev|qa` variable usage, Helm values layering, ArgoCD Application structure, `/etc/hosts` setup, dev→qa promotion workflow
- `database/schema-diagram.md` — full ER descriptions for all 7 entities with column definitions, indexes, SLA targets, migration strategy
- `docs/CHANGELOG.md` (this file)
- Stub files for all services, infra directories, scripts, CI workflows (populated in later phases)
- MCP server configuration in `~/.claude/settings.json`

### Architecture decisions recorded
- Istio IngressGateway as API gateway (no dedicated Go gateway service)
- OPA ext_authz for RBAC (two-layer AuthZ: Istio tenant isolation + OPA role enforcement)
- Schema-per-tenant PostgreSQL isolation
- `ENV=dev|qa` environment model with Helm values layering

---

## Phase 2 — Database Layer
**Date:** 2026-04-14
**Status:** ✅ Complete

### Added

#### Migrations (`database/migrations/`)
- `000001_init_schema.up/down.sql` — pgcrypto + pg_trgm extensions, `public.tenants` registry table
- `000002_tenant_schema_function.up/down.sql` — `create_tenant_schema(slug TEXT)` stored procedure: creates schema + users, assets, incidents, incident_events tables with all indexes
- `000003_tenant_indexes.up/down.sql` — trigram GIN indexes on `full_name`, `name`, `title`, `description` for seed tenant schemas (Phase 7 text search ready)
- `000004_updated_at_triggers.up/down.sql` — `public.set_updated_at()` trigger function + `public.attach_updated_at_trigger()` helper; triggers attached to all seed schemas
- `000005_phase7_ai_stubs.up/down.sql` — `asset_embeddings` and `incident_ai_analysis` stub tables (vector column as TEXT placeholder); `public.add_ai_stubs()` helper

#### Seed Data (`database/seeds/`)
- `seed-tenant-a.sql` — GlobalTech Solutions: 10 users (2 admin / 5 agent / 3 viewer), 20 assets (hardware/software/network), 15 incidents (P1–P4 mix), incident_events for key incidents
- `seed-tenant-b.sql` — RetailEdge Corp: retail/POS industry vertical, 10 users, 20 assets, 15 incidents
- `seed-tenant-c.sql` — StartupNest Ltd: minimal dataset (5 users, 5 assets, 3 incidents) to validate small-tenant isolation

#### Scripts
- `scripts/create-tenants.sh` — full implementation: creates schemas via stored procedure, attaches triggers, adds AI stubs, adds trgm indexes, optionally seeds data; supports `ENV=dev|qa`, `TENANTS=<slugs>`, `SEED=true`

#### Kubernetes Manifests
- `infra/k8s/namespaces/dev/namespace-itsm-dev.yaml` — `itsm-dev` namespace (Istio injection enabled)
- `infra/k8s/namespaces/qa/namespace-itsm-qa.yaml` — `itsm-qa` namespace (Istio injection enabled)

#### Environment & Config
- `.env.example` — template with `DATABASE_URL`, `REDIS_URL`, `RABBITMQ_URL`, `JWT_SECRET`, service ports, OTel config, AI placeholders
- `scripts/create-tenants.sh` — updated to parse `DATABASE_URL` directly (no separate DB_HOST/PORT vars needed)

#### Documentation
- `docs/02_App_Architecture/02_Data_Flow.md` — complete: read path, write path, async notification path, schema-per-tenant routing, Redis cache strategy, migration execution flow, service-to-DB connection model, OTel span naming, custom metrics
- `docs/05_Phase_Deployment_Guides/README.md` — index of all phase deployment guides
- `docs/05_Phase_Deployment_Guides/Phase_01_Repo_Scaffold.md` — Phase 1 deployment steps
- `docs/05_Phase_Deployment_Guides/Phase_02_Database.md` — full Phase 2 deployment guide: PostgreSQL install, remote access, migrations, tenant creation, seed data, GUI verification, rollback, troubleshooting, acceptance checklist

### Architecture decisions recorded
- `search_path` set per-connection at request time (not DSN) — tenant slug sourced from Istio-injected `X-Tenant-ID` header
- PostgreSQL runs as **standalone external service** (not in K8s) — simpler for local dev, GUI tools connect natively, K8s services connect via `DATABASE_URL` env var
- `DATABASE_URL` used as single connection variable across all services and scripts — easy to replace host without touching multiple variables
- AI tables seeded as TEXT-column stubs — upgraded to `vector(1536)` in Phase 7 without breaking existing schemas

---

## Phase 3 — User Service (Go)
**Date:** 2026-04-15
**Status:** ✅ Complete

### Added

#### Service code (`services/user-service/`)
- `go.mod` — module `github.com/itsm-cloudnative/user-service`; deps: chi/v5, pgx/v5, golang-jwt/jwt/v5, otelhttp, OTel SDK, bcrypt
- `internal/config/config.go` — env var loading with validation; strips `http://` prefix from OTLP endpoint for gRPC compatibility
- `internal/db/db.go` — pgxpool (max 10 conns); `SetTenantPath()` validates slug regex then sets `search_path` per connection
- `internal/models/user.go` — `User` struct, `UserResponse` (no password_hash), all request/response types
- `internal/repository/user_repo.go` — all CRUD + password ops; each method acquires a connection, calls `SetTenantPath`, queries, releases
- `internal/middleware/headers.go` — `TenantRequired` middleware: extracts and validates `X-Tenant-ID` / `X-User-Role`; context getters
- `internal/handlers/auth.go` — `Login` (email + password + tenant_slug → HS256 JWT with 6 required claims); `Refresh` (parse current JWT → issue new one)
- `internal/handlers/users.go` — `List`, `Create`, `GetByID`, `Update`, `Delete`, `ChangePassword`, `InternalGetByID` (service-to-service)
- `internal/handlers/jwks.go` — JWKS endpoint serving HS256 `oct` key (Phase 6 Istio note included)
- `telemetry/telemetry.go` — OTLP gRPC exporter + TracerProvider + W3C propagators; OTel failure is non-fatal (service starts without traces)
- `cmd/main.go` — Chi router with otelhttp wrapper, graceful shutdown on SIGTERM/SIGINT
- `Dockerfile` — multi-stage: `golang:1.22-alpine` builder → `distroless/static:nonroot` runtime; CGO_ENABLED=0

#### Helm chart (`infra/helm/itsm-app/`)
- `Chart.yaml` — apiVersion v2, app chart
- `values.yaml` — dev defaults: resource limits (100m/300m CPU, 128Mi/256Mi mem), HPA min=1 max=2 CPU=70%
- `values-qa.yaml` — QA overrides (shorter JWT expiry, qa namespace)
- `templates/user-service/deployment.yaml` — DATABASE_URL + JWT_SECRET from K8s Secret; readiness/liveness on `/api/v1/health`; distroless securityContext; topology spread
- `templates/user-service/service.yaml` — ClusterIP, port 80 → 8080
- `templates/user-service/hpa.yaml` — autoscaling/v2, CPU 70%, max=2

#### Documentation
- `docs/05_Phase_Deployment_Guides/Phase_03_User_Service.md` — full guide: local build/test, Docker image, K8s Secret creation, Helm deploy, port-forward verification, tenant isolation test, rollback, troubleshooting, acceptance checklist

### Architecture decisions recorded
- Login endpoint requires `tenant_slug` in request body because no JWT exists at login time — Istio cannot inject `X-Tenant-ID` on unauthenticated requests
- JWT refresh is the only place (other than login) where the User Service parses a JWT — all downstream services trust Istio-injected headers only
- JWKS serves HS256 `oct` key for Phase 3 compatibility; Phase 6 note documents RS256 upgrade path if needed for Istio `RequestAuthentication`
- OTel collector failure is non-fatal at startup — service degrades gracefully (no traces) rather than refusing to start in dev environments without a collector

---

---

## Phase 4 — Asset Service & Incident Service (Python/FastAPI)
**Date:** 2026-04-27
**Status:** 🔲 Code complete — pending cluster deployment validation

### Added

#### Infrastructure (Redis + RabbitMQ)
- `infra/helm/itsm-app/templates/redis/statefulset.yaml` — Redis 7-alpine StatefulSet with 1Gi PVC (local-path), AOF persistence (`--appendonly yes --appendfsync everysec`), `runAsUser: 999`
- `infra/helm/itsm-app/templates/redis/service.yaml` — ClusterIP on port 6379
- `infra/helm/itsm-app/templates/rabbitmq/statefulset.yaml` — RabbitMQ 3.13-management-alpine StatefulSet with 2Gi PVC (local-path), credentials from `itsm-secrets`, `runAsUser: 999`
- `infra/helm/itsm-app/templates/rabbitmq/service.yaml` — ClusterIP on ports 5672 (AMQP) and 15672 (management)
- `infra/helm/itsm-app/values.yaml` — extended with `redis`, `rabbitmq`, `assetService`, `incidentService` blocks
- `infra/helm/itsm-app/values-qa.yaml` — QA overrides for both new services

#### Asset Service (`services/asset-service/`)
- `app/config.py` — Pydantic v2 `BaseSettings`; reads `DATABASE_URL`, `REDIS_URL`, `ENV`, `ASSET_SERVICE_PORT` from environment
- `app/telemetry.py` — OTLP gRPC exporter + TracerProvider; OTel failure is non-fatal
- `app/db.py` — `create_async_engine` (postgresql+asyncpg), `tenant_session()` context manager sets `search_path TO {slug}, public` per connection
- `app/cache.py` — async Redis client; key convention `itsm:{tenant}:assets:{op}:{md5[:8]}`; TTL=60s; scan-based invalidation
- `app/models.py` — `Asset` ORM (`asset_metadata` attr → `metadata` column to avoid SQLAlchemy conflict); `IncidentSummary` read-only model
- `app/repository.py` — `list_assets`, `get_asset`, `create_asset`, `update_asset`, `delete_asset`, `get_asset_incidents`; all use `tenant_session()`
- `app/router.py` — `GET /api/v1/health`, `GET /api/v1/assets`, `POST /api/v1/assets`, `GET /api/v1/assets/{id}`, `PUT /api/v1/assets/{id}`, `DELETE /api/v1/assets/{id}`, `GET /api/v1/assets/{id}/incidents`; Redis cache on list/get; OTel spans + custom metrics
- `app/main.py` — FastAPI app factory; startup/shutdown hooks; request-id middleware; SQLAlchemy + Redis auto-instrumentation
- `requirements.txt` — pinned: fastapi 0.111, uvicorn, sqlalchemy[asyncio] 2.0.30, asyncpg, pydantic-settings, redis[asyncio], OTel 1.24/0.45b0 suite
- `Dockerfile` — two-stage python:3.12-slim builder → runner; `adduser --uid 65532 nonroot`; `USER 65532:65532`
- Helm templates: `deployment.yaml` (runAsUser 65532, readOnlyRootFilesystem: false), `service.yaml`, `hpa.yaml`

#### Incident Service (`services/incident-service/`)
- `app/config.py` — reads `DATABASE_URL`, `RABBITMQ_URL`, `ENV`, `INCIDENT_SERVICE_PORT`
- `app/telemetry.py` — same pattern as asset-service
- `app/db.py` — same `tenant_session()` pattern
- `app/mq.py` — aio-pika robust connection; durable topic exchange `itsm.incidents`; W3C `traceparent` injected into AMQP headers; `DeliveryMode.PERSISTENT`; routing keys: `incident.created`, `incident.updated`, `incident.resolved`
- `app/models.py` — `Incident` ORM with `SLA_HOURS = {P1:4, P2:8, P3:24, P4:72}`; `IncidentEvent` ORM (JSONB payload); columns match migration exactly (`related_asset`, `assigned_to`)
- `app/repository.py` — full incident CRUD + event append + assign + resolve operations
- `app/router.py` — `GET /api/v1/health`, `GET /api/v1/incidents`, `POST /api/v1/incidents`, `GET /api/v1/incidents/{id}`, `PUT /api/v1/incidents/{id}`, `POST /api/v1/incidents/{id}/events`, `POST /api/v1/incidents/{id}/assign`, `POST /api/v1/incidents/{id}/resolve`, `GET /api/v1/incidents/{id}/events`; OTel spans + counters + histograms; SLA breach detection
- `app/main.py` — same factory pattern; RabbitMQ init on startup
- `requirements.txt` — same as asset-service plus `aio-pika 9.4.1`, `opentelemetry-instrumentation-aio-pika`
- `Dockerfile` — identical to asset-service
- Helm templates: `deployment.yaml` (runAsUser 65532, readOnlyRootFilesystem: false), `service.yaml`, `hpa.yaml`

#### Documentation
- `docs/05_Phase_Deployment_Guides/Phase_04_Asset_Incident_Services.md` — full guide: Step 0 (local-path-provisioner — kubeadm StorageClass prerequisite), Step 1 (K8s Secret with 6 keys), Step 2 (Docker build+push), Step 3 (Helm deploy), Steps 4-8 (verification, RabbitMQ check, endpoint tests, acceptance checklist)

### Architecture decisions recorded
- local-path-provisioner (Rancher v0.0.26) is the standard StorageClass for kubeadm bare-metal clusters; installed once at cluster level, not per-namespace
- Redis and RabbitMQ deployed as StatefulSets with PVCs (not Deployments) — data persistence required for production-mimicking setup
- `readOnlyRootFilesystem: false` required for Python/uvicorn services (needs `/tmp`); Go distroless services can use `true`
- `runAsUser: 65532` must accompany `runAsNonRoot: true` — K8s rejects named users ("nonroot") in older cluster versions
- `metadata` column requires Python attribute rename to `asset_metadata` due to SQLAlchemy `DeclarativeBase.metadata` conflict
- W3C TraceContext (`traceparent`) stored in AMQP message headers for end-to-end distributed tracing through RabbitMQ
- `itsm-secrets` extended to 6 keys: `database-url`, `jwt-secret`, `redis-url`, `rabbitmq-url`, `rabbitmq-user`, `rabbitmq-password`

*Future phases will be appended here as they are completed and validated.*

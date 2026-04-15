# Service Design

## Design Principles

1. **Single responsibility** — each service owns exactly one ITSM domain (users, assets, incidents, notifications, AI)
2. **No shared libraries** — services share nothing at the code level; contracts are HTTP APIs only
3. **Stateless application services** — all state in PostgreSQL or Redis; services scale horizontally
4. **Trust the mesh** — services trust `X-Tenant-ID` and `X-User-Role` headers injected by Istio; they never re-validate JWTs
5. **OTel from day one** — every service ships a `telemetry/` package that wires both auto and manual instrumentation at startup

---

## Service Inventory

### User Service (Go)

**Port:** 8080
**Language:** Go 1.22+ with Chi v5 router

**Responsibilities:**
- User registration, profile management, password management
- JWT issuance (HS256) with tenant-scoped claims (`tenant_id`, `role`, `sub`)
- JWKS endpoint (`/api/v1/.well-known/jwks.json`) — consumed by Istio `RequestAuthentication`
- Token refresh
- User CRUD (create/read/update/delete) — access controlled by OPA via `X-User-Role` header

**Why Go:** Low-latency auth path; JWT crypto operations benefit from compiled performance; small binary for distroless image.

**Key dependencies:** `golang-jwt/jwt` v5, `chi` v5, `otelsql` (OTel DB), `otelchi` (OTel HTTP)

**Data owned:** `tenant_<slug>.users` table

---

### Asset Service (Python/FastAPI)

**Port:** 8081
**Language:** Python 3.12 with FastAPI

**Responsibilities:**
- Asset CRUD — hardware, software, network assets
- CMDB-lite metadata via JSONB `metadata` field
- Asset status lifecycle (active → maintenance → retired)
- Redis caching of asset list queries (TTL 60s, invalidated on write)
- Asset-to-incident linkage (read — incidents are owned by Incident Service)
- Phase 7: vector embedding generation on asset create/update for semantic search

**Why Python:** Rich ML/AI ecosystem for Phase 7 embedding pipeline; FastAPI's async model handles I/O-bound workloads well.

**Key dependencies:** `fastapi`, `sqlalchemy[asyncio]`, `asyncpg`, `redis[asyncio]`, `opentelemetry-instrumentation-fastapi`

**Data owned:** `tenant_<slug>.assets` table, `tenant_<slug>.asset_embeddings` (Phase 7)

---

### Incident Service (Python/FastAPI)

**Port:** 8082
**Language:** Python 3.12 with FastAPI

**Responsibilities:**
- Incident lifecycle: open → in_progress → resolved → closed
- Priority management (P1–P4) with SLA tracking
- Incident event log (status changes, comments, assignments)
- Assignee and asset linkage
- RabbitMQ publishing: `incident.created`, `incident.updated`, `incident.resolved` events with W3C trace context propagated in message headers

**Key dependencies:** `fastapi`, `sqlalchemy[asyncio]`, `aio-pika` (async RabbitMQ), `opentelemetry-instrumentation-pika`

**Data owned:** `tenant_<slug>.incidents`, `tenant_<slug>.incident_events`, `tenant_<slug>.incident_ai_analysis` (Phase 7)

---

### Notification Service (Go)

**Port:** 8083 (health only — no public API)
**Language:** Go 1.22+

**Responsibilities:**
- RabbitMQ consumer for all incident events
- Extracts W3C trace context from message headers to continue distributed traces
- Webhook delivery stubs (logs payload — real delivery in Phase 7)
- Future: email, Slack, PagerDuty integration stubs

**Why Go:** RabbitMQ consumer is I/O-wait dominated; Go goroutines handle concurrent consumption efficiently with low memory overhead.

---

### AI Service (Python/FastAPI)

**Port:** 8084
**Language:** Python 3.12 with FastAPI

**Responsibilities (all Phase 7):**
- Incident triage — LLM-powered root cause analysis and priority suggestion
- Semantic asset search — pgvector similarity search with natural language queries
- Anomaly detection — IsolationForest/Prophet on Prometheus metric snapshots
- IT helpdesk chatbot — RAG over tenant-scoped assets, incidents, users

**Note:** Service is deployed from Phase 3 with stub endpoints (`/api/v1/ai/health`) to allow Istio routing config to be validated early. AI implementations drop in during Phase 7.

---

### Frontend (Next.js)

**Port:** 3000
**Language:** TypeScript, Next.js 14 App Router

**Responsibilities:**
- Unified UI for Asset Management, User Management, Incident Management
- JWT stored in httpOnly cookie (set by User Service login response)
- Calls all backend services through Istio IngressGateway (same origin — no CORS)
- AI assistant panel (Phase 7)

---

## Inter-Service Communication

### Synchronous (HTTP/REST via Istio)

All service-to-service calls go through Istio sidecar proxies — mTLS is enforced automatically.

```
Frontend → User Service:      /api/v1/users/*
Frontend → Asset Service:     /api/v1/assets/*
Frontend → Incident Service:  /api/v1/incidents/*
Frontend → AI Service:        /api/v1/ai/*
```

There is no direct service-to-service synchronous call between backend services. All backend reads cross-service data via their own DB queries (same PostgreSQL, different table by FK reference within the same tenant schema).

### Asynchronous (RabbitMQ)

```
Incident Service  ──publishes──▶  Exchange: itsm.{env}.{tenant_id}.incidents
                                       │
                                       └──▶  Notification Service (consumer)
                                       └──▶  AI Service (consumer, Phase 7 — anomaly alerts)
```

Message format:
```json
{
  "event_type": "incident.created",
  "tenant_id": "tenant-a",
  "incident_id": "uuid",
  "priority": "P1",
  "timestamp": "2026-04-13T10:00:00Z",
  "traceparent": "00-4bf92f3577b34da6...-00f067aa0ba902b7-01",
  "tracestate": ""
}
```

The `traceparent` and `tracestate` fields carry the W3C TraceContext, enabling Notification Service and AI Service to create child spans that continue the distributed trace started in Incident Service.

---

## Why No Dedicated API Gateway Service

In early design, a Go API Gateway service was planned to handle JWT validation, tenant routing, rate limiting, and header injection. This was replaced by Istio-native capabilities:

| Concern | Replaced by |
|---|---|
| JWT validation | Istio `RequestAuthentication` + JWKS |
| Tenant header injection | `outputClaimToHeaders` in RequestAuthentication |
| Tenant routing | Istio `VirtualService` host matching |
| RBAC | OPA ext_authz via `AuthorizationPolicy` CUSTOM action |
| Rate limiting | Envoy local rate limit `EnvoyFilter` |
| mTLS | Istio `PeerAuthentication` STRICT |

**Benefit:** One less service to build, maintain, and scale. All policy is in declarative YAML and Rego — reviewable, versionable, testable without code changes.

---

## Language Choice Rationale

| Service | Language | Primary Reason |
|---|---|---|
| User Service | Go | JWT crypto performance, small distroless binary, strong concurrency for auth path |
| Notification Service | Go | Efficient concurrent RabbitMQ consumption via goroutines |
| Asset Service | Python | Async FastAPI, SQLAlchemy 2.x async; Phase 7 embedding pipeline with sentence-transformers |
| Incident Service | Python | Same as Asset; rich SLA/time logic readable in Python |
| AI Service | Python | Entire AI/ML ecosystem (LangChain, scikit-learn, sentence-transformers, pgvector) |
| Frontend | TypeScript/Next.js | Type safety, App Router SSR for fast initial load, large ecosystem |

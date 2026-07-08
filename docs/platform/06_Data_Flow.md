# Data Flow — ITSM Cloud-Native Demo App

## 1. Overview

This document describes how data moves through the system from the client request
all the way to PostgreSQL persistence, Redis cache, RabbitMQ event bus, and back.
It covers:

- **Read path** (GET requests)
- **Write path** (POST/PUT/DELETE)
- **Async notification path** (RabbitMQ → Notification Service)
- **Schema-per-tenant routing** (how services target the correct PostgreSQL schema)
- **OTel trace propagation** across all hops

---

## 2. Schema-per-Tenant: How It Works

Every tenant has an isolated PostgreSQL schema named after its slug (e.g. `tenant_a`,
`tenant_b`). All tables (`users`, `assets`, `incidents`, `incident_events`,
`asset_embeddings`, `incident_ai_analysis`) live inside that schema.

```
public schema
  └── tenants (registry)              ← single shared table

tenant_a schema
  ├── users
  ├── assets
  ├── incidents
  ├── incident_events
  ├── asset_embeddings  (Phase 7 stub)
  └── incident_ai_analysis (Phase 7 stub)

tenant_b schema  (identical structure, fully isolated)
tenant_c schema  (identical structure, fully isolated)
```

**Connection-level schema selection:** Every database connection opened by an application
service sets `search_path` to the tenant's schema immediately after acquiring the
connection from the pool:

```sql
SET search_path TO tenant_a, public;
```

This means:
1. All unqualified table references resolve to `tenant_a.*` first.
2. `public.*` functions (e.g., `gen_random_uuid()`, `set_updated_at()`) remain accessible.
3. A query from tenant_a **can never see** tenant_b rows by accident — wrong schema = table not found error.

**How does a service know which tenant?** Istio injects the claim from the validated
JWT into the `X-Tenant-ID` HTTP header via `outputClaimToHeaders`. Services read this
header, never re-validate the JWT. The header value is the tenant slug used to set
`search_path`.

---

## 3. Read Path (GET /incidents)

```
Client Browser / API Client
    │
    │  HTTPS  (TLS terminated at Istio IngressGateway)
    ▼
┌─────────────────────────────────────────────────────────┐
│  Istio IngressGateway  (istio-system namespace)         │
│  1. TLS termination                                     │
│  2. RequestAuthentication: validate JWT via JWKS        │
│  3. AuthorizationPolicy ALLOW: check tenant claim       │
│  4. AuthorizationPolicy CUSTOM (OPA ext_authz):         │
│     forward to OPA gRPC, OPA checks role vs path        │
│  5. VirtualService: route to itsm-incident-service      │
│  6. outputClaimToHeaders: X-Tenant-ID, X-User-Role      │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTP/2 + mTLS (Envoy-to-Envoy)
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Incident Service  (Python / FastAPI)                   │
│  itsm-dev namespace — Envoy sidecar                     │
│                                                         │
│  a. Read X-Tenant-ID header → slug = "tenant_a"        │
│  b. Check Redis cache key:                              │
│       itsm:tenant_a:incidents:list:<query_hash>         │
│     HIT → return cached JSON response                   │
│     MISS → continue to step c                          │
│  c. Acquire DB connection from pool                     │
│     SET search_path TO tenant_a, public                 │
│  d. SELECT * FROM incidents WHERE ...                   │
│  e. Write result to Redis with TTL = 60s                │
│  f. Emit OTel spans:                                    │
│       itsm.incident.list (manual business span)         │
│       db.query (auto via otelsql)                       │
│       cache.miss / cache.hit (manual span event)        │
│  g. Return JSON 200                                     │
└──────────────────────────┬──────────────────────────────┘
                           │  Response flows back through Envoy → Gateway → Client
```

**OTel trace context** is propagated as W3C `traceparent` header through all hops.
The Istio Envoy proxy automatically propagates this header between services.

---

## 4. Write Path (POST /incidents)

```
Client
    │  POST /incidents  { title, priority, description }
    │  Authorization: Bearer <JWT>
    ▼
Istio IngressGateway
    │  (same AuthN/AuthZ steps as read path)
    │  OPA checks: role=agent or admin → ALLOW
    │  role=viewer → DENY 403
    ▼
Incident Service
    │
    ├── a. Validate request body (Pydantic)
    ├── b. Read X-Tenant-ID, X-User-ID from Istio-injected headers
    ├── c. SET search_path TO tenant_a, public
    ├── d. INSERT INTO incidents (...) RETURNING id
    ├── e. INSERT INTO incident_events (event_type='comment' or first event)
    ├── f. Invalidate Redis cache keys for this tenant's incident list
    │       DEL itsm:tenant_a:incidents:list:*
    ├── g. Publish event to RabbitMQ exchange: itsm.incidents
    │       routing_key: incident.created
    │       payload: { incident_id, tenant_id, priority, assigned_to, ... }
    │       headers: { traceparent: <W3C trace context> }   ← OTel propagation
    ├── h. Emit OTel spans:
    │       itsm.incident.create (manual business span)
    │         span.set_attribute("incident.priority", "P1")
    │         span.set_attribute("tenant.id", "tenant_a")
    │         span.add_event("cache_invalidated")
    │         span.add_event("event_published")
    └── i. Return JSON 201 { id, ... }
```

---

## 5. Async Notification Path (RabbitMQ → Notification Service)

```
RabbitMQ Exchange: itsm.incidents
    │  routing_key: incident.created | incident.updated | incident.resolved
    │  message headers contain W3C traceparent
    ▼
Notification Service  (Go / Chi)
    │
    ├── a. Extract traceparent from AMQP headers → continue OTel trace
    ├── b. Parse message payload: { incident_id, tenant_id, priority, assigned_to }
    ├── c. Look up assigned user email:
    │       GET http://user-service.itsm-dev/internal/users/{assigned_to}
    │       (internal call, mTLS via Envoy sidecar, no JWT required)
    ├── d. Build notification:
    │       P1/P2: immediate email (SMTP or SendGrid — configured via env)
    │       P3/P4: batched digest (future Phase 8)
    ├── e. Emit OTel span: itsm.notification.send
    │       span.set_attribute("notification.channel", "email")
    │       span.set_attribute("incident.priority", priority)
    └── f. ACK message to RabbitMQ
```

**Why AMQP headers for trace context?**
W3C TraceContext defines `traceparent` for HTTP; for AMQP the convention is to store
the same `traceparent` string in message headers. OpenTelemetry SDKs for Go and Python
both have built-in AMQP propagators for this.

---

## 6. Redis Cache Strategy

| Key Pattern | TTL | Invalidated By |
|---|---|---|
| `itsm:{tenant}:incidents:list:{hash}` | 60s | POST/PUT/DELETE /incidents |
| `itsm:{tenant}:assets:list:{hash}` | 120s | POST/PUT/DELETE /assets |
| `itsm:{tenant}:users:{id}` | 300s | PUT /users/{id} |
| `itsm:{tenant}:dashboard:summary` | 30s | Any write to incidents or assets |

**Key prefix rule:** Every key is prefixed with the tenant slug. This means a Redis
FLUSHDB would clear all tenants — never do that in production. Per-tenant flush uses
`SCAN` + `DEL` with the prefix pattern.

**Cache-aside pattern:** Services always check Redis first. On MISS, load from
PostgreSQL and write-back to Redis. On write, invalidate related keys immediately
(delete, not update) to avoid stale reads.

---

## 7. Migration Execution Flow

```
kubectl apply → postgres-statefulset.yaml
    │
    ├── Pod: postgres container starts → PGDATA ready
    └── Pod: migrate container starts (sidecar)
            │
            ├── wait: pg_isready loop
            ├── golang-migrate: migrate -path /migrations -database ... up
            │     000001_init_schema.up.sql       → pgcrypto, pg_trgm, public.tenants
            │     000002_tenant_schema_function.up.sql → create_tenant_schema()
            │     000003_tenant_indexes.up.sql    → trgm indexes (seed schemas)
            │     000004_updated_at_triggers.up.sql → triggers + helper functions
            │     000005_phase7_ai_stubs.up.sql   → AI stub tables
            └── exec sleep infinity  (keeps pod Running)

After migrations:
    bash scripts/create-tenants.sh  (ENV=dev SEED=true)
            │
            ├── SELECT create_tenant_schema('tenant_a')  → schema + tables + indexes
            ├── SELECT attach_updated_at_trigger(...)     → triggers
            ├── SELECT add_ai_stubs('tenant_a')           → AI stub tables
            └── psql -f database/seeds/seed-tenant-a.sql → INSERT test data
```

---

## 8. Service-to-Database Connection Model

Each application service maintains its own connection pool (no shared proxy in Phase 2).

| Service | Library | Pool Size | search_path set |
|---|---|---|---|
| User Service (Go) | `pgx/v5` + `pgxpool` | 10 | Per request via `conn.Exec("SET search_path TO ...")` |
| Asset Service (Python) | SQLAlchemy 2.x async + `asyncpg` | 10 | Per session via `event.listen(engine, "connect", ...)` |
| Incident Service (Python) | SQLAlchemy 2.x async + `asyncpg` | 10 | Per session |
| Notification Service (Go) | `pgx/v5` + `pgxpool` | 5 | Per request |

**Connection string** (all services — sourced from `DATABASE_URL` env var):
```
postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable
```

> PostgreSQL runs as a **standalone external service** on a dedicated machine, not inside K8s.
> All services read the `DATABASE_URL` environment variable (injected via K8s Secret or `.env`).
> Replace `<machine-ip>` with the actual host IP when deploying.

The `search_path` is set **after** the connection is established, not in the DSN.
This is because the tenant slug is determined at request time from the Istio-injected
header, not at connection pool creation time.

---

## 9. OTel Span Naming Convention

```
itsm.<service>.<operation>

Examples:
  itsm.incident.list
  itsm.incident.create
  itsm.incident.resolve
  itsm.asset.create
  itsm.asset.search
  itsm.user.login
  itsm.notification.send
  itsm.ai.triage           (Phase 7)
  itsm.ai.embed_asset      (Phase 7)
```

**Custom metrics** (Prometheus via OTel SDK):

```
itsm_incidents_created_total{tenant, priority}       counter
itsm_incidents_resolved_duration_seconds{priority}   histogram
itsm_assets_active_count{tenant, asset_type}         gauge
itsm_cache_hits_total{tenant, resource}              counter
itsm_cache_misses_total{tenant, resource}            counter
```

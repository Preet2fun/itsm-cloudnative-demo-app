# CLAUDE.md — ITSM CloudNative Demo App

This file is loaded automatically by Claude Code at the start of every session.
Every rule here is non-negotiable. Read it fully before writing a single line of code.

---

## 1. MCP Servers — Use Them, Always

Six MCP servers are configured in `.claude/settings.json`. **You must use the right
server for every task instead of guessing or hallucinating values.** This ensures
every manifest, query, and config reflects the live state of the system.

| MCP Server | When to use it — mandatory scenarios |
|---|---|
| **filesystem** | Read any project file before editing. Never assume file content. |
| **postgres** | Before writing ANY SQL or migration: inspect live schema, check table structure, verify column types, test queries against real data. |
| **kubernetes** | Before writing ANY K8s manifest: check API versions, inspect live cluster resources, validate existing deployments, read pod logs. |
| **docker** | Before writing Dockerfiles or compose-equivalent configs: check base image tags, inspect running containers, validate build output. |
| **fetch** | Before writing library code: fetch official docs for the exact library version in use (Chi v5, FastAPI 0.111+, SQLAlchemy 2.x, golang-migrate v4, OTel SDKs). Never rely on training data alone for API details. |
| **prometheus** | Before writing PromQL queries or Grafana dashboards: validate metric names and labels against live Prometheus. |

### Concrete MCP usage rules

- **PostgreSQL syntax / migrations:** Use the postgres MCP to inspect the live schema
  before writing `.up.sql` files. Verify extensions, existing tables, column types,
  and index names. Never write `CREATE TABLE` without knowing what already exists.

- **K8s manifests:** Use the kubernetes MCP to check `kubectl api-resources`,
  confirm CRD availability (e.g. Istio `VirtualService`, `RequestAuthentication`,
  OPA `AuthorizationPolicy`), and inspect current cluster state before writing YAML.
  Always verify `apiVersion` against the live cluster — never hardcode versions
  from memory.

- **Library APIs:** Use the fetch MCP to read official documentation when writing
  code that calls external libraries. Examples:
  - Chi v5 router — `https://pkg.go.dev/github.com/go-chi/chi/v5`
  - FastAPI — `https://fastapi.tiangolo.com`
  - SQLAlchemy 2.x async — `https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html`
  - golang-migrate — `https://github.com/golang-migrate/migrate`
  - OTel Go SDK — `https://pkg.go.dev/go.opentelemetry.io/otel`
  - OTel Python SDK — `https://opentelemetry-python.readthedocs.io`
  - Istio APIs — `https://istio.io/latest/docs/reference/config/`

---

## 2. Phase Rules — Non-Negotiable

- **One phase at a time.** Complete all deliverables for the current phase, then
  stop. Do NOT start the next phase until the user explicitly confirms the current
  phase is validated on the K8s cluster.
- **Never assume a prior phase is done.** If you are unsure what has been built,
  read the files — use the filesystem MCP.
- **After every phase:** update `docs/CHANGELOG.md` and the phase status tracker
  in `SYSTEM_PROMPT.md`.

### Phase status (update as each is approved)

#### Backend & Infrastructure Phases
| Phase | Status |
|---|---|
| Phase 1 — Repo Scaffold | ✅ Complete |
| Phase 2 — Database Layer | ✅ Complete |
| Phase 3 — User Service (Go) | ✅ Complete |
| Phase 4 — Asset & Incident Services (Python) | ✅ Complete |
| Phase 5 — Helm Charts + K8s Manifests + Dockerfiles | ✅ Complete |
| Phase 6 — Istio + OPA | 🔲 In Progress |
| Phase 7 — AI Features | 🔲 Pending |
| Phase 8 — Observability | 🔲 Pending |
| Phase 9 — CI/CD & GitOps | 🔲 Pending |

#### Synap UI Sprints (Vite + React 18 + TypeScript)
Frontend is built from the design prototype in `design_handoff_synap/reference/`. Each sprint = one screen, pixel-matched to the prototype.
| Sprint | Screen | Status |
|---|---|---|
| Sprint 0 | Foundation — scaffold + tokens + primitives | 🔲 Not Started |
| Sprint 1 | Login — email/password + SSO + MFA | 🔲 Not Started |
| Sprint 2 | App Shell — sidebar + topbar + routing + theme | 🔲 Not Started |
| Sprint 3 | Asset Module — list + detail + CRUD | 🔲 Not Started |
| Sprint 4 | Incident Module — list + detail + lifecycle | 🔲 Not Started |
| Sprint 5 | Ops Dashboard | 🔲 Not Started |
| Sprint 6 | AIOps Event Console | 🔲 Not Started |
| Sprint 7 | End-user Portal | 🔲 Not Started |
| Sprint 8 | CMDB + Service Map + Cloud | 🔲 Not Started |
| Sprint 9 | Monitoring + KB + Analytics + Admin | 🔲 Not Started |
| Sprint 10 | Global Copilot + ⌘K palette | 🔲 Not Started |
| Sprint 11 | Real API wiring | 🔲 Not Started |

---

## 3. Architecture Decisions — Must Be Respected

### No dedicated API Gateway service
Istio IngressGateway handles everything: JWT validation, tenant routing, header
injection, RBAC via OPA, rate limiting, mTLS. Never suggest or create a Go API
Gateway service.

### No Docker Compose
All deployments go directly to the kubeadm K8s cluster. There is no `docker-compose.yml`
anywhere in this repo.

### PostgreSQL is an external standalone service
PostgreSQL 16 runs on a **separate machine outside K8s**. It is NOT deployed as a
K8s StatefulSet. Never create K8s manifests for PostgreSQL (StatefulSet, PVC,
StorageClass for DB). Application services connect using `DATABASE_URL` env var.

### DATABASE_URL is the single connection variable
```
DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable
```
All services, scripts, and `golang-migrate` commands use this one variable.
Never split it into DB_HOST, DB_PORT, DB_USER etc. — that was the old approach.

### Services NEVER re-validate the JWT
Istio validates the JWT and injects two headers for every authenticated request:
- `X-Tenant-ID` — from the `tenant_id` JWT claim
- `X-User-Role` — from the `role` JWT claim

Services read these headers directly. They never parse or verify the JWT themselves.
There is no JWT library call inside service handlers (only inside User Service for
token issuance).

### Two-layer AuthZ model
1. **Istio AuthorizationPolicy (ALLOW/DENY)** — tenant isolation at the mesh level
2. **OPA ext_authz (CUSTOM action)** — RBAC: role + HTTP method + path rules via Rego

Both layers must be present in Phase 6. Services themselves contain zero authorization
logic.

### Schema-per-tenant PostgreSQL isolation
- Each tenant has its own schema: `tenant_a`, `tenant_b`, `tenant_c`
- `search_path` is set **per connection** at request time (not in the DSN)
- The tenant slug comes from the Istio-injected `X-Tenant-ID` header
- `public` schema holds only `public.tenants` (registry) and shared functions

### ENV=dev|qa everywhere
Every script, Helm chart, K8s manifest, and ArgoCD Application must accept
`ENV=dev` (default) or `ENV=qa`. Switching environments changes only this variable —
no manual YAML edits. Default is always `dev`.

---

## 4. Hardware Constraints — Enforce in All Manifests

Kubeadm cluster: 3 nodes, 16 GB total RAM.
- Control plane: 4 GB
- Worker 1: ~6 GB
- Worker 2: ~6 GB
- Usable workload RAM: ~10–11 GB

**HPA: min=1, max=2 replicas for all stateless services. Never set max=3 or higher.**
CPU threshold for HPA: 70%.

### Resource limits (use these in all Helm templates and K8s manifests)

| Service | CPU Request | CPU Limit | Mem Request | Mem Limit |
|---|---|---|---|---|
| Frontend (Next.js) | 50m | 200m | 128Mi | 256Mi |
| User Service (Go) | 100m | 300m | 128Mi | 256Mi |
| Asset Service (Python) | 100m | 300m | 128Mi | 256Mi |
| Incident Service (Python) | 100m | 300m | 128Mi | 256Mi |
| Notification Service (Go) | 50m | 200m | 64Mi | 128Mi |
| Redis | 50m | 200m | 64Mi | 256Mi |
| RabbitMQ | 100m | 300m | 256Mi | 512Mi |
| OTel Collector | 100m | 300m | 128Mi | 256Mi |
| Prometheus | 150m | 400m | 256Mi | 512Mi |
| Loki | 100m | 300m | 128Mi | 256Mi |
| Jaeger (all-in-one) | 100m | 300m | 128Mi | 256Mi |
| Grafana | 100m | 300m | 128Mi | 256Mi |
| ArgoCD (total) | 300m | 800m | 512Mi | 1Gi |
| Istio (sidecars + pilot) | 200m | 500m | 256Mi | 512Mi |
| AI Service (Python) | 100m | 400m | 256Mi | 512Mi |

---

## 5. OTel Instrumentation — Required from Day One

Every service must have **both** auto-instrumentation and manual business instrumentation.

### Span naming convention
```
itsm.<service>.<operation>

Examples:
  itsm.incident.create
  itsm.incident.list
  itsm.asset.search
  itsm.user.login
  itsm.notification.send
  itsm.ai.triage         (Phase 7)
```

### Required span attributes on every business span
```python
span.set_attribute("tenant.id", tenant_id)   # from X-Tenant-ID header
span.set_attribute("user.role", role)         # from X-User-Role header
```

### Custom metrics (Prometheus via OTel SDK)
```
itsm_incidents_created_total{tenant, priority}       counter
itsm_incidents_resolved_duration_seconds{priority}   histogram
itsm_assets_active_count{tenant, asset_type}         gauge
itsm_cache_hits_total{tenant, resource}              counter
itsm_cache_misses_total{tenant, resource}            counter
```

### W3C TraceContext propagation
- HTTP: `traceparent` header — Istio Envoy propagates automatically
- RabbitMQ AMQP: store `traceparent` string in AMQP message headers

---

## 6. Technology Stack Quick Reference

### Languages & frameworks
| Service | Language | Framework | Key libs |
|---|---|---|---|
| User Service | Go 1.22+ | Chi v5 | `pgx/v5`, `golang-jwt/jwt v5`, `otelchi` |
| Notification Service | Go 1.22+ | Chi v5 | `pgx/v5`, amqp091-go |
| Asset Service | Python 3.12+ | FastAPI 0.111+ | SQLAlchemy 2.x async, asyncpg |
| Incident Service | Python 3.12+ | FastAPI 0.111+ | SQLAlchemy 2.x async, asyncpg, aio-pika |
| AI Service | Python 3.12+ | FastAPI 0.111+ | pgvector, LLM provider TBD (Phase 7) |
| Frontend (Synap UI) | TypeScript | Vite + React 18 | React Router, TanStack Query, Zustand, CSS Modules/OKLCH tokens |

### JWT (HS256 — built-in, no external identity provider)
Claims: `sub`, `tenant_id`, `role`, `email`, `exp`, `iat`, `jti`
Issued by: User Service
Validated by: Istio RequestAuthentication via JWKS endpoint on User Service

### Key infrastructure
- **Kubernetes:** kubeadm 1.29+, already installed, 3 nodes
- **Service mesh:** Istio (demo profile)
- **Policy engine:** OPA 0.65+ with Envoy plugin, port 9191 gRPC
- **Cache:** Redis 7.x (external, same machine as Postgres or separate)
- **Queue:** RabbitMQ 3.13.x (external or in K8s)
- **GitOps:** ArgoCD 2.11+
- **Helm:** 3.15+
- **DB migrations:** golang-migrate v4 (naming: `000001_name.up.sql` / `.down.sql`)

---

## 7. Code Quality Rules

- **Python:** PEP8, `ruff` for linting, `black` for formatting
- **Go:** `gofmt`, `golangci-lint`
- **TypeScript:** ESLint + Prettier
- **Commits:** Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `infra:`
- **No new dependencies** without asking the user first
- **No Docker Compose** — not in this project at all

---

## 8. Redis Cache Key Convention

```
itsm:{tenant_slug}:{resource}:{operation}:{hash}

Examples:
  itsm:tenant_a:incidents:list:abc123
  itsm:tenant_a:users:u1000001
  itsm:tenant_b:assets:list:def456
```

Never use unprefixed keys. Never FLUSHDB (affects all tenants).

---

## 9. Deployment Guide Reminder

After every phase, a step-by-step deployment guide must be written or updated in:
```
docs/06_Phase_Deployment_Guides/Phase_0X_<Name>.md
```

The guide must include: prerequisites, ordered steps, expected output, verification
queries/commands, rollback instructions, troubleshooting, and an acceptance checklist.

---

## 10. Synap UI Development Process — Non-Negotiable

The frontend is built sprint-by-sprint from a prototype design. Follow these rules every session.

### Design source of truth
`design_handoff_synap/reference/` is always the pixel-perfect spec. **Before implementing any UI, read the corresponding `*.jsx` file in that folder.** Do not invent UI — recreate the prototype exactly and re-architect underneath.

### Frontend stack (Vite + React 18 + TypeScript)
- **Build tool:** Vite
- **Routing:** React Router (prototype's `view` state → real routes)
- **Styling:** CSS variables with OKLCH tokens ported from `styles.css`; `[data-theme="dark"]` overrides; CSS Modules for components. Never hardcode colors.
- **Server data:** TanStack Query
- **Cross-cutting UI state:** Zustand (copilot open, theme, persona)
- **Icons:** Port `icons.jsx` to a typed `<Icon>` component, or use lucide-react
- **Do NOT port** `synap-tweaks.jsx` / `tweaks-panel.jsx` — prototype-only; build real Settings instead

### API calls
- Sprints 0–10 use **typed mock data** (port of `reference/data.jsx`) — no real backend calls
- Every faked AI call (`setTimeout` in prototype) gets a `// TODO: real API` comment marking the integration seam
- Sprint 11 replaces mock layer with TanStack Query + real backend endpoints
- In K8s: use **relative API paths** (`/api/v1/*`) — Istio IngressGateway routes to backends. No hardcoded host URLs.

### K8s deployment (nginx:alpine)
- Vite builds to `dist/` — served by `nginx:alpine` (not Next.js with Node.js runtime)
- Frontend image: 64Mi request / 128Mi limit (fits the 10–11 GB workload budget)
- Dockerfile: multi-stage `node:20-alpine` build → `nginx:alpine` serve
- `nginx.conf` must include: `try_files $uri $uri/ /index.html` for SPA routing and `location /api { proxy_pass ... }` is NOT needed (Istio handles routing at the ingress level)

### One sprint at a time
Build exactly the screen in the current sprint. Stop and verify against the prototype in a browser before moving to the next sprint. Never implement screens from future sprints speculatively.

### Do NOT port tweaks panel
`synap-tweaks.jsx` and `tweaks-panel.jsx` are prototype-only demo theming. Do not port them. Real theme settings go in the Admin screen (Sprint 9).

---

## 12. What Not to Do

- Do NOT create a dedicated API Gateway service
- Do NOT create K8s StatefulSet or PVC for PostgreSQL
- Do NOT create `docker-compose.yml`
- Do NOT set HPA max replicas > 2
- Do NOT validate JWT inside application service handlers
- Do NOT set `search_path` in the DSN — set it per connection at request time
- Do NOT split `DATABASE_URL` into separate host/port/user/pass variables
- Do NOT add dependencies not in the tech stack without asking
- Do NOT proceed to the next phase without explicit user approval
- Do NOT write K8s `apiVersion` values from memory — check with kubernetes MCP first
- Do NOT write SQL against assumed schema — check with postgres MCP first

# CLAUDE.md — ITSM CloudNative Demo App

This file is loaded automatically by Claude Code at the start of every session.
Every rule here is non-negotiable. Read it fully before writing a single line of code.

This repo also contains two directory-scoped `CLAUDE.md` files that load
automatically alongside this one when you're working inside their trees:
`ai-engine/CLAUDE.md` and `platform-app/design_handoff_synap/CLAUDE.md`. Where
either references "root `CLAUDE.md` §N", that section number in **this** file
must keep meaning the same thing — §3 (Architecture Decisions) and §5 (OTel
Instrumentation) are load-bearing for `ai-engine/CLAUDE.md`'s cross-references.
Don't renumber them without updating that file too.

---

## 1. Vision & Architecture

This is a demo of an **AI-native observability/ITSM/security platform**,
proven out against a **real multi-tenant SaaS app** instead of synthetic data.
Three top-level projects, one purpose:

- **`customer-app/`** — a multi-tenant **restaurant/food-delivery SaaS app**
  (restaurants, menus, orders, delivery, payment). Deliberately polyglot
  (Go/Python/Java) and deliberately kept simple. Its only job is to generate
  real, tenant-scoped production-like activity — it is **the thing being
  observed**, not the interesting part of this repo.
- **`platform-app/`** — the platform. Started as a single-tenant ITSM demo;
  reframed as **the thing doing the observing**. Owns identity for both apps
  (its `user-service` is the *only* identity engine in the system). Its
  Incident module is becoming "incidents an AI agent investigated," not
  manually-filed tickets; its Asset service is becoming a topology-graph
  source.
- **`ai-engine/`** — the agentic AI layer, and the actual point of this repo.
  Consumes customer-app's tenant-tagged telemetry (flowing through
  platform-app's observability stack) to do agentic investigation — e.g. RCA
  — and writes what it learns back to memory for future retrieval. Governed
  by its own `ai-engine/CLAUDE.md`: 3 use-case tracks (SRE, ITSM, Security),
  LangGraph + Langfuse only, CI-gated online+offline evals.

**Never assume what's built.** This file states current architecture and
non-negotiable rules; it does not track task-by-task status — see §11. Design
history and rationale live in `docs/superpowers/specs/` (chronological,
later specs supersede earlier ones on overlapping topics) and
`docs/superpowers/plans/`. `INFRA-INVENTORY.md` (git-ignored, local) has the
actual measured cluster/DB numbers — trust it over any number written here if
they ever drift apart again.

---

## 2. MCP Servers — Use Them, Always

Six MCP servers are configured in `.claude/settings.json`. **You must use the right
server for every task instead of guessing or hallucinating values.** This ensures
every manifest, query, and config reflects the live state of the system.

| MCP Server | When to use it — mandatory scenarios |
|---|---|
| **filesystem** | Read any project file before editing. Never assume file content. |
| **postgres** | Before writing ANY SQL or migration: inspect live schema, check table structure, verify column types, test queries against real data. Check both tenant registries (`public.tenants` legacy, `public.customer_tenants` canonical) and `public.users` before touching identity/tenancy code. |
| **kubernetes** | Before writing ANY K8s manifest: check API versions, inspect live cluster resources, validate existing deployments, read pod logs. |
| **docker** | Before writing Dockerfiles or compose-equivalent configs: check base image tags, inspect running containers, validate build output. |
| **fetch** | Before writing library code: fetch official docs for the exact library version in use (Chi v5, FastAPI 0.111+, SQLAlchemy 2.x, Spring Boot, golang-migrate v4, OTel SDKs). Never rely on training data alone for API details. |
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
  - Spring Boot — `https://docs.spring.io/spring-boot/`
  - golang-migrate — `https://github.com/golang-migrate/migrate`
  - OTel Go SDK — `https://pkg.go.dev/go.opentelemetry.io/otel`
  - OTel Python SDK — `https://opentelemetry-python.readthedocs.io`
  - Istio APIs — `https://istio.io/latest/docs/reference/config/`

---

## 3. Architecture Decisions — Must Be Respected

### No dedicated API Gateway service
Istio IngressGateway handles everything: JWT validation, tenant routing, header
injection, RBAC via OPA, rate limiting, mTLS — for **both** apps. Never suggest
or create a Go API Gateway service.

### No Docker Compose
All deployments go directly to the kubeadm K8s cluster. There is no `docker-compose.yml`
anywhere in this repo.

### PostgreSQL is one external standalone instance, shared by both apps
PostgreSQL **17.5** runs on a **separate machine outside K8s**
(`172.16.12.226:5432`, db/user/pass all `itsm`). It is NOT deployed as a K8s
StatefulSet. Never create K8s manifests for PostgreSQL (StatefulSet, PVC,
StorageClass for DB). Both `platform-app` and `customer-app` connect to the
**same instance** using `DATABASE_URL`.

### DATABASE_URL is the single connection variable
```
DATABASE_URL=postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable
```
All services, scripts, and migration commands use this one variable. Never
split it into DB_HOST, DB_PORT, DB_USER etc. The repo's `.env` has been known
to drift to a stale IP — verify against this file, not the checked-in `.env`,
if they disagree.

### Services NEVER re-validate the JWT
Istio validates the JWT and injects two headers for every authenticated request:
- `X-Tenant-ID` — from the `tenant_id` JWT claim (**absent, not empty, for
  platform staff** — see Identity model below; an absent header is a valid
  "no tenant" state, not an error)
- `X-User-Role` — from the `role` JWT claim

Services read these headers directly. They never parse or verify the JWT
themselves. There is no JWT library call inside service handlers (only inside
`user-service` for token issuance).

### Two-layer AuthZ model
1. **Istio AuthorizationPolicy (ALLOW/DENY)** — tenant isolation at the mesh level
2. **OPA ext_authz (CUSTOM action)** — RBAC: role + HTTP method + path rules via Rego

Both layers apply to both apps. Services themselves contain zero authorization logic.

### Identity model — one engine, one users table, for both apps
`customer-app` has **no identity engine of its own**. All login goes through
platform-app's `user-service`, against a single shared `public.users` table
(migration `000006_create_shared_users.up.sql`, per
`docs/superpowers/specs/2026-08-27-identity-tenancy-consolidation-design.md`):

```sql
public.users(
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT NOT NULL CHECK (role IN (
                    'admin','agent','viewer',
                    'platform_admin','platform_analyst'
                )),
  tenant_id     TEXT NULL,  -- NULL = platform staff; else = customer_tenants.slug
  is_active     BOOL NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

- One row population, two kinds of user: `customer-app`'s tenant-scoped end
  users (`tenant_id` = a `customer_tenants.slug`) and `platform-app`'s own
  cross-tenant staff (`tenant_id = NULL`, roles `platform_admin` /
  `platform_analyst`).
- **Login is email + password only.** No "workspace/tenant slug" field,
  anywhere, in either app's UI. Do not reintroduce one.
- `issueToken` reads `tenant_id` off the authenticated user row; if `NULL`,
  the claim is **omitted from the JWT entirely** (not set empty). Istio's
  `outputClaimToHeaders` then simply doesn't inject `X-Tenant-ID` — this
  requires **zero Istio config changes**.
- Cross-tenant data browsing by platform staff is explicitly **not** covered
  by this model yet (Istio can't inject a header from a claim that doesn't
  exist) — it needs its own mechanism, deferred to the future platform-app UI
  work. Don't invent one ad hoc.

### Business-data tenancy — schema-per-tenant, separate from identity
Two parallel schema-per-tenant setups, on the same Postgres instance, **not**
the same thing as the identity model above:

- **`platform-app`** (legacy): `tenant_a` / `tenant_b` / `tenant_c` schemas,
  registry `public.tenants`. **Retired for identity/login purposes** — nothing
  reads this for auth anymore — but its data (`assets`, `incidents`,
  `incident_events`) is left physically untouched. Where these tenants end up
  relative to `customer_a/b/c` is an **open, undecided question** — don't
  silently migrate or drop this data.
- **`customer-app`** (canonical going forward): `customer_a` / `customer_b` /
  `customer_c` schemas, registry `public.customer_tenants`, created via
  `create_customer_tenant_schema(slug)`. Tables: `restaurants` (owned by
  catalog-service), `menu_items` FK→restaurants (catalog-service), `orders`
  FK→restaurants (order-service), `deliveries` FK→orders (delivery-service),
  `payments` FK→orders (payment-service).
- `search_path` is set **per connection** at request time (not in the DSN),
  from the tenant slug resolved server-side — never from a client-supplied field.

### ENV=dev|qa everywhere
Every script, Helm chart, K8s manifest, and ArgoCD Application must accept
`ENV=dev` (default) or `ENV=qa`. Switching environments changes only this variable —
no manual YAML edits. Default is always `dev`.

---

## 4. Hardware Constraints — Enforce in All Manifests

Kubeadm cluster: 3 nodes, **4 vCPU / 3.8 GiB each → 12 vCPU / 11.4 GiB total.**
**Memory is the binding constraint, not CPU** (12 vCPU available, well under 1
requested today). Real, measured headroom is **~5 GiB free on the two
workers** — plan against that number, not a bigger one.

**HPA: min=1, max=2 replicas for all stateless services, in both apps. Never
set max=3 or higher.** CPU threshold for HPA: 70%.

### Resource limits (use these in all Helm templates and K8s manifests)

**Platform App:**

| Service | CPU Request | CPU Limit | Mem Request | Mem Limit |
|---|---|---|---|---|
| Frontend | 50m | 200m | 128Mi | 256Mi |
| User Service (Go) | 100m | 300m | 128Mi | 256Mi |
| Asset Service (Python) | 100m | 300m | 128Mi | 256Mi |
| Incident Service (Python) | 100m | 300m | 128Mi | 256Mi |
| Notification Service (Go) | 50m | 200m | 64Mi | 128Mi |
| AI Service (Python) | 100m | 400m | 256Mi | 512Mi |
| Redis | 50m | 200m | 64Mi | 256Mi |
| RabbitMQ | 100m | 300m | 256Mi | 512Mi |
| OTel Collector | 100m | 300m | 128Mi | 256Mi |
| Prometheus | 150m | 400m | 256Mi | 512Mi |
| Loki | 100m | 300m | 128Mi | 256Mi |
| Jaeger (all-in-one) | 100m | 300m | 128Mi | 256Mi |
| Grafana | 100m | 300m | 128Mi | 256Mi |
| ArgoCD (total) | 300m | 800m | 512Mi | 1Gi |
| Istio (pilot + sidecars) | 200m | 500m | 256Mi | 512Mi |

**Customer App** (from `customer-app/infra/helm/customer-app/values.yaml`):

| Service | CPU Request | CPU Limit | Mem Request | Mem Limit |
|---|---|---|---|---|
| order-service (Go) | 100m | 300m | 128Mi | 256Mi |
| catalog-service (Python) | 100m | 300m | 128Mi | 256Mi |
| delivery-service (Java) | 100m | 300m | 256Mi | 512Mi |
| payment-service (Java) | 100m | 300m | 256Mi | 512Mi |
| Redis | 50m | 200m | 64Mi | 256Mi |
| Istio sidecars (×4) | ~100m each | — | ~128Mi each | ~128Mi each |

**Known open capacity risk:** Java services run 2× the memory footprint of
the Go/Python ones. Customer-app at HPA max (4 services × 2 replicas) plus
its sidecars needs ~4 GiB at the limit ceiling — that does **not** comfortably
fit alongside a platform-app burst *and* the not-yet-deployed observability
stack, on ~5 GiB of real headroom. Until resolved (more node RAM, lower the
Java limits, or keep customer-app at HPA min=1 in dev), treat this as a live
constraint when sizing anything new — don't assume the numbers in this table
alone prove capacity; check `INFRA-INVENTORY.md` for the current measured
picture first.

---

## 5. OTel Instrumentation — Required from Day One

Every service must have **both** auto-instrumentation and manual business
instrumentation. **The two apps use different span-naming and metric
namespaces — do not cross them.**

### Span naming convention

**Platform App** (including `ai-service` — see `ai-engine/CLAUDE.md` §3 for
its `itsm.ai.<track>.<operation>` extension):
```
itsm.<service>.<operation>

Examples:
  itsm.incident.create
  itsm.incident.list
  itsm.asset.search
  itsm.user.login
  itsm.notification.send
  itsm.user.internal_get
```

**Customer App** (confirmed in code — `catalog-service/app/router.py`,
`order-service/internal/handlers/orders.go`):
```
customer.<service>.<operation>

Examples:
  customer.catalog.list_restaurants
  customer.catalog.create_restaurant
  customer.catalog.create_menu_item
  customer.catalog.cache_lookup
  customer.order.create
  customer.order.list
  customer.order.get
  customer.order.update_status
```

**Known gap:** `delivery-service` and `payment-service` (Java) currently have
auto-instrumentation only — no manual business spans yet. Adding them is a
roadmap item, not something to silently skip when touching those services.

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
Customer-app metrics follow the same shape under a `customer_` prefix when
they're added — keep the two namespaces as separate as the span names are.

### W3C TraceContext propagation
- HTTP: `traceparent` header — Istio Envoy propagates automatically
- RabbitMQ AMQP: store `traceparent` string in AMQP message headers

---

## 6. Technology Stack Quick Reference

### Languages & frameworks

**Platform App:**
| Service | Language | Framework | Key libs |
|---|---|---|---|
| User Service | Go 1.22+ | Chi v5 | `pgx/v5`, `golang-jwt/jwt v5`, `otelchi` |
| Notification Service | Go 1.22+ | Chi v5 | `pgx/v5`, amqp091-go |
| Asset Service | Python 3.12+ | FastAPI 0.111+ | SQLAlchemy 2.x async, asyncpg |
| Incident Service | Python 3.12+ | FastAPI 0.111+ | SQLAlchemy 2.x async, asyncpg, aio-pika |
| AI Service | Python 3.12+ | FastAPI 0.111+ | pgvector, LLM provider — see `ai-engine/CLAUDE.md` |
| Frontend (Synap UI) | TypeScript | Vite + React 18 | React Router, TanStack Query, Zustand, CSS Modules/OKLCH tokens |

**Customer App:**
| Service | Language | Framework | Key libs |
|---|---|---|---|
| order-service | Go 1.22+ | Chi v5 | `pgx/v5` |
| catalog-service | Python 3.12+ | FastAPI 0.111+ | SQLAlchemy 2.x async, asyncpg |
| delivery-service | Java | Spring Boot | — |
| payment-service | Java | Spring Boot | — |
| Frontend | — | **none yet** | greenfield — no UI exists for customer-app today; stack choice happens as part of that roadmap task, using Claude Design (§10) |

### JWT (RS256 — one issuer for both apps)
Claims: `sub`, `tenant_id` (omitted, not empty, for platform staff), `role`,
`email`, `exp`, `iat`, `jti`
Issued by: `user-service` (signs with RSA-2048 private key; `kid: itsm-rs256-v1`)
Validated by: Istio `RequestAuthentication` via JWKS endpoint on `user-service`
(`/api/v1/.well-known/jwks.json`) — the **only** JWKS endpoint in the system;
`customer-app` does not have its own.

### Key infrastructure
- **Kubernetes:** kubeadm 1.29+, already installed, 3 nodes
- **Service mesh:** Istio (demo profile)
- **Policy engine:** OPA 0.65+ with Envoy plugin, port 9191 gRPC
- **Cache:** Redis 7.x (external, same machine as Postgres or separate) — one instance per app
- **Queue:** RabbitMQ 3.13.x (platform-app only, today)
- **GitOps:** ArgoCD 2.11+
- **Helm:** 3.15+
- **DB migrations:** golang-migrate-style naming (`000001_name.up.sql` /
  `.down.sql`) in `platform-app`; `customer-app` uses its own
  `customer-app/scripts/run-migrations.sh` with a
  `customer_app_schema_migrations` tracking table — same naming convention,
  separate runner

---

## 7. Code Quality Rules

- **Python:** PEP8, `ruff` for linting, `black` for formatting
- **Go:** `gofmt`, `golangci-lint`
- **TypeScript:** ESLint + Prettier
- **Java:** no linter/formatter convention chosen yet — ask the user before
  picking one rather than assuming
- **Commits:** Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `infra:`
- **No new dependencies** without asking the user first
- **No Docker Compose** — not in this project at all

---

## 8. Cache Key Conventions

Two separate prefixes, one per app — do not mix them.

**Platform App:**
```
itsm:{tenant_slug}:{resource}:{operation}:{hash}

Examples:
  itsm:tenant_a:incidents:list:abc123
  itsm:tenant_a:users:u1000001
  itsm:tenant_b:assets:list:def456
```

**Customer App** (confirmed in `catalog-service/app/cache.py`):
```
customer:{tenant_slug}:{resource}:{operation}:{hash}
customer:{tenant_slug}:{resource}:*        (wildcard invalidation form)
```

Never use unprefixed keys. Never `FLUSHDB` (affects all tenants, in either app).

---

## 9. Repo Map, Docs Index & Deployment Guides

```
platform-app/                    the platform (identity, observability, ITSM)
  services/user-service/         the one identity engine for both apps
  services/asset-service/
  services/incident-service/
  services/notification-service/
  services/frontend/             Vite/React "Synap UI" — see its own CLAUDE.md below
  design_handoff_synap/          pixel-perfect UI prototype reference + its own CLAUDE.md

customer-app/                    the multi-tenant restaurant/food-delivery app
  services/order-service/        Go
  services/catalog-service/      Python
  services/delivery-service/     Java — no frontend yet, backend-only today
  services/payment-service/      Java
  database/migrations/           customer_tenants registry + per-tenant schema
  infra/helm/customer-app/       resource limits source of truth (§4)

ai-engine/                       agentic AI layer — see ai-engine/CLAUDE.md
  design/                        5-pillar design docs (Orchestration/Memory/Tools/Eval/Agent-Skills)
  services/ai-service/           the FastAPI service this all runs behind (stub today)

docs/superpowers/specs/          design history, chronological, later supersedes earlier
docs/superpowers/plans/          implementation plans matching those specs
docs/platform/deployment-guides/ one guide per Platform phase (see below)
docs/product/deployment-guides/  one guide per Product sprint that needs K8s deploy

scripts/                         create-customer-tenants.sh, run-migrations.sh,
                                  setup-github-project.sh, populate-roadmap.sh

INFRA-INVENTORY.md               git-ignored, local — actual measured cluster/DB
                                  numbers; check before sizing any resources: block
```

After every deployable unit of work that touches the K8s cluster, write or
update a step-by-step guide: `docs/platform/deployment-guides/Phase_0X_<Name>.md`
for platform-app work, `docs/product/deployment-guides/Sprint_0X_<Name>.md`
for product/UI work. Both types must include: prerequisites, ordered steps,
expected output, verification queries/commands, rollback instructions,
troubleshooting, and an acceptance checklist.

---

## 10. UI Development — Claude Design, Both Apps

Both `platform-app` and `customer-app` UI work is **drafted with the Claude
Design canvas feature** (the `design` skill — multi-artboard mockups
published as an Artifact) before or while writing the real implementation.
Do not hand-design UI from scratch in code first.

**Platform App:** `platform-app/design_handoff_synap/reference/` remains the
pixel-perfect source of truth for what's already speced there (its own
`CLAUDE.md` governs the details — stack, styling, mock-data rules). New
screens not yet in that prototype get drafted in Claude Design first, then
built to match. Do not port `synap-tweaks.jsx` / `tweaks-panel.jsx` — those
are prototype-only demo theming; real theme settings belong in a proper
Settings/Admin screen.

**Customer App:** zero frontend exists today — this is a clean greenfield
build. Frontend stack, routing, and state approach get decided as part of
that roadmap task, but UI still starts as a Claude Design draft before code,
same as platform-app.

**One screen/feature at a time.** Build exactly what the current roadmap
task specifies, verify it in a browser against the design draft, then stop —
don't implement future screens speculatively.

---

## 11. Roadmap & Status — GitHub Projects Is the Source of Truth

Task-by-task status (what's done, what's next, per-service progress) lives in
the **GitHub Project**, not in this file and not in a markdown status tracker.
Do not add a phase/sprint status table back into this file or into any
other doc — it will drift out of sync the way the old ones did.

- **One roadmap task at a time.** Complete a task's stated acceptance
  criteria, verify it, then stop — don't start the next board item until the
  user confirms and the board reflects it.
- Design rationale for *why* a piece of architecture looks the way it does
  stays in `docs/superpowers/specs/`; the board tracks *what's left to build*,
  not *why it was designed this way*.

---

## 12. Known Open Issues

Carry these until each is explicitly closed out — don't rediscover them from
scratch in a future session, and don't assume they're fixed just because
they're not mentioned elsewhere.

- **HIGH — unauthenticated tenant param in `user-service`.**
  `InternalGetByID` (`platform-app/services/user-service/internal/handlers/users.go`)
  trusts a caller-supplied `tenant_slug` query param with no auth check beyond
  mTLS (which proves service identity, not which tenant's data the caller may
  request). Fix is designed (SPIFFE peer-principal allowlist via Istio
  `AuthorizationPolicy`) in
  `docs/superpowers/specs/2026-08-27-identity-tenancy-consolidation-design.md`
  — not yet implemented.
- **Capacity risk** — see §4's "Known open capacity risk."
- **Telemetry gap** — see §5's "Known gap" (delivery-service/payment-service
  manual spans).
- **Cross-tenant data browsing by platform staff** — no mechanism designed
  yet; see §3's Identity model note. Don't build an ad hoc workaround.
- **Undecided:** where platform-app's legacy `tenant_a/b/c` data (`assets`,
  `incidents`) ends up relative to `customer_a/b/c` — see §3's Business-data
  tenancy note.

---

## 13. What Not to Do

- Do NOT create a dedicated API Gateway service
- Do NOT create K8s StatefulSet or PVC for PostgreSQL
- Do NOT create `docker-compose.yml`
- Do NOT set HPA max replicas > 2, in either app
- Do NOT validate JWT inside application service handlers
- Do NOT set `search_path` in the DSN — set it per connection at request time
- Do NOT split `DATABASE_URL` into separate host/port/user/pass variables
- Do NOT add a "workspace/tenant slug" field back into login — it's email +
  password only, tenant is resolved server-side from the `public.users` row
- Do NOT give `customer-app` its own identity engine or JWKS endpoint —
  `user-service` is the only one
- Do NOT add dependencies not in the tech stack without asking
- Do NOT invent a Java lint/format convention — ask the user first
- Do NOT start the next roadmap task before the current one's acceptance
  criteria are met and the board is updated
- Do NOT write K8s `apiVersion` values from memory — check with kubernetes MCP first
- Do NOT write SQL against assumed schema — check with postgres MCP first
- Do NOT delete or rewrite any tracked file as "cleanup" without first
  listing the exact files/dirs and getting the user's explicit approval

# ITSM CloudNative Demo App — Synap

[![CI Build](https://github.com/<your-username>/itsm-cloudnative-demo-app/actions/workflows/ci-build.yml/badge.svg)](https://github.com/<your-username>/itsm-cloudnative-demo-app/actions/workflows/ci-build.yml)
[![CI Lint](https://github.com/<your-username>/itsm-cloudnative-demo-app/actions/workflows/ci-lint.yml/badge.svg)](https://github.com/<your-username>/itsm-cloudnative-demo-app/actions/workflows/ci-lint.yml)

A fully containerised, multi-tenant **IT Service Management (ITSM) + IT Operations (ITOM)** platform ("Synap") built as a cloud-native reference implementation. Covers Asset Management, User Management, and Incident Management — with AI-powered features, deployed on Kubernetes with a full observability stack, GitOps delivery, OPA-based RBAC, and an AI-native UI.

Built to validate cloud-native patterns locally on kubeadm before transferring learnings to a production SaaS platform.

> **UI process:** The frontend is built sprint-by-sprint from HTML/JSX prototypes designed in Claude's design tool. Prototypes live in `design_handoff_synap/reference/` and are the pixel-perfect spec for the production React app. See [Synap UI Design Workflow](#synap-ui--design--production-workflow) below.

---

## Architecture

```
Local Browser
     │
     ▼  host: tenant-a.itsm.local  (dev)
     │       tenant-a.qa.itsm.local (qa)
Istio IngressGateway  (port 80/443)
     │
     ├─[1] RequestAuthentication  ── validates JWT via JWKS (User Service)
     ├─[2] outputClaimToHeaders   ── injects X-Tenant-ID + X-User-Role from JWT claims
     ├─[3] AuthorizationPolicy    ── tenant isolation  (JWT tenant_id == subdomain)
     ├─[4] AuthorizationPolicy    ── RBAC via OPA ext_authz (role + method + path)
     └─[5] EnvoyFilter            ── local rate limit per tenant
     │
     ▼  VirtualService routes subdomain → correct tenant namespace
  ┌────────────────────────────────────────────────┐
  │  Namespace: tenant-a   (mTLS: Istio STRICT)    │
  │                                                │
  │  Frontend  ──▶ /api/v1/users      → User Svc  │
  │            ──▶ /api/v1/assets     → Asset Svc │
  │            ──▶ /api/v1/incidents  → Inc Svc   │
  │            ──▶ /api/v1/ai/*       → AI Svc    │
  │                          │                    │
  │                    RabbitMQ (events)           │
  │                          │                    │
  │                  Notification Svc ◀────────────│
  └────────────────────────────────────────────────┘
         │                │
    PostgreSQL           Redis
  (schema: tenant_a)  (prefix: tenant-a:)

  OPA (opa namespace)  ◀── ext_authz gRPC from all tenant sidecars

  All services ──OTLP──▶ OTel Collector ──▶ Prometheus / Loki / Jaeger
                                                         │
                                                      Grafana
```

---

## Synap UI — Design → Production Workflow

The frontend is built sprint-by-sprint from high-fidelity HTML/JSX prototypes created in Claude's design tool. Each sprint the prototype for one screen is committed to `design_handoff_synap/reference/`, and the production React app in `services/frontend/` is updated to match it pixel-for-pixel.

```
Claude design tool (artifact)
         │  sprint handoff commit
         ▼
design_handoff_synap/reference/*.jsx    ← living spec, updated each sprint
         │  implementation sprint
         ▼
services/frontend/                      ← Vite + React 18 + TypeScript
  src/
  ├── tokens/          ← CSS variables ported from styles.css (OKLCH, light/dark)
  ├── components/ui/   ← Primitive components (Button, Badge, Card, StatCard, Icon…)
  ├── components/      ← Feature components (IncidentTable, AssetCard, AiOrb…)
  ├── pages/           ← One folder per sprint screen
  ├── lib/data/        ← Typed mock data (port of data.jsx) until Sprint 11
  └── lib/api/         ← API client — mock until Sprint 11, real TanStack Query after
         │  docker build → nginx:alpine + dist/
         ▼
Istio IngressGateway
  /api/v1/users*      → user-service      (K8s VirtualService)
  /api/v1/assets*     → asset-service
  /api/v1/incidents*  → incident-service
  /*                  → frontend (nginx serving dist/)
```

**Sprint loop:**
1. New prototype lands in `design_handoff_synap/reference/` (committed by you)
2. Claude Code implements the screen in `services/frontend/` matching the prototype
3. Running UI verified in browser against the prototype before merging
4. Every faked AI `setTimeout` call gets a `// TODO: real API` comment as the wiring seam for Sprint 11

**Three hero flows** (must always work end-to-end):
- **Hero #1 — Zero-ticket self-service** (`portal.jsx`): Employee → AI chat → auto-fix applied → resolved in ~40s, no ticket
- **Hero #2 — AI-assisted agent resolution** (`incidents.jsx`): Agent opens incident → AI runbook + live telemetry → "Approve & run" → MTTR in minutes
- **Hero #3 — AIOps nervous-system loop** (`aiops.jsx`): 47-alert storm → "Correlate with Synap" → 1 root-cause incident → remediation → KB draft

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend (Go) | User Service, Notification Service — Chi v5, golang-jwt |
| Backend (Python) | Asset Service, Incident Service, AI Service — FastAPI, SQLAlchemy |
| Frontend | Vite + React 18 + TypeScript (Synap UI) |
| Database | PostgreSQL 16 — schema-per-tenant isolation |
| Cache | Redis 7 |
| Queue | RabbitMQ 3.13 |
| Service Mesh | Istio 1.21+ — mTLS, JWT validation, tenant routing |
| Policy Engine | OPA 0.65+ with Envoy plugin — centralized RBAC via Rego |
| Observability | OTel Collector → Prometheus + Loki + Jaeger → Grafana |
| GitOps | ArgoCD 2.11+ |
| Helm | 3.15+ |
| CI/CD | GitHub Actions → Docker Hub |
| K8s | kubeadm 3-node (16 GB total) |

---

## Multi-Tenancy Model

| Isolation Layer | Mechanism |
|---|---|
| Network routing | Istio VirtualService — subdomain per tenant |
| Authentication | Istio RequestAuthentication — JWT via JWKS |
| Tenant enforcement | Istio AuthorizationPolicy (ALLOW/DENY) |
| RBAC enforcement | OPA ext_authz (CUSTOM action) — Rego policies |
| K8s isolation | Separate namespace per tenant |
| Data isolation | Single PostgreSQL, schema per tenant |
| Cache isolation | Redis key prefix per tenant |

**Demo tenants:** `tenant-a`, `tenant-b`, `tenant-c`
**Environments:** `dev` (active), `qa` (ready — switch via `ENV=qa`)

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Kubernetes (kubeadm) | 1.29+ | 3 nodes, 16 GB total RAM — already installed |
| Helm | 3.15+ | `brew install helm` |
| kubectl | 1.29+ | Configured to point to local cluster |
| Istio CLI (`istioctl`) | 1.21+ | `brew install istioctl` |
| Docker | 20+ | For local image builds |
| ArgoCD CLI | 2.11+ | `brew install argocd` |
| OPA CLI | 0.65+ | `brew install opa` — for policy testing |
| `local-path-provisioner` | 0.0.26+ | Deployed on cluster for PVC |

---

## Quick Start — Full Cluster Deploy

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/itsm-cloudnative-demo-app.git
cd itsm-cloudnative-demo-app

# 2. Add local DNS entries (run once)
echo "$(kubectl get svc -n istio-system istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}') tenant-a.itsm.local tenant-b.itsm.local tenant-c.itsm.local" | sudo tee -a /etc/hosts

# 3. Bootstrap the full cluster (installs Istio, OPA, ArgoCD, tenants, observability)
ENV=dev bash scripts/setup-cluster.sh

# 4. Seed demo data
ENV=dev bash scripts/seed-data.sh

# 5. Port-forward all UIs for local access
bash scripts/port-forward.sh
```

After step 5:
| Service | URL |
|---|---|
| ITSM App (tenant-a) | http://tenant-a.itsm.local |
| ITSM App (tenant-b) | http://tenant-b.itsm.local |
| ITSM App (tenant-c) | http://tenant-c.itsm.local |
| Grafana | http://localhost:3000 |
| Jaeger | http://localhost:16686 |
| ArgoCD | http://localhost:8080 |
| Prometheus | http://localhost:9090 |

---

## /etc/hosts Setup

Get the Istio IngressGateway IP and add entries:

```bash
INGRESS_IP=$(kubectl get svc istio-ingressgateway -n istio-system -o jsonpath='{.spec.clusterIP}')

# For NodePort clusters (kubeadm):
INGRESS_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Add to /etc/hosts:
sudo bash -c "echo '$INGRESS_IP tenant-a.itsm.local tenant-b.itsm.local tenant-c.itsm.local' >> /etc/hosts"
sudo bash -c "echo '$INGRESS_IP qa-tenant-a.itsm.local qa-tenant-b.itsm.local qa-tenant-c.itsm.local' >> /etc/hosts"
```

---

## Environment Switching (dev / qa)

All scripts and Helm deployments respect the `ENV` variable:

```bash
# Deploy to dev (default)
ENV=dev bash scripts/setup-cluster.sh

# Deploy to qa
ENV=qa bash scripts/setup-cluster.sh

# Create tenants in qa environment
ENV=qa bash scripts/create-tenants.sh
```

See `docs/03_Deployment/03_Environment_Guide.md` for full details.

---

## Repository Structure

```
itsm-cloudnative-demo-app/
├── design_handoff_synap/    # Synap UI design source of truth — sprint-by-sprint prototypes
│   ├── reference/           # HTML/JSX prototype files (auth.jsx, shell.jsx, incidents.jsx…)
│   │   ├── Synap.html       # Entry point — open locally to preview the full prototype
│   │   ├── styles.css       # Design tokens (OKLCH colors, typography, spacing, shadows)
│   │   ├── data.jsx         # Mock data / API contract — one collection per backend endpoint
│   │   ├── ui.jsx           # Primitive components spec (Button, Badge, Card, StatCard…)
│   │   ├── icons.jsx        # Icon set (inline SVG paths, lucide-compatible)
│   │   ├── auth.jsx         # Login / SSO / MFA screens
│   │   ├── shell.jsx        # App shell — sidebar + topbar + workspace switcher
│   │   ├── dashboard.jsx    # Ops Dashboard — KPI cards, service health, AI feed
│   │   ├── aiops.jsx        # AIOps Event Console — alert correlation (hero flow #3)
│   │   ├── incidents.jsx    # Incidents list + detail (hero flow #2)
│   │   ├── portal.jsx       # End-user self-service portal (hero flow #1)
│   │   ├── inventory.jsx    # CMDB, Service Map, Cloud Inventory, Assets
│   │   ├── modules.jsx      # Monitoring, Knowledge Base, Analytics, Admin
│   │   └── copilot.jsx      # Global "Ask Synap" panel + ⌘K command palette
│   ├── README.md            # Design token spec, screen inventory, interaction guide
│   ├── BUILD_PLAN.md        # Per-sprint prompts for converting prototype → production code
│   └── CLAUDE.md            # Context loaded by Claude Code for every UI sprint session
├── services/                # Application microservices
│   ├── frontend/            # Vite + React 18 + TypeScript (Synap UI production app)
│   ├── user-service/        # Go — Chi v5, JWT issuance, JWKS endpoint
│   ├── asset-service/       # Python — FastAPI, SQLAlchemy 2.x async, Redis cache
│   ├── incident-service/    # Python — FastAPI, SQLAlchemy, RabbitMQ publisher
│   ├── notification-service/# Go — RabbitMQ consumer, W3C trace propagation
│   └── ai-service/          # Python — FastAPI, pgvector (Phase 7)
├── infra/
│   ├── k8s/             # Raw Kubernetes manifests (namespaces, Istio, OPA, HPA, storage)
│   ├── helm/            # Helm charts for app + observability stack
│   ├── argocd/          # ArgoCD Application manifests (dev + qa)
│   └── observability/   # OTel Collector, Prometheus, Loki, Jaeger, Grafana configs
├── database/            # SQL migrations (golang-migrate) + seed data
├── policies/rego/       # OPA Rego policies (RBAC) + unit tests
├── scripts/             # Cluster bootstrap, install, seed, port-forward scripts
├── tests/               # Integration, e2e, load tests
└── docs/                # Full technical documentation
```

---

## Documentation

| Document | Description |
|---|---|
| [Architecture Overview](docs/00_Overview.md) | Full architecture narrative and service map |
| [Service Design](docs/02_App_Architecture/01_Service_Design.md) | Service responsibilities and communication patterns |
| [Multi-Tenancy Model](docs/02_App_Architecture/03_Multi_Tenancy.md) | Isolation model, JWT flow, Istio routing |
| [Environment Guide](docs/03_Deployment/03_Environment_Guide.md) | How dev/qa environments work |
| [Schema Diagram](database/schema-diagram.md) | Entity-relationship model |
| [OTel Concepts](docs/01_OpenTelemetry/01_Concepts.md) | OpenTelemetry internals (Phase 5) |
| [K8s: HPA](docs/04_K8s_Concepts/01_HPA.md) | Autoscaling config (Phase 6) |
| [K8s: Istio](docs/04_K8s_Concepts/02_Istio.md) | mTLS, routing, JWT validation (Phase 6) |
| [K8s: OPA](docs/04_K8s_Concepts/04_OPA.md) | Rego RBAC, ext_authz integration (Phase 6) |

---

## Work Status

### Backend & Infrastructure Phases

| Phase | Name | Status | K8s Validated |
|---|---|---|---|
| Pre-flight | MCP Server Setup | ✅ Done | — |
| 1 | Repo Scaffold & Docs | ✅ Done | — |
| 2 | Database & Migrations | ✅ Done | ⬜ Confirm |
| 3a | User Service (Go) | ✅ Done | ⬜ Confirm |
| 3b | Asset Service (Python) | ✅ Done | ⬜ Confirm |
| 3c | Incident Service (Python) | ✅ Done | ⬜ Confirm |
| 3d | Notification Service (Go) | ✅ Done | ⬜ Confirm |
| 4 | Helm Charts + K8s Manifests + Dockerfiles | ✅ Done | ⬜ Confirm |
| 5 | Observability Stack (OTel + Prometheus + Loki + Jaeger + Grafana) | ⬜ Not Started | — |
| 6a | Istio — mTLS + JWT validation + Tenant routing | 🔲 In Progress | — |
| 6b | OPA RBAC (Rego policies + ext_authz) | ⬜ Not Started | — |
| 6c | ArgoCD GitOps | ⬜ Not Started | — |
| 7a | AI Incident Triage | ⬜ Not Started | — |
| 7b | AI Asset Search (Semantic / pgvector) | ⬜ Not Started | — |
| 7c | AI Anomaly Detection | ⬜ Not Started | — |
| 7d | AI Chatbot (RAG) | ⬜ Not Started | — |
| 8 | CI/CD (GitHub Actions → Docker Hub) | ⬜ Not Started | — |
| 9 | Documentation Completion | ⬜ Not Started | — |

### Synap UI Sprints (Vite + React 18 + TypeScript)

Design source of truth: `design_handoff_synap/reference/`. Each sprint takes the latest prototype handoff and produces a tested, production-grade screen. Mock data from `data.jsx` is used until Sprint 11 wires real APIs.

| Sprint | Screen | Reference File | Status |
|---|---|---|---|
| 0 | Foundation — scaffold + design tokens + primitive components | `styles.css`, `ui.jsx`, `icons.jsx` | 🔲 Not Started |
| 1 | Login — email/password + SSO buttons + 6-digit MFA | `auth.jsx` | 🔲 Not Started |
| 2 | App Shell — sidebar + topbar + routing + light/dark theme | `shell.jsx` | 🔲 Not Started |
| 3 | Asset Module — list + detail + create/edit forms | `inventory.jsx → Assets` | 🔲 Not Started |
| 4 | Incident Module — list + detail + lifecycle actions | `incidents.jsx` | 🔲 Not Started |
| 5 | Ops Dashboard — KPI cards + service health + AI activity feed | `dashboard.jsx` | 🔲 Not Started |
| 6 | AIOps Event Console — alert storm correlation (hero flow #3) | `aiops.jsx` | 🔲 Not Started |
| 7 | End-user Portal — zero-ticket self-service (hero flow #1) | `portal.jsx` | 🔲 Not Started |
| 8 | CMDB + Service Map + Cloud Inventory | `inventory.jsx` | 🔲 Not Started |
| 9 | Monitoring + Knowledge Base + Analytics + Admin | `modules.jsx` | 🔲 Not Started |
| 10 | Global Copilot panel + ⌘K command palette | `copilot.jsx` | 🔲 Not Started |
| 11 | Real API wiring — replace mock layer with live backend calls | all | 🔲 Not Started |

---

## Phase Acceptance Criteria

Copy-paste these checklists into your project management tool as acceptance criteria per task/ticket.

---

### Pre-flight — MCP Server Setup
- [ ] All 6 MCP servers configured in `.claude/settings.json`
- [ ] `filesystem`, `postgres`, `fetch`, `docker`, `kubernetes`, `prometheus` entries present
- [ ] Claude Code restarted and `/mcp` shows all servers connected

---

### Phase 1 — Repo Scaffold & Documentation Foundation
- [ ] `git clone` + `tree` shows complete directory structure with no missing folders
- [ ] `README.md` renders correctly on GitHub — all sections present, zero TODOs
- [ ] Architecture ASCII diagram shows Istio gateway, OPA, subdomain routing, and env separation
- [ ] `CONTRIBUTING.md` covers branch naming, commit convention, PR checklist, and OPA test guide
- [ ] `.gitignore` covers Python, Go, Node, K8s secrets, `.env*`, kubeconfig
- [ ] `docs/00_Overview.md` contains full request flow walkthrough and 7-layer isolation model
- [ ] `docs/02_App_Architecture/01_Service_Design.md` documents all 6 services with language rationale
- [ ] `docs/02_App_Architecture/03_Multi_Tenancy.md` documents all isolation layers with YAML examples
- [ ] `docs/03_Deployment/03_Environment_Guide.md` explains `ENV=dev|qa` with Helm values layering
- [ ] `database/schema-diagram.md` describes all 7 tables with columns, indexes, and SLA targets
- [ ] `docs/CHANGELOG.md` has Phase 1 entry
- [ ] All stub files created for future phases with purpose-comment headers
- [ ] `.claude/settings.json` present in project directory

---

### Phase 2 — Database & Migrations
- [ ] `V1` through `V5` SQL migration files present in `database/migrations/`
- [ ] `create_tenant_schema()` stored procedure creates all tables in correct tenant schema
- [ ] `ENV=dev bash scripts/create-tenants.sh` completes without error
- [ ] `psql` confirms 3 isolated schemas (`tenant_a`, `tenant_b`, `tenant_c`) with all tables
- [ ] Cross-schema isolation verified — querying `tenant_a.assets` from `tenant_b` search path returns empty or error
- [ ] Seed data loaded: tenant-a (10 users, 20 assets, 15 incidents), tenant-b (varied), tenant-c (minimal)
- [ ] All migrations are idempotent — safe to re-run without error
- [ ] PostgreSQL 16 running as standalone service on external machine (not in K8s)
- [ ] `DATABASE_URL` env var set and used by all services and scripts

---

### Phase 3a — User Service (Go)
- [ ] `POST /api/v1/auth/login` returns valid JWT with `tenant_id`, `role`, `sub`, `exp` claims
- [ ] `GET /api/v1/.well-known/jwks.json` returns valid JWKS public key JSON
- [ ] `POST /api/v1/auth/refresh` issues new token from valid refresh token
- [ ] `GET/POST/PUT/DELETE /api/v1/users` endpoints return correct responses
- [ ] `GET /api/v1/users/me` returns current user profile
- [ ] `GET /health` and `GET /metrics` return 200
- [ ] Service reads `X-Tenant-ID` and `X-User-Role` headers (does not re-validate JWT)
- [ ] OTel auto-instrumentation active — HTTP and DB spans visible in stdout
- [ ] Manual span `itsm.user.login` visible with `user.role`, `tenant.id`, `auth.success` attributes
- [ ] Counter `itsm_user_logins_total` increments on each login attempt
- [ ] Unit tests pass: auth logic, JWT claims correctness
- [ ] Docker image builds successfully (multi-stage, distroless final)

---

### Phase 3b — Asset Service (Python)
- [ ] `GET /api/v1/assets` returns paginated list, supports `type` and `status` filters
- [ ] `POST /api/v1/assets` creates asset and invalidates Redis cache
- [ ] `GET/PUT/DELETE /api/v1/assets/{id}` work correctly
- [ ] `GET /api/v1/assets/{id}/incidents` returns linked incidents
- [ ] Redis cache populated on list request; cache hit confirmed on second identical request
- [ ] Cache invalidated on asset update or delete
- [ ] OTel auto-instrumentation active — FastAPI, SQLAlchemy, Redis spans visible
- [ ] Manual span `itsm.asset.status_change` with `old_status`, `new_status` attributes
- [ ] Manual span event `asset.retired` fires when status changes to `retired`
- [ ] Gauge `itsm_assets_active_total` reflects current active asset count per tenant
- [ ] Unit tests pass: CRUD and cache invalidation
- [ ] Docker image builds successfully

---

### Phase 3c — Incident Service (Python)
- [ ] `GET /api/v1/incidents` returns paginated list, supports priority and status filters
- [ ] `POST /api/v1/incidents` creates incident and publishes `incident.created` RabbitMQ event
- [ ] `GET/PUT/DELETE /api/v1/incidents/{id}` work correctly
- [ ] `POST /api/v1/incidents/{id}/assign` assigns incident and appends `assigned` event
- [ ] `POST /api/v1/incidents/{id}/resolve` resolves with notes and appends `resolved` event
- [ ] `GET /api/v1/incidents/{id}/events` returns full chronological event history
- [ ] RabbitMQ message headers contain valid W3C `traceparent` header
- [ ] OTel auto-instrumentation active — FastAPI, SQLAlchemy, pika spans visible
- [ ] Manual span `itsm.incident.created` with `incident.priority`, `has_asset` attributes
- [ ] Manual span `itsm.incident.sla_check` fires with `sla_breached` boolean attribute
- [ ] Histogram `itsm_incident_resolution_duration_seconds` records on resolve
- [ ] Gauge `itsm_incidents_open_total` reflects open incident count per priority
- [ ] Unit tests pass: lifecycle, SLA check, event publishing
- [ ] Docker image builds successfully

---

### Phase 3d — Notification Service (Go)
- [ ] Service starts and connects to RabbitMQ successfully
- [ ] Consumes `incident.created`, `incident.updated`, `incident.resolved` events
- [ ] W3C trace context extracted from message headers — `trace_id` in notification log matches `trace_id` in incident service log for same request
- [ ] `GET /health` returns 200
- [ ] Manual span `itsm.notification.received` with `event_type`, `incident.id`, `tenant.id`
- [ ] Counter `itsm_notifications_processed_total` increments per event
- [ ] Docker image builds successfully (distroless)

---

### Phase 3 (Full) — Integration
- [ ] All 4 services deploy to `tenant-a` namespace via `helm install`
- [ ] Login → JWT → create asset → create incident linked to asset → event appears in Notification Service logs — full flow works end-to-end
- [ ] `trace_id` is consistent across all service logs for a single request chain
- [ ] Istio `RequestAuthentication` rejects invalid JWT with 401
- [ ] `tenant-a` JWT rejected at `tenant-b.itsm.local` with 403

---

### Phase 4 — Frontend (Next.js)
- [ ] Login page works — valid credentials redirect to dashboard, invalid show error
- [ ] JWT stored in httpOnly cookie — not accessible via JavaScript console
- [ ] Protected routes redirect to login when cookie absent or expired
- [ ] Tenant name and user role badge visible in top navigation
- [ ] Asset list loads with pagination, type filter, and status filter working
- [ ] Asset detail page shows asset fields and linked incidents list
- [ ] Create and edit asset forms submit successfully and reflect changes immediately
- [ ] User list visible to admin role; hidden/403 for agent and viewer
- [ ] Incident list shows priority colour coding (P1=red, P2=orange, P3=yellow, P4=green)
- [ ] Incident detail page shows event history timeline in chronological order
- [ ] Create incident form allows asset linkage and assignee selection
- [ ] Assign, escalate, and resolve quick-actions work from incident detail
- [ ] AI panel stub visible as collapsible bottom-right panel
- [ ] `tenant-a.itsm.local` with `tenant-b` JWT shows 403 handled gracefully (not blank screen)
- [ ] UI functional and no layout breakage at 1280px+ width
- [ ] Docker image builds successfully

---

### Phase 5 — Observability Stack
- [ ] OTel Collector pod running in `observability` namespace and receiving OTLP from all services
- [ ] Prometheus scraping all services — metrics visible at `localhost:9090`
- [ ] Loki receiving logs from all tenant namespaces via Promtail
- [ ] Jaeger receiving traces — at least one complete trace visible for a login request
- [ ] Grafana at `localhost:3000` shows all 6 dashboards with live data
- [ ] `itsm-overview.json` — RED metrics (rate, error, latency) visible per tenant
- [ ] `incident-service.json` — `itsm_incidents_open_total` by priority visible
- [ ] `asset-service.json` — cache hit rate metric visible
- [ ] `user-service.json` — `itsm_user_logins_total` by status visible
- [ ] `istio-mesh.json` — Istio per-tenant request rates and mTLS coverage visible
- [ ] Single login request produces: Prometheus counter increment + Loki log entry + Jaeger trace with ≥4 spans
- [ ] Manual business span `itsm.incident.created` visible in Jaeger with all required attributes
- [ ] Clicking `trace_id` in Loki opens correct trace in Grafana Jaeger panel (log-to-trace correlation)
- [ ] All OTel docs (`docs/01_OpenTelemetry/`) fully written with app-specific examples

---

### Phase 6a — Helm Charts
- [ ] `infra/helm/itsm-app/` chart present with all templates
- [ ] `values.yaml`, `values-dev.yaml`, `values-qa.yaml` all present
- [ ] `values-tenant-a.yaml`, `values-tenant-b.yaml`, `values-tenant-c.yaml` present
- [ ] `_helpers.tpl` exposes `itsm.env`, `itsm.namespace`, `itsm.fullname`, `itsm.imageTag`
- [ ] `hpa.yaml` template conditional and uses `{{ .Values.hpa.maxReplicas }}` (max 2)
- [ ] `helm lint infra/helm/itsm-app/` passes with zero errors
- [ ] `helm template` dry-run with all three value combinations produces valid YAML

---

### Phase 6b — K8s Manifests
- [ ] Namespace YAMLs present for dev and qa with `istio-injection: enabled` label
- [ ] ResourceQuota applied per tenant namespace — CPU and memory limits enforced
- [ ] LimitRange applied per tenant namespace — default container limits set
- [ ] StorageClass (`local-path`), PV and PVC for PostgreSQL (10Gi) created
- [ ] PV and PVC for Redis (2Gi) created
- [ ] HPA YAMLs present for all stateless services — min 1, max 2, cpu 70%

---

### Phase 6c — Istio Configuration
- [ ] Istio IngressGateway running and listening on port 80
- [ ] `RequestAuthentication` per tenant namespace with `outputClaimToHeaders` for `X-Tenant-ID` and `X-User-Role`
- [ ] `AuthorizationPolicy` (ALLOW/DENY) per tenant — cross-tenant JWT rejected with 403
- [ ] `VirtualService` per tenant routing subdomain to correct namespace services
- [ ] `PeerAuthentication` STRICT mTLS applied to all tenant namespaces
- [ ] `istioctl authn tls-check <pod>.tenant-a <service>` shows STRICT for all services
- [ ] `scripts/install-istio.sh` runs idempotently without errors
- [ ] `docs/04_K8s_Concepts/02_Istio.md` fully written

---

### Phase 6d — OPA Policy Engine
- [ ] OPA pod running in `opa` namespace
- [ ] OPA gRPC service reachable on port 9191 from all tenant namespaces
- [ ] `istioctl proxy-config listeners <pod>.tenant-a` shows `ext_authz` filter in listener chain
- [ ] `opa test ./policies/rego/ -v` — all unit tests pass
- [ ] `viewer` JWT → `DELETE /api/v1/incidents/{id}` → 403
- [ ] `agent` JWT → `DELETE /api/v1/users/{id}` → 403
- [ ] `agent` JWT → `POST /api/v1/incidents` → 201
- [ ] `admin` JWT → all endpoints → correct 2xx responses
- [ ] Policy update: edit `rbac.rego` → apply ConfigMap → restart OPA pod → new rule active without any service restart
- [ ] `docs/04_K8s_Concepts/04_OPA.md` fully written

---

### Phase 6e — ArgoCD GitOps
- [ ] ArgoCD running and UI accessible at `localhost:8080`
- [ ] `ENV=dev bash scripts/setup-cluster.sh` completes end-to-end without manual steps
- [ ] All 3 dev tenant ArgoCD Applications show `Synced + Healthy`
- [ ] Observability ArgoCD Application shows `Synced + Healthy`
- [ ] `kubectl get pods -n tenant-a` shows all services in `Running` state
- [ ] k6 load test against incident service → HPA scales pods from 1 → 2 → back to 1 after cool-down
- [ ] Push change to `values-dev.yaml` in git → ArgoCD detects and auto-syncs all 3 tenant apps within 3 minutes
- [ ] `docs/03_Deployment/01_K8s_Deployment.md` and `02_GitOps_Runbook.md` fully written

---

### Phase 7a — AI Incident Triage
- [ ] `POST /api/v1/ai/incidents/{id}/triage` returns structured JSON with `priority`, `assignee_role`, `hypothesis`, `actions`, `confidence_score`
- [ ] Triage result stored in `incident_ai_analysis` table
- [ ] AI Analysis card visible on incident detail page in frontend
- [ ] Response returned within 15 seconds for a typical P1 incident
- [ ] Manual OTel span `itsm.ai.triage.llm_call` visible in Jaeger with `llm.model` and `llm.prompt_tokens` attributes
- [ ] Grafana `ai-service.json` dashboard shows live triage latency and request rate

---

### Phase 7b — AI Asset Search (Semantic)
- [ ] `POST /api/v1/ai/assets/search` with natural language query returns ranked asset list
- [ ] Query `"servers in maintenance"` returns assets with `type=hardware` and `status=maintenance`
- [ ] Embeddings generated and stored in `asset_embeddings` table for all seeded assets
- [ ] New asset creation triggers embedding generation automatically
- [ ] `AI Search` toggle on frontend Asset List page switches between keyword and semantic search
- [ ] Manual span `itsm.ai.search.vector_lookup` visible in Jaeger with `results.count` attribute

---

### Phase 7c — AI Anomaly Detection
- [ ] `GET /api/v1/ai/anomalies` returns list of detected anomalies with `metric`, `severity`, `detected_at`
- [ ] Scheduled job runs every 15 minutes — confirmed via pod logs
- [ ] Anomaly annotation markers appear on Grafana ITSM Overview dashboard
- [ ] P1 anomaly triggers RabbitMQ alert publish — visible in Notification Service logs
- [ ] Manual span `itsm.ai.anomaly.model_inference` visible in Jaeger

---

### Phase 7d — AI Chatbot (RAG)
- [ ] `POST /api/v1/ai/chat` returns contextually relevant response using tenant-scoped data
- [ ] Query `"show all open P1 incidents"` returns only tenant-a incidents when using tenant-a JWT
- [ ] Chat session persists across multiple messages (Redis session TTL 30 min)
- [ ] Chatbot panel opens and closes correctly in frontend bottom-right corner
- [ ] Sources shown in chatbot response (asset names or incident IDs retrieved)
- [ ] `tenant-a` chatbot cannot access `tenant-b` data — verified by cross-tenant query test
- [ ] Manual span `itsm.ai.chat.retrieval` visible with `retrieved_docs.count` attribute

---

### Phase 8 — CI/CD (GitHub Actions)
- [ ] Opening a PR triggers `ci-lint.yml` — `golangci-lint`, `ruff`, `eslint` all run
- [ ] Opening a PR triggers `ci-build.yml` — all service Docker images build and unit tests run
- [ ] `ci-lint.yml` includes `opa test ./policies/rego/` for Rego policy validation
- [ ] Merging to `main` triggers `ci-docker-push.yml` — all images pushed to Docker Hub
- [ ] Docker Hub shows new images tagged with both `latest` and `git-<sha>`
- [ ] Updating image tag in `values-dev.yaml` and pushing to `main` → ArgoCD auto-deploys within 3 minutes
- [ ] README CI status badges show passing state

---

### Phase 9 — Documentation Completion
- [ ] `docs/01_OpenTelemetry/03_Instrumentation.md` has dedicated manual instrumentation section with real code examples from all services
- [ ] `docs/02_App_Architecture/04_AI_Architecture.md` documents LLM integration, RAG design, vector search
- [ ] `docs/04_K8s_Concepts/` — HPA, Istio, Storage, OPA docs all complete with app-specific YAML examples
- [ ] `docs/05_AI_Features/` — all 4 AI feature docs complete
- [ ] `README.md` phase status table shows all phases ✅
- [ ] `docs/CHANGELOG.md` has entries for all 9 phases
- [ ] New engineer can clone repo and run `ENV=dev bash scripts/setup-cluster.sh` to get full running demo in under 15 minutes following README
- [ ] All internal doc links valid — no 404s
- [ ] Zero TODOs or placeholder text anywhere in the repository

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit conventions, and PR process.

---

## License

MIT

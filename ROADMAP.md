# Synap — Product Roadmap

> **Owner:** Pratik Patel (Product)
> **Updated:** 2026-06-18
> **GitHub Projects board:** [Synap Roadmap](https://github.com/preet2fun/itsm-cloudnative-demo-app/projects) — mirrors this file; run `scripts/setup-github-project.sh` to initialise.

This is the **single source of truth** for what Synap is building, in what order, and why.
Every sprint and phase follows the same SDLC gate:

```
Design prototype → UI development → Backend development → Infra → Deploy K8s → E2E test ✓ → Mark complete
```

Multi-tenancy is a **first-class constraint** at every layer — no feature ships without tenant isolation verified end-to-end.

---

## Platform Vision

Synap is an AI-native ITSM + ITOM platform built as a production-grade, open-source reference implementation. It shows how modern SaaS teams build multi-tenant, zero-trust, observable systems on self-hosted Kubernetes — and gives enterprises a deployable, extensible starting point they can contribute back to.

**North star:** The go-to open-source reference for cloud-native ITSM on Kubernetes.

---

## Guiding Principles

| Principle | What it means in practice |
|---|---|
| **Multi-tenant first** | Every feature designed for tenant isolation from day one — data, cache, queue, metrics all scoped per tenant |
| **Security by default** | Zero-trust at every layer: mTLS between pods, JWT at the mesh, OPA RBAC per request |
| **AI-native** | AI is a first-class citizen — not a bolt-on; every workflow has an AI assist path |
| **Observable by design** | OTel on every service from day one; every span carries `tenant.id` |
| **Open source grade** | Code, docs, and architecture decisions good enough for community contribution |

---

## Now — v0.6.x (Active)

### Phase 6 — Istio + OPA (Platform Security Foundation)

> **Why first:** Every sprint's E2E test requires authenticated API access through the IngressGateway. Phase 6 is the platform prerequisite that unblocks all subsequent sprints.

**Tenant isolation layers being added:**
- Istio RequestAuthentication — JWT `tenant_id` claim validated and injected as `X-Tenant-ID` header
- Istio AuthorizationPolicy DENY — unauthenticated requests blocked at mesh
- OPA ext_authz — per-tenant RBAC: role + method + path
- PeerAuthentication STRICT — mTLS between all pods

| Deliverable | Status |
|---|---|
| RS256 JWT migration (user-service) | 🔄 Ready to deploy |
| Istio install (demo profile, NodePort 30080) | 🔄 Ready to deploy |
| Gateway + VirtualService routing | 🔄 Ready to deploy |
| RequestAuthentication (JWKS → Istio) | 🔄 Ready to deploy |
| DENY AuthorizationPolicy (unauthenticated) | 🔄 Ready to deploy |
| OPA deployment + Rego RBAC | 🔄 Ready to deploy |
| CUSTOM AuthorizationPolicy (OPA ext_authz) | 🔄 Ready to deploy |
| PeerAuthentication STRICT (mTLS) | 🔄 Ready to deploy |
| E2E acceptance test (all 10 checks) | ⬜ Pending deployment |

**Exit criteria:** `http://172.16.15.206:30080` — login works, unauthenticated API returns 403, viewer blocked from POST, mTLS confirmed STRICT.

---

## Next — v0.7–v0.9 (Committed)

### Sprint 1 — Authentication (email + password + email OTP MFA)
*Gate: Phase 6 complete and validated on cluster*

| Layer | Deliverable |
|---|---|
| UI | Login split-screen — brand panel (synapse mark + 96%/41m/64% stats) + form |
| UI | Email + password form with validation |
| UI | 6-digit email OTP step |
| UI | Forgot password page |
| UI | React Router: `/login` → `/login/mfa` → `/forgot-password` |
| Backend | `POST /api/v1/auth/mfa/send` — generate OTP, store in Redis (5 min TTL), send email |
| Backend | `POST /api/v1/auth/mfa/verify` — validate OTP, issue RS256 JWT |
| Backend | SMTP email sender (dev mode: log OTP to stdout if `SMTP_HOST` unset) |
| Infra | Build + push `user-service:v0.3.0`, `frontend:v0.2.0` |
| Deploy | `helm upgrade` with new image tags |
| E2E | Login → OTP email → enter code → JWT stored → redirect to shell |

**Multi-tenant check:** Login with `alice.admin@globaltech.io` (tenant_a) and `bob.agent@startupco.io` (tenant_b) — both get tenant-scoped JWTs, cannot access each other's data.

---

### Sprint 2 — App Shell + Routing + Theme
*Ref: `design_handoff_synap/reference/shell.jsx`*

| Layer | Deliverable |
|---|---|
| UI | Left sidebar: Synap mark, workspace switcher, grouped nav (Operate / Self-Service / Inventory / Insights), AI footer card |
| UI | Topbar: page title, ⌘K trigger, Ask Synap button, theme toggle, notification bell, persona switch, avatar menu |
| UI | React Router — all nav routes wired with placeholder pages |
| UI | Light/dark theme persisted to localStorage |
| UI | Persona switch: Agent console ↔ Employee portal |
| UI | Per-route error boundary |
| Backend | `GET /api/v1/users/me` — return profile from JWT claims |
| Infra | Build + push `frontend:v0.3.0` |

---

### Sprint 3 — Asset Module
*Ref: `design_handoff_synap/reference/inventory.jsx` → `Assets` view*

Asset list table + detail panel + CRUD. Multi-tenant: assets scoped to `X-Tenant-ID`.

---

### Sprint 4 — Incident Module (Hero Flow #2)
*Ref: `design_handoff_synap/reference/incidents.jsx`*

Incident list + detail with AI resolution runbook (mocked), live asset telemetry charts, AI timeline.

---

### Sprint 5 — Ops Dashboard
*Ref: `design_handoff_synap/reference/dashboard.jsx`*

KPI stat cards, active-incident hero card, service health grid, AI activity feed, predictive alert banner.

---

### Phase 7 — AI Features
- AI triage service (FastAPI + pgvector)
- AI incident resolution runbook generation
- KB article auto-draft from resolved incidents
- NL semantic search across CIs and incidents

---

## Later — v1.0+ (Explored, not yet scheduled)

### Sprint 6 — AIOps Event Console (Hero Flow #3)
*Ref: `design_handoff_synap/reference/aiops.jsx`*
Alert storm (47 events) → "Correlate with Synap" → collapses to 1 incident with animated topology viz.

### Sprint 7 — End-user Portal (Hero Flow #1)
*Ref: `design_handoff_synap/reference/portal.jsx`*
Zero-ticket self-service: chat → AI device diagnostics → "Apply fix" → resolved in ~40s.

### Sprints 8–10 — Remaining Modules
- CMDB + Service Map + Cloud Inventory (`inventory.jsx`)
- Monitoring, Knowledge Base, Analytics, Admin (`modules.jsx`)
- Global Copilot + ⌘K palette (`copilot.jsx`)

### Sprint 11 — Real API Wiring
Replace all mock data with TanStack Query + real backend endpoints. Wire SSO when IdP is available.

### Phase 8 — Observability Stack
- OTel Collector deployment
- Prometheus + Grafana dashboards (per-tenant metric labels)
- Loki log aggregation
- Jaeger distributed tracing

### Phase 9 — CI/CD + GitOps
- GitHub Actions: build, test, lint, docker push with semver tags
- ArgoCD application setup (dev + qa)
- Automated image tag promotion dev → qa

### Multi-Tenancy Enhancements
- Tenant management UI (onboard / offboard tenants from the Admin screen)
- Per-tenant settings and branding (accent hue, logo)
- Tenant usage metrics dashboard (Prometheus per-tenant labels)
- Tenant onboarding API (`POST /api/v1/admin/tenants`)
- Tenant admin role with cross-tenant read-only visibility

### Open Source + Community
- Helm chart published to ArtifactHub
- GitHub Discussions enabled
- Contributor quick-start guide (dev environment in < 30 min)
- Example tenant seed data sets (3 industries)
- Plugin API for custom integrations
- Demo video / walkthrough recording

---

## Completed

| Version | Phase / Sprint | Date |
|---|---|---|
| v0.1.0 | Phase 1 — Repo scaffold + docs foundation | Apr 2026 |
| v0.2.0 | Phase 2 — Database layer, migrations, seed data | Apr 2026 |
| v0.3.0 | Phase 3 — User Service (Go, Chi v5, JWT HS256) | Apr 2026 |
| v0.4.0 | Phase 4 — Asset + Incident Services (Python, FastAPI) | Apr 2026 |
| v0.5.0 | Phase 5 — Helm charts, K8s manifests, Dockerfiles | May 2026 |
| Sprint 0 | UI foundation — Vite + React 18 + design system | Jun 2026 |

---

## How to contribute to the roadmap

1. Open a GitHub Issue tagged `roadmap` to propose a feature or change
2. The product owner reviews and assigns it to Now / Next / Later
3. When scheduled, the issue moves to the GitHub Projects board
4. Implementation follows the SDLC gate above

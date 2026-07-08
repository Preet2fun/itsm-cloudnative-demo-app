# Platform / Product Split — Design

Status: proposed, pending user review
Scope: GitHub Project/Issues taxonomy and `docs/` restructuring only. No code, Helm, or K8s manifest changes.

## 1. Motivation

The repo currently tracks all work (infra phases + UI sprints) as a single flat
roadmap. To look and operate like a realistic production-grade project, the
work should be split into two independent tracks:

- **Platform** — the multi-tenant K8s infrastructure and everything that
  supports it: database layer, service mesh, authz, observability, CI/CD,
  identity/auth engine, AI infrastructure (vector DB, LLM provider
  integration, MCP servers), notification delivery, and OSS/community
  tooling. Reusable by any product built on top.
- **Product** — Synap-specific business logic and UX: Asset Service,
  Incident Service, the entire frontend (all sprints, including the login
  screen), and AI *features* (triage, runbook generation, KB auto-draft,
  semantic search UX, AIOps correlation, Copilot) that consume Platform's AI
  infrastructure.

The repo already leans this way informally (`docs/product/` exists
separately from `docs/architecture/`; the existing Feature Map groups items
into "Foundation/Platform Ops" vs "Core ITSM/AI Layer/Self-Service"), but
it's never been formalized across GitHub issues or the doc tree.

## 2. Taxonomy rules

| Rule | Track |
|---|---|
| K8s/Helm delivery, service mesh, authz (Istio/OPA) | Platform |
| Multi-tenant PostgreSQL data layer (schema-per-tenant engine) | Platform |
| Observability stack (OTel, Prometheus, Loki, Jaeger, Grafana) | Platform |
| CI/CD & GitOps | Platform |
| Identity Engine — `user-service` backend (JWT issuance, JWKS, tenant registry, RBAC data model) | Platform |
| AI infrastructure — vector DB, LLM provider integration, MCP servers, embedding pipeline | Platform |
| Notification delivery infra (`notification-service`) | Platform |
| OSS/community tooling (ArtifactHub, contributor guide, plugin API) | Platform (continuous, no phase number) |
| Asset Service / Incident Service business logic | Product |
| Frontend — all UI sprints, including the Login/MFA screen | Product |
| AI features — triage logic, runbook generation, KB auto-draft, semantic search UX, AIOps correlation, Global Copilot | Product |

Boundary calls settled during design:
- Auth is split at the backend/UI seam: the JWT/JWKS engine is Platform, the
  login screen is Product.
- Notification Service stays Platform (generic delivery infra), consistent
  with how the existing Feature Map already treats it.
- The single "Phase 7 AI Features" issue mixes Platform-infra and
  Product-feature scope and needs to split (see §4).
- "Multi-tenancy enhancements" (issue #21) similarly mixes a Platform
  backend concern (schema/tenant-provisioning engineering) with a Product
  concern (tenant management UI) and needs to split.

## 3. GitHub mechanics

Add a **`Track`** single-select custom field to Project #1 ("Synap Roadmap"):
values `Platform`, `Product`. This is additive — existing labels (`phase`,
`sprint`, `roadmap`, `now`/`next`/`later`/`done`, `multi-tenant`, `ai`, `ui`,
`infra`, `security`, `observability`) are unchanged. `Track` enables
native board grouping/filtering by track, alongside the existing `Status`
field.

`scripts/populate-roadmap.sh` and `scripts/setup-github-project.sh` need a
follow-up update (not part of this pass) so future issue creation sets
`Track` automatically.

## 4. Full remapping

### Platform track — independent `P-Phase N` numbering

| New | Was | Issue | Action |
|---|---|---|---|
| P-Phase 1 | Phase 1 | #2 Repo Scaffold | closed — tag `Track=Platform` only |
| P-Phase 2 | Phase 2 | #3 Database Layer | closed — tag only |
| P-Phase 3 | Phase 3 | #4 User Service (Identity Engine) | closed — tag only |
| P-Phase 4 | Phase 5 | #6 Helm/K8s/Dockerfiles | closed — tag only |
| P-Phase 5 | Phase 6 | #8 Istio + OPA | closed — tag only. **Separately flagged: live-cluster validation on 2026-07-08 found this is not actually deployed to the dev cluster despite being closed — recommend reopening/re-verifying independent of this reorg.** |
| P-Phase 6 | Phase 8 | #19 Observability Stack | open — tag only |
| P-Phase 7 | Phase 9 | #20 CI/CD + GitOps | open — tag only |
| P-Phase 8 | *(new)* | split from #14 | **AI Platform** — pgvector/vector DB setup, LLM provider integration, MCP server infra, embedding pipeline |
| P-Phase 9 | *(new)* | split from #21 | **Multi-Tenant Data Layer Enhancements** — schema-per-tenant scaling, tenant provisioning automation (backend half of #21) |
| — (no phase number, continuous) | — | #22 OSS/Community | tag `Track=Platform` |

Gap noted: **Notification Service has no dedicated GitHub issue** (only a
`README.md` + stub `main.go` exist under `services/notification-service/`).
Recommend creating a Platform-track issue when work actually starts; not
urgent now.

### Product track — keeps existing `Sprint N` numbering

| Sprint | Issue | Action |
|---|---|---|
| 0 | #7 UI Foundation | closed — tag `Track=Product` |
| 1 | #9 Login + MFA UI | open — tag only (backend JWT/OTP delivery is P-Phase 3) |
| 2 | #10 App Shell | open — tag only |
| 3 | #11 Asset Module | open — tag + references Asset Service business logic (historical #5, closed) |
| 4 | #12 Incident Module | open — tag + references Incident Service business logic (historical #5, closed) |
| 5 | #13 Ops Dashboard | open — tag only |
| 6 | #15 AIOps Event Console | open — tag + cross-link to new AI Product epic (correlation logic) |
| 7 | #16 End-user Portal | open — tag + cross-link to AI Product epic (diagnostics/remediation logic) |
| 8-10 | #17 CMDB/Monitoring/Admin | open — tag; Sprint 9 (Admin) absorbs tenant management UI (product half of #21) |
| 11 | #18 Real API wiring | open — tag only |
| *(new)* | split from #14 | **AI Product Features** epic — triage, runbook generation, KB auto-draft, semantic search UX; cross-links Sprints 4/6/7/9/10 instead of duplicating their checklists |

Historical closed issues (#2-8, #7) are tagged retroactively for
consistency; their content is not rewritten.

## 5. Doc consolidation → `docs/platform/` + `docs/product/`

Retire the old numbered doc tree; merge into two trees matching the
taxonomy:

**`docs/platform/`** ←
- `docs/architecture/*` (System Overview, Service Design, Multi-Tenancy, Security Model, Data Model)
- `docs/02_App_Architecture/*` (Service Design, Data Flow, Multi-Tenancy; AI Architecture minus product-facing feature content)
- `docs/01_OpenTelemetry/*`
- `docs/04_K8s_Concepts/*` (HPA, Istio, Storage, OPA)
- `docs/03_Deployment/*` (K8s Deployment, GitOps Runbook, Environment Guide)
- `docs/Helm_Microservice_Deployment_Guide.md`
- Phase 1-6 guides from `docs/06_Phase_Deployment_Guides/`

**`docs/product/`** ←
- existing `docs/product/*` (Vision & Personas, Feature Map, Hero Flows — kept as-is)
- `docs/05_AI_Features/*` (Incident Triage, Anomaly Detection, Intelligent Search, AI Chatbot — these are product feature specs)
- new Sprint deployment-guides subfolder (for future Sprint 1+ guides)

## 6. Follow-on housekeeping (noted, not executed in this pass)

- CLAUDE.md rule 9 (deployment guide location) needs updating to point at the split location.
- CLAUDE.md's Phase/Sprint status tables need a `Track` column, and the
  Phase 9 numbering references throughout CLAUDE.md need updating to the
  new `P-Phase N` scheme.
- `scripts/populate-roadmap.sh` / `scripts/setup-github-project.sh` need
  updating to set `Track` on issue creation going forward.

## 7. Explicit non-goals

- No code, Helm chart, or K8s manifest changes.
- No renaming of git branches, Docker image repos, or Helm release names.
- No change to the currently-running dev cluster or its GitHub issue
  history beyond adding the `Track` field/tags and the two proposed issue
  splits (#14, #21).

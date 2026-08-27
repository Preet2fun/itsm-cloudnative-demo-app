# Product Vision & Personas

## Vision

> **"The nervous system of your enterprise — instantly routing ITOM alerts to automated fixes."**

Synap is an **AI-native, multi-tenant IT Service Management (ITSM) + IT Operations Management (ITOM)** platform. It unifies alert management, incident lifecycle, asset tracking, and AI-driven remediation in a single self-hosted Kubernetes application.

**Core promise:** Reduce mean-time-to-resolution (MTTR) from hours/days to minutes, and deflect up to 80% of L1 support tickets with zero-touch AI resolution.

---

## Product Positioning

| Dimension | Synap |
|---|---|
| Deployment | Self-hosted on customer Kubernetes (open-source) |
| Market | International B2B SaaS — medium to large enterprise IT teams |
| Differentiator | AI is the core loop, not a bolt-on; built multi-tenant from day one |
| Open-source model | Apache 2.0; community-driven reference implementation |

---

## Two Product Surfaces

### 1. Agent / Ops Console
The primary surface for IT professionals. Combines NOC-style alert management with ITSM workflows and AI-assisted resolution.

**Key screens:** Dashboard, AIOps Event Console, Incidents, CMDB, Service Map, Cloud Inventory, Assets, Monitoring, Knowledge Base, Analytics, Admin

### 2. End-User Self-Service Portal
A zero-friction employee portal. AI reads device diagnostics, proposes fixes, and resolves issues without creating a ticket.

**Key screen:** Employee Portal (hero flow #1)

---

## Personas

### Persona 1 — IT Manager (Admin role)

| Attribute | Value |
|---|---|
| Role in Synap | `admin` |
| Job title | IT Director, IT Manager, Head of IT Operations |
| Goals | Reduce MTTR, deflect L1 tickets, maintain SLA, demonstrate ROI of AI investment |
| Pain points | Alert fatigue from too many monitoring tools; agents spending hours on L1 tickets; no unified view of incidents + assets |
| Key screens | Ops Dashboard, Analytics, Admin & Settings, CMDB |
| Key metric | MTTR, ticket deflection rate, P1 incident count, SLA compliance % |

**Representative quote:** *"I need to see which P1 incidents are open right now and whether my team is making progress — not dig through five different tools."*

---

### Persona 2 — IT Agent / SRE (Agent role)

| Attribute | Value |
|---|---|
| Role in Synap | `agent` |
| Job title | IT Technician, L1/L2 Support Agent, SRE, NOC Operator |
| Goals | Resolve incidents fast; use AI to skip the manual diagnosis; keep asset inventory current |
| Pain points | Alert storms with no context; repetitive tickets that could be automated; no runbook for root cause |
| Key screens | AIOps Event Console, Incident Detail, End-User Portal (to verify AI resolutions), Assets |
| Key metric | Incidents resolved per day, time to first response, AI runbook acceptance rate |

**Representative quote:** *"When 47 alerts fire at once, I need Synap to tell me it's one root cause — not 47 separate issues I have to triage myself."*

---

### Persona 3 — End User (Viewer / Portal-only)

| Attribute | Value |
|---|---|
| Role in Synap | `viewer` (Portal surface only) |
| Job title | Any employee (not IT staff) |
| Goals | Fix their own IT issue fast without waiting for a ticket response |
| Pain points | IT helpdesk queue is slow; don't know who to contact; simple issues take days |
| Key screens | End-User Self-Service Portal |
| Key metric | Time-to-resolution for self-service issues, deflection rate |

**Representative quote:** *"My laptop Wi-Fi is broken. I described it to Synap, it ran a diagnostic, and fixed it in 40 seconds. I never had to file a ticket."*

---

## Platform Goals by Phase

| Phase | Product Goal |
|---|---|
| Phases 1–5 | Core ITSM data layer: users, assets, incidents, APIs running on K8s |
| Phase 6 | Security baseline: multi-tenant isolation, mTLS, RBAC — production-worthy trust model |
| Phase 7 | AI-native differentiation: triage, semantic search, Copilot |
| Phase 8 | Observability as a first-class feature: the platform monitors itself |
| Phase 9 | GitOps + CI/CD: fully automated delivery pipeline |
| Sprints 1–11 | Synap UI: pixel-perfect React 18 implementation of the design prototype |

---

## Success Metrics

| Metric | Target |
|---|---|
| Ticket deflection via AI portal | > 60% of L1 incidents |
| MTTR for P1 incidents | < 15 minutes with AI runbook |
| AIOps noise reduction | > 90% alert correlation (storm → single incident) |
| Platform availability | 99.9% per-tenant SLA |
| Multi-tenant isolation | Zero cross-tenant data leaks |

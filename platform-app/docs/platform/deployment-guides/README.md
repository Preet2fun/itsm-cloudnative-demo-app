# Phase Deployment Guides

Step-by-step deployment instructions for each phase.
Follow these in order — each phase builds on the previous one.

| Guide | Phase | What gets deployed |
|---|---|---|
| [Phase 1 — Repo Scaffold](./Phase_01_Repo_Scaffold.md) | 1 | Repository structure, docs, MCP config |
| [Phase 2 — Database Layer](./Phase_02_Database.md) | 2 | PostgreSQL install, migrations, seed data |
| Phase 3 — User Service | 3 | Go user-service in K8s *(added in Phase 3)* |
| Phase 4 — Asset & Incident Services | 4 | Python services in K8s *(added in Phase 4)* |
| Phase 5 — Frontend | 5 | Next.js in K8s *(added in Phase 5)* |
| Phase 6 — Istio + OPA | 6 | Service mesh, mTLS, JWT AuthN, OPA RBAC |
| Phase 7 — AI Features | 7 | pgvector, AI service, embeddings |
| Phase 8 — Observability | 8 | Prometheus, Grafana, Jaeger, Loki |
| Phase 9 — CI/CD & GitOps | 9 | GitHub Actions, ArgoCD |

**Convention used in all guides:**
- `<machine-ip>` — replace with the actual IP of your PostgreSQL/Redis/RabbitMQ host machine
- `ENV=dev` — change to `ENV=qa` when deploying to QA
- Commands prefixed with `$` run on your **laptop/workstation**
- Commands prefixed with `[db-machine]$` run **on the database host machine** (SSH in first)
- Commands prefixed with `[k8s-node]$` run **on any K8s control-plane node**

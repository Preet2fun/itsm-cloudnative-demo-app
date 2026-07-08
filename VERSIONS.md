# Component Version Registry

> **Current platform release:** v0.5.0
> **In progress:** v0.6.0 (Phase 6 — Istio + OPA)
> **Last updated:** 2026-06-18

After each phase or sprint completes end-to-end on K8s, create a git tag:
```bash
git tag v0.6.0 -m "Phase 6: Istio + OPA complete"
git push origin v0.6.0
```

---

## Application Services

| Service | Language | Version | Docker Image | Deployed Tag | Changelog |
|---|---|---|---|---|---|
| user-service | Go 1.22 | v0.2.0 | `preet2fun/user-service` | `:latest`* | [CHANGELOG](services/user-service/CHANGELOG.md) |
| asset-service | Python 3.12 | v0.2.0 | `preet2fun/asset-service` | `:latest`* | [CHANGELOG](services/asset-service/CHANGELOG.md) |
| incident-service | Python 3.12 | v0.2.0 | `preet2fun/incident-service` | `:latest`* | [CHANGELOG](services/incident-service/CHANGELOG.md) |
| frontend (Synap UI) | TypeScript | v0.1.0 | `preet2fun/frontend` | `:latest`* | [CHANGELOG](services/frontend/CHANGELOG.md) |
| notification-service | Go 1.22 | v0.0.1 | `preet2fun/notification-service` | not deployed | stub — Phase 7 |
| ai-service | Python 3.12 | v0.0.1 | `preet2fun/ai-service` | not deployed | stub — Phase 7 |

> *Images currently tagged `:latest` on cluster. Proper semver tags (`v0.x.x`) are applied starting Phase 6 when images are rebuilt. See [Version Bump Guide](#version-bump-guide) below.

---

## Infrastructure Components

| Component | Version | Notes |
|---|---|---|
| Helm chart (`itsm-app`) | v0.2.0 | [CHANGELOG](infra/helm/itsm-app/CHANGELOG.md) |
| Kubernetes | 1.29+ | 3-node kubeadm cluster |
| Istio | 1.22.0 | Pending Phase 6 |
| OPA | 0.65+ | Pending Phase 6 |
| PostgreSQL | 16 | External standalone host — `172.16.12.226:5432` |
| Redis | 7.x | In-cluster StatefulSet |
| RabbitMQ | 3.13.x | In-cluster StatefulSet |
| ArgoCD | 2.11+ | Pending Phase 9 |
| calico | — | CNI, installed |
| coredns | — | DNS, installed |

---

## Multi-Tenant Architecture

All application services are tenant-aware. This table shows the isolation mechanism per layer:

| Layer | Mechanism | Tenant Scope |
|---|---|---|
| Network | Istio AuthorizationPolicy — JWT `tenant_id` claim | Per request |
| Auth | RS256 JWT — `X-Tenant-ID` header injected by Istio | Per request |
| Database | PostgreSQL schema-per-tenant (`tenant_a`, `tenant_b`, `tenant_c`) | Per connection |
| Cache | Redis key prefix `itsm:{tenant_slug}:*` | Per key |
| Queue | RabbitMQ exchange/queue prefix by tenant | Per message |
| Observability | `tenant.id` span attribute on every OTel span | Per trace |

**Tenants in dev:**
| Slug | Name | Admin user |
|---|---|---|
| `tenant_a` | GlobalTech | `alice.admin@globaltech.io` |
| `tenant_b` | StartupCo | `bob.agent@startupco.io` |
| `tenant_c` | FinCorp | seeded via `scripts/seed-data.sh` |

---

## Version Bump Guide

### Bumping a service version

1. Make and test changes in `services/<service>/`
2. Update `services/<service>/VERSION` → new semver (e.g. `0.3.0`)
3. Add entry to `services/<service>/CHANGELOG.md` under `## [Unreleased]` → `## [0.3.0] - YYYY-MM-DD`
4. Update `VERSIONS.md` table above
5. Build and push:
   ```bash
   cd services/<service>
   docker build -t preet2fun/<service>:v0.3.0 .
   docker push preet2fun/<service>:v0.3.0
   ```
6. Update `infra/helm/itsm-app/values.yaml` → `image.tag: "v0.3.0"` for that service
7. `helm upgrade --install itsm-app ./infra/helm/itsm-app -f infra/helm/itsm-app/values.yaml -n itsm-dev`
8. Run E2E acceptance test
9. Commit: `git commit -m "feat(user-service): v0.3.0 — RS256 JWT migration"`

### Bumping the platform release

After a phase or sprint completes E2E on K8s:

1. Update `VERSIONS.md` → platform release line at top
2. Update `infra/helm/itsm-app/Chart.yaml` → `appVersion: "v<X.Y.Z>"`
3. Add entry to `docs/CHANGELOG.md`
4. Tag:
   ```bash
   git tag v0.6.0 -m "Phase 6: Istio + OPA — multi-tenant zero-trust networking"
   git push origin v0.6.0
   ```

### Bumping the Helm chart

Bump `Chart.yaml` → `version` when chart templates change (new resource, changed structure).
Bump `appVersion` when the platform release changes.
Add entry to `infra/helm/itsm-app/CHANGELOG.md`.

# Customer App — Build Roadmap (working checklist)

> **This file is a companion view, not the source of truth.** Task-by-task
> status lives in the GitHub Project ("Synap Roadmap") per root
> `CLAUDE.md` §11 — every phase below links to its issue there. Check things
> off **in both places** as we finish them: tick the box here, and move the
> issue to Done on the board. If this file and the board ever disagree,
> the board wins.
>
> Scope: this covers `customer-app/` only — end-to-end through a live,
> observable, multi-tenant working sample on the kubeadm cluster. AI-engine
> RCA work and platform-app's own identity/OPA threads are tracked
> separately and intentionally left off this list.

Last synced: 2026-09-10

---

## Phase 0 — Foundations (DONE, already on `main`)

- [x] 4 services with real CRUD + health checks + OTel instrumentation
      (order-Go, catalog-Python, delivery-Java, payment-Java)
- [x] DB migrations: `customer_tenants` registry + `create_customer_tenant_schema()`
- [x] Seed SQL for `customer_a`/`customer_b`/`customer_c`
- [x] Helm chart: full templates for all 4 services + Redis
- [x] Istio dev/qa manifests: `AuthorizationPolicy` (intra-namespace), `DestinationRule`, `PeerAuthentication` (mTLS)
- [x] CI: `ci-build.yml` / `ci-lint.yml` per-service jobs for all 4 services

No action needed here — verified present and committed. Everything below is
what's actually left.

---

## Phase 1 — Deploy the existing backend to the live cluster
**GitHub: [#34](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/34), [#27](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/27)**

- [x] Write `customer-app/docs/deployment-guide.md` (prereqs, ordered steps, expected output, verification, rollback, troubleshooting, acceptance checklist — per root CLAUDE.md §9). Speced in the 2026-08-20 completion design but never written until now — verified against actual code/Helm values, not the old plan's proposal.
- [x] Pre-deploy resource-budget check (Step 0) — 3 nodes confirmed (1 control-plane + 2 workers, ~4vCPU/~3.85Gi each, matches CLAUDE.md §4). Workers at ~18-20% memory request / ~51% memory limit committed today. Request-level headroom is comfortable; limit-level (worst-case HPA-maxed burst, ~3.25Gi) is tight but not blocking. **Metrics-server is NOT installed** (`kubectl top nodes` fails) — HPA can't actually scale yet, decision deferred to right before Step 5/helm install.
- [x] Run `customer-app/scripts/run-migrations.sh` against the live `DATABASE_URL` — done 2026-09-10, both migrations applied clean (`customer_tenants` table + `create_customer_tenant_schema()` verified)
- [x] Run `customer-app/scripts/create-customer-tenants.sh SEED=true` — closes #27. Done 2026-09-10: all 3 tenants registered + schemas created + seeded, counts verified independently (customer_a 2/4/4/3/4, customer_b 1/3/2/1/2, customer_c 1/1/1/1/1 — restaurants/menu_items/orders/deliveries/payments)
- [x] Create `customer-app-secrets` in `customer-app-dev` namespace (Step 3) — done 2026-09-10, both keys verified by byte count
- [x] Build + push images for all 4 services (Step 4) — done 2026-09-10 on the k8s server; all 4 confirmed live on Docker Hub (`preet2fun/{order,catalog,delivery,payment}-service:v0.1.0`). delivery-service's first build attempt silently failed mid-loop (no `set -e`), rebuilt standalone successfully on retry — transient, not structural.
- [x] metrics-server installed (was missing — needed `--kubelet-insecure-tls` patch for kubeadm's self-signed kubelet certs). `kubectl top nodes` confirmed working 2026-09-10: workers at 29-30% actual memory usage, comfortable headroom for this deploy.
- [x] `helm install` the chart into `customer-app-dev` (Step 5) — done 2026-09-10. Surfaced 3 real bugs, all fixed + committed (`d6d771e`, `7afea6b`) and documented in the deployment guide as "Known fixed issue #1/#2/#3":
  - **#1 `CreateContainerConfigError`** — `runAsNonRoot` + non-numeric Alpine `nonroot` user. Fixed: Dockerfiles pin UID/GID 65532, templates set `runAsUser: 65532`, tags bumped to `v0.1.1`.
  - **#2 CrashLoopBackOff, exit 137** — Spring Boot + OTel javaagent take ~100s to bind on the 300m CPU limit; liveness SIGKILLed them at ~90s. Fixed: added `startupProbe` (300s grace) + `timeoutSeconds: 3` to both Java services.
  - **#3 OTel agent config crash** — `global.otelCollectorEndpoint` had no `http://` scheme (Java agent rejects schemeless). Fixed in `values.yaml` + `values-qa.yaml`.
- [x] Verify: all 5 pods `1/1 Running` 0 restarts, HPA `min=1`/`max=2` ×4, tenant isolation holds — done 2026-09-10. Health OK on all 4; `customer_a`=2 restaurants / `customer_c`=1; `customer_a`=4 orders. Note: Services expose `port: 80` (not the container port) — deployment guide Step 7 corrected. Note: `svc/order-service 8081:8080` fails; use `8081:80`.

**Phase 1 DONE — move #34 and #27 to Done on the board.**

---

## Phase 2 — Multi-tenant isolation smoke test
**GitHub: [#35](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/35)**

- [x] Documented test script — `customer-app/scripts/tenant-isolation-smoke-test.sh` (read-only; list-scoping + direct-id 404 + empty-query checks across all 4 services, with a `customer_b` positive control). Written up in `customer-app/docs/tenant-isolation-evidence.md`.
- [x] Run against live `customer-app-dev` 2026-09-10 — **22/22 passed**, output captured in `customer-app/docs/tenant-isolation-evidence.md`.

**Phase 2 DONE — move #35 to Done on the board.**

---

## Phase 3 — Istio ingress + JWT authn wiring
**GitHub: [#49](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/49)**

Today nothing outside the `customer-app-{dev,qa}` namespace can reach these
services — there's no path in for a browser, curl, or the future frontend.

- [ ] `RequestAuthentication` pointing at user-service's JWKS endpoint (shared identity issuer)
- [ ] `Gateway` + `VirtualService` for customer-app routes (dev + qa)
- [ ] Verify: a valid shared-identity JWT (tenant_id = a `customer_tenants` slug) reaches order-service through the mesh with `X-Tenant-ID`/`X-User-Role` correctly injected

---

## Phase 4 — OPA Rego RBAC policy for customer-app
**GitHub: [#50](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/50)**

- [ ] Rego rules: role + HTTP method + path, mirroring platform-app's `infra/k8s/opa/` pattern
- [ ] Policy test file (mirror platform-app's `authz_test.rego` precedent)
- [ ] Verify live: a valid JWT with a role lacking permission is denied by OPA, not the service

---

## Phase 5 — UI design draft (Claude Design)
**GitHub: [#45](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/45)**

Per root CLAUDE.md §10: customer-app is a clean greenfield frontend — stack,
routing, and state approach get decided as part of this task.

- [ ] Decide frontend stack
- [ ] Draft first screen in Claude Design (e.g. restaurant/menu browsing)
- [ ] Get design approved before writing implementation code

---

## Phase 6 — Build the first screen
**GitHub: [#45](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/45) (same issue as Phase 5 — draft + build is one task)**

- [ ] Scaffold the frontend project
- [ ] Build the first screen to match the approved design draft
- [ ] Verify live in a browser against the Phase-1/3 deployed backend
- [ ] **Stop here and check in** — further screens become their own tasks once this lands, not created speculatively now (matches #45's own scope note and root CLAUDE.md §11's "one roadmap task at a time")

---

## Phase 7 — Observability wiring
**GitHub: [#40](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/40), [#37](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/37), [#38](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/38), [#39](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/39)**

- [ ] Platform-app's observability stack (OTel Collector + Prometheus + Loki + Jaeger + Grafana) actually deployed live — currently `#40` is still Todo, and everything else here depends on it existing
- [ ] Manual OTel business spans for `delivery-service`/`payment-service` (Java) — currently auto-instrumentation only
- [ ] `tenant.id` span attribute on all 4 customer-app services
- [ ] Confirm customer-app's OTel Collector export target actually reaches platform-app's stack, tagged for tenant-wise segregation

---

## Phase 8 — CI/CD completion
**GitHub: [#51](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/51)**

- [ ] `ci-docker-push.yml` per-service matrix for all 4 customer-app services
- [ ] ArgoCD `Application` for `customer-app-dev` and `customer-app-qa`
- [ ] Verify: a merge to `main` builds+pushes images and ArgoCD syncs automatically

---

## Phase 9 — Capacity risk resolution
**GitHub: [#36](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/36)**

- [ ] Decide: add node RAM, lower Java service memory limits, or keep customer-app HPA `min=1`-only in dev
- [ ] Apply the decision to `values.yaml` and root `CLAUDE.md` §4
- [ ] Live-validate: delivery-service/payment-service pods survive real load without OOMKill

---

## Phase 10 — End-to-end demo validation
**GitHub: [#52](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/52)**

The actual point of the whole exercise — closing validation, not an early task.

- [ ] Full happy path live: shared-identity login → browse restaurant → place order → delivery → payment
- [ ] Traces/metrics/logs for that flow visible in platform-app's Jaeger/Grafana, tagged by tenant

---

## Explicitly out of scope for this list

- AI-engine RCA / SRE-track work (`ai-engine/CLAUDE.md` governs it, tracked as its own "LAST" items — #41, #42, #43)
- Platform-app's own OPA gap for `platform_admin`/`platform_analyst` (#48) — separate, currently sitting on an unmerged worktree branch (`worktree-platform-staff-opa-authz`)
- Disposition of legacy `tenant_a/b/c` platform data (#46) — undecided, unrelated to customer-app's own tenants
- Cross-tenant data browsing for platform staff (#47) — deferred platform-app design question

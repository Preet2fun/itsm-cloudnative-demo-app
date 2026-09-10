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
- [ ] Run `customer-app/scripts/run-migrations.sh` against the live `DATABASE_URL` — **runs on the k8s server**, see deployment-guide.md Step 1
- [ ] Run `customer-app/scripts/create-customer-tenants.sh SEED=true` (registers tenants + creates schemas + seeds data) — closes #27, see Step 2
- [ ] Pre-deploy resource-budget check (Step 0) — go/no-go against real headroom (`INFRA-INVENTORY.md`, not the stale table in root CLAUDE.md §4 — Java services are already at 256Mi/512Mi in `values.yaml`, higher than that table shows)
- [ ] Create `customer-app-secrets` in `customer-app-dev` namespace (Step 3)
- [ ] Build + push images for all 4 services — **on the k8s server**, per user's choice (Step 4; manual push is fine for this phase, automation is Phase 8)
- [ ] `helm install` the chart into `customer-app-dev` (Step 5)
- [ ] Verify: all 4 services + Redis pods `Running`, `kubectl get hpa` shows `min=1`/`max=2`, tenant isolation holds (customer_a=2 restaurants, customer_c=1) — Steps 6-7

---

## Phase 2 — Multi-tenant isolation smoke test
**GitHub: [#35](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/35)**

- [ ] Documented test script: `customer_a` requests must never see `customer_b`'s restaurants/orders/deliveries/payments
- [ ] Run it against the live Phase-1 deployment, capture the output as evidence

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

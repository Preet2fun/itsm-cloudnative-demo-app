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

Last synced: 2026-09-17

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

- [x] `RequestAuthentication` pointing at user-service's JWKS endpoint (shared identity issuer) — live in `customer-app-dev`, 2026-09-11. **Had to be switched from `jwksUri` to a static inline `jwks` on 2026-09-17** — istiod can't fetch a `jwksUri` behind `STRICT` mTLS (see `docs/tenant-isolation-evidence.md`'s "Phase 3 re-run" section for the full root-cause writeup). This also fixed the same bug on platform-app's own `itsm-jwt-auth`.
- [x] `Gateway` + `VirtualService` for customer-app routes (dev + qa) — bound to the existing shared `itsm-dev/itsm-gateway` (no new Gateway needed); dev applied and verified live, qa is manifests-only parity (no `customer-app-qa` namespace yet).
- [x] Verify: a valid shared-identity JWT (tenant_id = a `customer_tenants` slug) reaches order-service through the mesh with `X-Tenant-ID`/`X-User-Role` correctly injected — verified live 2026-09-17 (403/401/200 + header-spoof-defense curls, plus `tenant-isolation-smoke-test.sh` at 25/25).

**Phase 3 functionally DONE — #49 not yet moved to Done on the board (left for repo owner).**

---

## Phase 4 — OPA Rego RBAC policy for customer-app
**GitHub: [#50](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/50)**

- [x] Rego rules: role + HTTP method + path, mirroring platform-app's `infra/k8s/opa/` pattern — **no new allow rules needed**: the existing unscoped `allow if { role == "admin" }` already covered customer-app's admin users. Extracted the policy into a standalone, testable `platform-app/infra/k8s/opa/authz.rego` (no such file existed on `main`), kept byte-for-byte in sync with `policy-configmap.yaml`. Two real bugs found + fixed live along the way (both affecting platform-app's own already-deployed policy too, not just customer-app): (1) OPA's `ext_authz` check runs *before* `jwt_authn` in Istio's filter chain, so the old `x-user-role` header read was always empty — fixed by reading the role from the JWT directly; (2) an automated security review correctly flagged the first fix's unverified JWT decode as HIGH severity — upgraded to `io.jwt.decode_verify` with the same pinned public key used in Phase 3's JWKS fix. Full writeup: `docs/superpowers/specs/2026-09-17-customer-app-opa-rbac-design.md`.
- [x] Policy test file — `platform-app/infra/k8s/opa/authz_test.rego`, 27 tests (platform-app regression + customer-app + JWT-verification-specific cases including a tampered-signature rejection test), all passing.
- [x] Verify live: a valid JWT with a role lacking permission is denied by OPA, not the service — verified live 2026-09-17: `role: viewer` JWT → `403` from OPA on `/api/v1/restaurants` (confirmed via OPA's own decision log, `"result":false`); existing `role: admin` JWTs for both tenants unaffected (`200`); full `tenant-isolation-smoke-test.sh` 25/25 after (one assertion updated: garbage token now correctly gets `403` from OPA instead of `401` from jwt_authn, since OPA runs first — still denied, just by a different layer).

**Phase 4 DONE — #50 not yet moved to Done on the board (repo owner's call, per project policy on GitHub actions).**

---

## Phase 5 — UI design draft (Claude Design)
**GitHub: [#45](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/45)**

Per root CLAUDE.md §10: customer-app is a clean greenfield frontend — stack,
routing, and state approach get decided as part of this task.

- [x] Decide frontend stack — Vite + React 18 + TypeScript, React Router,
      TanStack Query, Zustand, CSS-variable tokens. Confirmed in the design
      handoff bundle below; matches platform-app's own frontend stack.
- [x] Draft first screen in Claude Design — done via claude.ai/design
      (outside this session, per the repo owner's own account), not the
      in-session Claude Design canvas preview. Product named "Hearth"
      (working name — alternatives on the table: "Counterpane", "Mise").
      Bundle delivered to `customer-app/design_handoff/` — see
      `customer-app/design_handoff/CLAUDE.md` for the full index. Login +
      6-digit verify (this task's actual screen) is fully built and
      interaction-complete in `design_handoff/design_handoff_hearth/reference/Login.jsx`,
      plus three bonus screens ahead of schedule (Foundations, App shell,
      Dashboard) and four more specced-only for later phases (Orders, Menu,
      Deliveries, Payments).
- [x] Get design approved before writing implementation code — approved
      2026-09-17, including the one open design-system question it raised:
      the brief asked for a distinct "warm editorial hospitality" look, but
      the tool applied its pre-existing "Aurora" design system instead
      (dark, Synap's own visual sibling). **Kept Aurora as-is** — repo
      owner's explicit call. Two smaller open items carried into
      `design_handoff/CLAUDE.md` rather than blocking here: no settings
      screen yet (location open/closed isn't editable anywhere), and the
      product name is still not finalized (one-line change whenever
      decided).

**Phase 5 DONE — #45 not yet moved to Done on the board (repo owner's call,
per project policy on GitHub actions; #45 also covers Phase 6, so it likely
stays open until that lands too).**

---

## Phase 6 — Build the first screen
**GitHub: [#45](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/45) (same issue as Phase 5 — draft + build is one task)**

- [x] Scaffold the frontend project — `customer-app/services/frontend/`,
      Vite + React 18 + TypeScript, React Router, TanStack Query, Zustand,
      CSS Modules over the Aurora token layer ported verbatim from the
      design handoff. Mirrors platform-app's frontend conventions (same
      `src/pages` + `src/lib` layout, same tsconfig/eslint/vitest setup,
      `@/` path alias). `npm run build` / `type-check` / `lint` / `test` all
      clean; 7 tests passing.
- [x] Build the first screen to match the approved design draft — Login +
      6-digit verify (`src/pages/Login.tsx`, `LoginVerify.tsx`,
      shared `AuthLayout.tsx`), pixel-matched against
      `design_handoff/design_handoff_hearth/reference/Login.jsx`. Wired to
      the real `authApi` contract (`/api/v1/auth/login` →
      `/api/v1/auth/mfa/send` → `/api/v1/auth/mfa/verify`), session owned by
      a persisted Zustand store per the design handoff's state shape. Minor
      deliberate deviations from the mockup, both because the real backend
      doesn't back the mockup's copy: dropped the brand panel's fabricated
      demo stats (218 orders / 99.9% uptime — Northside Hospitality fixture
      data, not real) in favor of qualitative labels; dropped the "2
      attempts left" claim on a bad code (`user-service` doesn't track/report
      a remaining-attempts count) for a truthful generic retry message.
      Placeholder post-login landing (`Welcome.tsx`) added only to prove the
      flow end-to-end — explicitly not the real Dashboard, which is its own
      later phase.
- [x] Verify live in a browser against the Phase-1/3 deployed backend —
      2026-09-17, full flow run for real through the browser against
      `http://<node-ip>:30080` (dev-server proxy, see `.env.local.example`):
      real login (`owner@customer-a.example`) → real
      `/api/v1/auth/mfa/send` → dev-mode OTP pulled from
      `kubectl logs -n itsm-dev deploy/user-service` → real
      `/api/v1/auth/mfa/verify` → real 3-part JWT stored → landed
      authenticated on `/` → sign-out correctly cleared the session and
      returned to `/login`. Screenshots taken at each step. One credential
      snag hit and fixed along the way: the first password tried didn't
      match the live `owner@customer-a.example` row — re-ran
      `scripts/seed-customer-user.sh` with a fresh `SEED_PASSWORD` to reset
      it, not a bug in the new frontend or backend.
- [x] **Stop here and check in** — further screens become their own tasks
      once this lands, not created speculatively now (matches #45's own
      scope note and root CLAUDE.md §11's "one roadmap task at a time").
      Orders/Menu/Deliveries/Payments stay specced-only in
      `design_handoff/design_handoff_hearth/BUILD_PLAN.md` until each
      becomes its own phase.

**Phase 6 DONE — #45 not yet moved to Done on the board (repo owner's call,
per project policy on GitHub actions).**

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

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

- [x] Platform-app's observability stack deployed live in `itsm-dev` —
      OTel Collector (contrib, `open-telemetry/opentelemetry-collector`
      0.173.1), Jaeger (hand-rolled all-in-one, in-memory), Prometheus
      (`prometheus-community/prometheus` 29.30.0), Loki
      (`grafana/loki` 7.3.0, SingleBinary, ephemeral), Promtail
      (`grafana/promtail` 6.17.1), Grafana (`grafana/grafana` 10.5.15,
      auto-generated admin password, not committed to git). Two real
      live bugs hit and fixed during install: `otel-collector` was
      crash-looping (`1/2 CrashLoopBackOff`) because the custom
      `prometheus` exporter shared port 8888 with the chart's own
      internal self-telemetry metrics server — moved the app-metrics
      exporter to 8889. `loki-0` was crash-looping
      (`mkdir /var/loki: read-only file system`) because
      `persistence.enabled: false` does NOT make this chart fall back to
      an emptyDir automatically, contrary to assumption — added an
      explicit `singleBinary.extraVolumes`/`extraVolumeMounts` emptyDir.
      Also found `monitoring.lokiCanary.enabled: false` was a silent
      no-op (`lokiCanary` is top-level in this chart, not nested under
      `monitoring:`) — 3 unwanted canary pods were running despite the
      "disable"; fixed the key path and also disabled the
      chart-default-on `chunksCache`/`resultsCache` memcached
      sidecars (one was stuck `Pending` on insufficient memory, unused
      capacity we don't want). All verified live 2026-09-17/24: pods
      healthy (`2/2`/`3/3`), canary/caches confirmed gone, real
      tenant-tagged app metrics confirmed flowing through the fixed
      8889 port.
- [x] Manual OTel business spans added to `delivery-service` and
      `payment-service` — `@WithSpan` annotations
      (`opentelemetry-instrumentation-annotations` 2.31.1) on
      `DeliveryController`/`PaymentController`, spans named
      `customer.delivery.{list,create,get,update_status}` and
      `customer.payment.{list,create,get,update_status}`, matching the
      existing `customer.<service>.<operation>` convention from
      order-service/catalog-service. The OTel javaagent already
      attached via `-javaagent` does the actual span creation at
      runtime — no SDK wiring needed.
- [x] `tenant.id` span attribute on all 4 customer-app services —
      order-service/catalog-service already had it; delivery-service and
      payment-service now set it via `Span.current().setAttribute(...)`
      alongside each `@WithSpan`, reading the same
      `TenantContext.get()` both controllers already used for DB queries.
- [x] Confirmed customer-app's telemetry reaches platform-app's stack,
      tenant-segregated — live end-to-end verification 2026-09-24 via
      `scripts/tenant-isolation-smoke-test.sh` (customer_a/customer_b):
      **traces** — `customer.delivery.get/list` and
      `customer.payment.get/list` all present in Jaeger, each tagged
      `tenant.id = customer_a` or `customer_b` matching the real
      requester, never mixed up; **metrics** — real app-emitted metrics
      (`customer_catalog_cache_duration_seconds_{bucket,count,sum}`)
      confirmed queryable in Prometheus; **logs** — non-empty Loki query
      results for `{namespace="customer-app-dev", app="delivery-service"}`;
      **isolation** — zero `tenant.id` occurrences across 10 sampled
      `incident-service` (platform-app) traces, confirming no
      cross-tenant leakage into platform staff's own telemetry, per root
      `CLAUDE.md` §3's documented "absent claim = platform staff" model.
- [x] Rebuilt and redeployed `delivery-service`/`payment-service` at
      `v0.1.2` with the new spans — also found and fixed an unrelated,
      pre-existing `customer-app` Helm chart bug hit along the way: the
      `redis` StatefulSet's `volumeClaimTemplates` omitted
      `storageClassName` on purpose (to let Kubernetes resolve the
      cluster default on first creation), but Kubernetes persists that
      resolved value (`local-path`) into the live, now-immutable spec —
      every subsequent `helm upgrade` was asking the API server to
      revert it to unset and being correctly rejected
      (`helm history` shows this exact failure recurring since
      2026-09-10). Set `redis.persistence.storageClass: "local-path"`
      explicitly in `values.yaml` to match live state; release returned
      to `STATUS: deployed` on the next upgrade.
- [x] **Stop here and check in** — per root `CLAUDE.md` §11's "one
      roadmap task at a time," Phase 7 ends here. #40/#37/#38/#39 not
      moved on the GitHub Project board — repo owner's call, per
      established policy.

**Phase 7 DONE — #40/#37/#38/#39 not yet moved to Done on the board
(repo owner's call, per project policy on GitHub actions).**

---

## Phase 8 — CI/CD completion
**GitHub: [#51](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/51)**

Scope grew from the TODO's original one-liner once discovery showed neither
ArgoCD nor a real CI pipeline existed anywhere in the repo yet — full design
in `docs/superpowers/specs/2026-09-24-customer-app-cicd-gitops-design.md`,
plan in `docs/superpowers/plans/2026-09-24-customer-app-cicd-gitops.md`.
**Dev only, by explicit scope decision** — no live `customer-app-qa`
namespace or ArgoCD `Application`; placeholder structure only where the code
naturally wants one.

- [x] **ArgoCD core install** — `argo/argo-cd` chart v10.9.2, namespace
      `argocd`, via `platform-app/scripts/install-argocd.sh` +
      `platform-app/infra/argocd/install/values.yaml` (dex/notifications
      off, `applicationSet.replicas: 0`, `server.insecure: "true"`).
      Verified live: all ArgoCD pods `Running`, `kubectl api-resources`
      confirmed `applications.argoproj.io` / `apiVersion: argoproj.io/v1alpha1`
      before the Application manifest was written (not guessed).
- [x] **ArgoCD `Application` for `customer-app-dev`** —
      `platform-app/infra/argocd/apps/dev/customer-app.yaml`, auto-sync +
      self-heal + prune, source `customer-app/infra/helm/customer-app`.
      Verified live: `kubectl get application customer-app-dev` →
      `Synced`/`Healthy`.
- [x] **`ci-docker-push.yml` per-service matrix, all 4 customer-app
      services** — `.github/workflows/ci-docker-push.yml`, triggered on
      push to `main` under `customer-app/services/**`. Build+push job
      (matrix: order/catalog/delivery/payment-service) tags images
      `sha-<8 chars>`; second job installs a version-pinned,
      checksum-verified `yq` and commits the new tags into
      `customer-app/infra/helm/customer-app/values.yaml` with `[skip ci]`.
      Fixed along the way: Docker Hub login failure (stale
      `DOCKERHUB_TOKEN` secret — regenerated), unpinned/unverified `yq`
      download (pinned to `v4.44.3` + verified SHA256).
- [x] **End-to-end verification: real push → build+push → tag-bump →
      ArgoCD sync → live pods** — trivial commit to
      `customer-app/services/order-service/cmd/main.go` pushed to `main`.
      Confirmed live, in order:
      1. All 5 CI jobs succeeded (`gh run watch`) — 4 image builds/pushes
         + tag-bump commit `90dafe1` (`chore(customer-app): bump image
         tags to sha-5cf02a10 [skip ci]`).
      2. ArgoCD detected drift and auto-synced (`OutOfSync`/`Syncing` →
         `Synced`).
      3. Mid-sync, `application-controller` hit `CrashLoopBackOff`
         (OOMKilled, exit 137) — root-caused as under-sized memory limits
         given the controller caches all live cluster resources
         cluster-wide, not just this Application's own ~14 resources.
         Fixed in `platform-app/infra/argocd/install/values.yaml`
         (`controller.resources.limits.memory` 256Mi→512Mi). A second
         false start (bumped limit appeared not to take effect even after
         a manual pod delete) traced to `kubernetes-master`'s checkout
         never having been `git pull`ed after the local fix — not a
         Kubernetes/Helm bug. Confirmed fixed: controller stable at
         512Mi/256Mi limits, `1/1 Running`, 0 restarts.
      4. Transient `Synced`/`Degraded` (delivery-service/payment-service
         pods briefly `1/2 Running`) self-resolved — expected JVM+OTel
         javaagent startup latency (~90-110s), already documented in the
         chart's own values.yaml comment, not a new bug.
      5. Final state: `customer-app-dev` Application `Synced`/`Healthy`,
         all 4 services' pods `2/2 Running`, and a live
         `kubectl get pods -o jsonpath` image-reference check confirmed
         `order-service`, `catalog-service`, `delivery-service`,
         `payment-service` all running `preet2fun/<service>:sha-5cf02a10`
         — matching the tag CI generated, proving the full GitOps loop
         works end-to-end, not just stage-by-stage in isolation.
- [x] Bonus, ad hoc: ArgoCD UI browser access wired up
      (`platform-app/infra/k8s/istio/virtual-services/dev/argocd-routing.yaml`,
      mirroring the existing Grafana/Jaeger/Prometheus pattern) and
      documented in `INFRA-INVENTORY.md` §5, alongside the pre-existing
      three UIs' access steps.
- [x] **Stop here and check in** — per root `CLAUDE.md` §11's "one
      roadmap task at a time," Phase 8 ends here. Issue #51 not moved on
      the GitHub Project board — repo owner's call, per established
      policy.

**Phase 8 DONE — #51 not yet moved to Done on the board (repo owner's
call, per project policy on GitHub actions).**

---

## Phase 9 — Capacity risk resolution
**GitHub: [#36](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/36)**

Bounded task (brainstorming skill, no spec/plan needed — existing Helm
chart + existing `CLAUDE.md` section being modified).

- [x] **Decided: keep customer-app HPA `min=1`-only in dev** — checked
      current live headroom first (`kubectl top nodes` + `free -mh` on
      `kubernetes-master`), which showed real free memory on the two
      worker nodes had already dropped from ~5 GiB (2026-09-01 snapshot)
      to ~3.7 GiB since ArgoCD (Phase 8) + the observability stack
      (Phase 7) landed — worse than the risk note assumed, and the
      control-plane node itself down to ~600-900 MiB free. Rejected the
      other two options: adding node RAM is an infra change outside repo
      scope; lowering the Java services' memory limits would undo the
      Phase 7 OOM fix (128Mi/256Mi was proven too tight for
      delivery/payment-service and raised to 256Mi/512Mi for exactly that
      reason).
- [x] **Applied the decision** —
      `customer-app/infra/helm/customer-app/values.yaml`:
      `hpa.maxReplicas` 2→1 for all 4 services (order/catalog/delivery/
      payment), with an explanatory comment. Root `CLAUDE.md` §4: capacity
      risk note updated to record the resolution and reasoning, plus a
      dev-only exception noted on the "HPA min=1, max=2... never max=3+"
      rule; §12 open-issues line updated to "resolved for dev, open for
      QA/prod." `INFRA-INVENTORY.md` §1-§3 refreshed with today's live
      numbers (was a 24-day-stale 2026-09-01 snapshot).
- [x] **Live load-testing explicitly descoped by repo owner** — "we dont
      want to do 4th point as I am not doing perfromance for my this
      set up." No synthetic load generated. Since customer-app's HPA is
      now capped at its already-running footprint (1 replica per service,
      matching what's live in the cluster today), there is no scale-out
      event left to validate against — the cap itself is the mitigation.
- [x] **Confirmed live in cluster** — committed+pushed, ArgoCD's
      `customer-app` Application (namespace `argocd`, destination
      `customer-app-dev` — note: the Application's own name is
      `customer-app`, not `customer-app-dev`) auto-synced automatically,
      no manual `helm upgrade` needed. Live evidence:
      `kubectl get events -n argocd` showed `OperationStarted` →
      `Synced -> OutOfSync -> Synced` → `OperationCompleted... succeeded`,
      timestamped to the push. `kubectl get hpa -n customer-app-dev`
      confirmed all 4 services (`order-service-hpa`,
      `catalog-service-hpa`, `delivery-service-hpa`,
      `payment-service-hpa`) report `MAXPODS: 1`.
- [x] **Stop here and check in** — per root `CLAUDE.md` §11's "one
      roadmap task at a time," Phase 9 ends here. Issue #36 not moved on
      the GitHub Project board — repo owner's call, per established
      policy.

**Phase 9 DONE — #36 not yet moved to Done on the board (repo owner's
call, per project policy on GitHub actions).**

**Separate, unrelated finding surfaced during verification (not chased,
not part of this phase):** `argocd-repo-server` is showing real
instability — one replica (`argocd-repo-server-...-8kchz`) has 15
restarts in 7h21m with repeated readiness/liveness probe timeouts on
`:8084/healthz` and a `BackOff` event, and the second replica
(`...-t84lt`) has sat in `ContainerStatusUnknown` for 20h. ArgoCD synced
successfully despite this, so it isn't blocking anything today, but it's
worth keeping an eye on — possibly related to the same tight cluster
memory headroom this phase just documented. Logged as a new entry in
root `CLAUDE.md` §12.

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

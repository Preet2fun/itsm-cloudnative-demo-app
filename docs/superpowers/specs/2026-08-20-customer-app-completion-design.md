# Customer App Completion — Design

Status: **approved**, ready for implementation planning.

## 1. Context

`customer-app/` is a brand-new, separate multi-tenant demo app (simple
food-delivery domain) that exists purely to generate realistic, polyglot
telemetry for Platform App to observe (see
`docs/superpowers/specs/2026-08-15-platform-customer-app-split-notes.md` for
the full background). As of 2026-08-20 the repo split had produced:

- `order-service` (Go) — fully built, all 4 endpoints, `go build`/`vet`/`gofmt` clean
- `catalog-service` (Python/FastAPI) — fully built, all 6 endpoints, no cache
- `delivery-service` (Java/Spring Boot) — fully built, all 5 endpoints
- `payment-service` (Java) — README only, zero code
- `infra/helm/`, `infra/k8s/` — empty (`.gitkeep` only)
- `scripts/`, `docs/` — empty (`.gitkeep` only)
- DB migrations `000001`/`000002` already exist and define the full 5-table
  schema (`restaurants`, `menu_items`, `orders`, `deliveries`, `payments`),
  but the tenant-registration script doesn't exist yet
- Nothing committed to git, nothing deployed

This spec covers finishing all of the above **except** touching the live
Postgres instance or the live K8s cluster — this pass produces
reviewed-and-ready artifacts; live migration/deploy is a deliberate followup
requested separately by the user.

## 2. payment-service (Java)

Structural mirror of `delivery-service` — same Spring Boot 3.2.5 + raw JDBC
(no JPA/Hibernate) approach, for the same reason: keep the `search_path`-
per-connection tenant isolation pattern identical across Go/Python/Java
rather than fighting an ORM's connection management.

- `pom.xml` — same parent/deps as `delivery-service`'s (`spring-boot-starter-web`,
  `spring-boot-starter-jdbc`, `org.postgresql:postgresql` runtime), artifact
  `payment-service`.
- `config/DataSourceConfig.java` — byte-for-byte port of `delivery-service`'s:
  parses `DATABASE_URL` (`postgres://user:pass@host:port/db?sslmode=disable`)
  into a JDBC URL for HikariCP, `maximumPoolSize=10`.
- `tenant/TenantFilter.java` + `tenant/TenantContext.java` — direct port:
  same slug regex (`^[a-z][a-z0-9_]{0,62}$`), same `/api/v1/health` exemption,
  same `ThreadLocal` pattern.
- `payment/Payment.java` — record matching the `payments` table exactly:
  `id, orderId, amount (BigDecimal), status, paymentMethod, createdAt`. No
  `updatedAt` field — the table doesn't have that column (unlike
  `deliveries`/`orders`), so status transitions only ever touch `status`.
  `VALID_STATUSES = {"pending", "completed", "failed", "refunded"}` (matches
  the table's `CHECK` constraint).
- `payment/PaymentRepository.java` — raw-JDBC port of `DeliveryRepository`:
  `findByOrderId`, `findById`, `create`, `updateStatus`. Same
  `borrowTenantConnection` helper (validates slug, sets `search_path` on the
  borrowed connection).
- `payment/PaymentController.java` — port of `DeliveryController`'s shape:
  - `GET /api/v1/health`
  - `GET /api/v1/payments?orderId=` — list, matches `findByOrderId`
  - `POST /api/v1/payments` — create. Body: `{orderId, amount, paymentMethod}`.
    **Mock-processes synchronously on create** (no separate "authorize" step,
    keeping with "as simple as possible"): if `amount <= 0` → insert with
    `status='failed'`; otherwise insert with `status='completed'`. This is
    the one behavioral difference from `delivery-service` (which always
    starts a delivery at `status='assigned'` and lets a human move it along)
    — payments in a mock processor resolve immediately, there's no realistic
    external gateway to await.
  - `GET /api/v1/payments/{id}` — get by id
  - `PUT /api/v1/payments/{id}/status` — status transition only, restricted
    to `completed → refunded` (reject any other transition with 400).
    Since create already resolves synchronously to `completed`/`failed`
    (never `pending`), the only real post-create transition a mock processor
    needs to support is a refund; `pending` stays a valid enum value (the
    table's `CHECK` constraint and its `DEFAULT 'pending'` are unchanged)
    but is unreachable through this service's own logic — that's fine, it's
    schema headroom, not a code path that needs exercising. Mirrors
    `delivery-service`'s "status transitions only" simplicity but adds
    transition validation since payments have stricter real-world semantics
    (can't un-refund, can't un-fail).
- `PaymentServiceApplication.java` — port of `DeliveryServiceApplication`,
  excludes `DataSourceAutoConfiguration`.
- `src/main/resources/application.yml` — same shape as `delivery-service`'s,
  `PAYMENT_SERVICE_PORT` env var, service name `payment-service`.
- `Dockerfile` — same two-stage `maven:3.9-eclipse-temurin-21` builder →
  `eclipse-temurin:21-jre-alpine` runtime, OTel javaagent, non-root user.
  **One addition over `delivery-service`'s Dockerfile**: the `ENTRYPOINT`
  gets `-XX:MaxRAMPercentage=75.0` so the JVM heap sizes itself off the
  container's memory *limit* (256Mi) rather than the host's total RAM —
  mitigates (doesn't eliminate) the OOM risk flagged for the 128Mi/256Mi
  sizing decision below. `delivery-service`'s Dockerfile gets the same flag
  added retroactively for consistency, since it has the identical risk and
  wasn't shipped with it.
- `README.md` — replace the "not built yet" placeholder with the same shape
  as `delivery-service`'s (endpoints table, config table, local build
  instructions).

## 3. Redis wiring into catalog-service

Per the user's call, customer-app gets its **own dedicated Redis** (not
shared with Platform App's).

- `app/cache.py` — direct port of `asset-service/app/cache.py`, with the key
  format changed from `itsm:{tenant}:{resource}:{operation}:{hash}` to
  `customer:{tenant}:{resource}:{operation}:{hash}` (distinguishes the two
  apps' keys if they were ever inspected side-by-side, even though they're
  on separate Redis instances now — cheap insurance if the "dedicated"
  decision is ever revisited).
- `app/config.py` — add `redis_url: str` field (required, no default — same
  as `database_url`).
- `app/main.py` — add `cache.init_cache(settings.redis_url)` /
  `cache.close_cache()` to the startup/shutdown hooks, add
  `RedisInstrumentor().instrument()` at startup, both ported verbatim from
  `asset-service/app/main.py`.
- `app/router.py` — wire cache-aside into `list_restaurants` (cache_get
  before the DB call, cache_set after, TTL 60s — mirrors `list_assets`) and
  `cache_invalidate(tenant_id, "restaurants")` into `create_restaurant`
  (mirrors `create_asset`). `menu-items` endpoints are **not** cached —
  `asset-service` doesn't cache its nested sub-resources either
  (`get_asset_incidents` is uncached), so this keeps the two apps'
  caching scope consistent.
- `requirements.txt` — add `redis[asyncio]==5.0.4` and
  `opentelemetry-instrumentation-redis==0.48b0`, the exact pinned versions
  `asset-service` already uses.

`order-service` and `delivery-service` do **not** get caching — mirrors
Platform App's precedent exactly (only `asset-service` caches; `incident-service`
doesn't), and keeps scope minimal per the "as simple as possible" governing
principle for Customer App.

## 4. Migration tooling

**Tracking-table collision fix** (flagged, previously unaddressed): a new
`customer-app/scripts/run-migrations.sh` invokes:

```bash
migrate -path database/migrations \
  -database "${DATABASE_URL}&x-migrations-table=customer_app_schema_migrations" \
  up
```

This keeps customer-app's migration state in its own tracking table,
isolated from Platform App's default `schema_migrations` table on the same
Postgres instance — without splitting or modifying the shared `DATABASE_URL`
variable itself (stays a single connection string per CLAUDE.md's
non-negotiable rule). Mirrors the invocation style already documented in
`platform-app/docs/platform/deployment-guides/Phase_02_Database.md`.

## 5. Tenant creation script

`customer-app/scripts/create-customer-tenants.sh` — structural port of
`platform-app/scripts/create-tenants.sh`: same `DATABASE_URL`/`ENV` parsing,
same `TENANTS="${TENANTS:-customer_a customer_b customer_c}"` default, same
optional `SEED=true` flag, same final `SELECT ... FROM public.customer_tenants`
verification query.

**One correction versus the Platform App original**: neither
`create_tenant_schema()` nor `create_customer_tenant_schema()` actually
inserts a row into their respective registry table (`public.tenants` /
`public.customer_tenants`) — confirmed by reading both migration functions.
The Platform App script has this same gap silently (its final verification
query would return nothing today). This spec's script adds the missing step
explicitly, since it's needed for the script to do what its own migration
file's header comment says it does ("create `public.customer_tenants`
registry"):

```sql
INSERT INTO public.customer_tenants (name, slug)
VALUES ('${SLUG}', '${SLUG}')
ON CONFLICT (slug) DO NOTHING;
```
run immediately before `SELECT public.create_customer_tenant_schema('${SLUG}');`.
Fixing the equivalent gap in Platform App's own script is out of scope here
— flagged only, not touched.

## 6. Seed data

`customer-app/database/seeds/seed-customer-a.sql` (and `-b`, `-c`) — minimal,
matching the "prove multi-tenant isolation + generate believable telemetry"
purpose, not a realistic catalog:

- 2-3 restaurants per tenant, 3-4 menu items each
- 3-4 orders referencing those restaurants, mixed `status` values
- 1 delivery per non-cancelled order
- 1 payment per order (`completed` for delivered/out_for_delivery orders,
  `pending` for placed/preparing, `failed` for a cancelled one) — gives the
  deployment guide's verification step something to check across all 5
  tables and all 3 statuses' worth of behavior.

## 7. Helm chart

`customer-app/infra/helm/customer-app/` — single umbrella chart (per the
user's call), directly structured on `platform-app/infra/helm/itsm-app/`:

- `Chart.yaml`, `values.yaml` (env-agnostic defaults + `global.env: dev`,
  `global.namespace: customer-app-dev`, `global.imageRegistry`,
  `global.otelCollectorEndpoint: "otel-collector.itsm-dev:4317"` — the exact
  same short in-cluster DNS form (`service.namespace:port`, no
  `.svc.cluster.local` suffix) that `itsm-app`'s own `values.yaml` uses for
  its own pods, just crossing from `customer-app-dev` into `itsm-dev`, which
  resolves fine on a single cluster — confirms the design notes' "telemetry
  flows into Platform App's existing stack" decision), `values-qa.yaml`
  pointing at `otel-collector.itsm-qa:4317` for the qa variant.
- `templates/order-service/{deployment,service,hpa}.yaml`,
  `templates/catalog-service/{...}`, `templates/delivery-service/{...}`,
  `templates/payment-service/{...}` — each a direct template port of
  `itsm-app`'s `user-service` templates (same `{{- if .Values.X.enabled }}`
  guard, same `topologySpreadConstraints`, same
  `checksum/secret` rollout-trigger annotation, same
  `securityContext: readOnlyRootFilesystem/runAsNonRoot/runAsUser 65532`
  pattern for the Go/Python services; the two Java services' Dockerfiles
  already run as a `nonroot` user matching that same non-root posture).
- `templates/redis/{statefulset,service}.yaml` — direct port of `itsm-app`'s
  Redis StatefulSet+PVC (`redis:7-alpine`, AOF persistence, 1Gi PVC on
  `local-path`).
- Resource values:

  | Service | CPU req/limit | Mem req/limit | HPA |
  |---|---|---|---|
  | order-service | 100m/300m | 128Mi/256Mi | min1/max2, 70% CPU |
  | catalog-service | 100m/300m | 128Mi/256Mi | min1/max2, 70% CPU |
  | delivery-service | 100m/300m | 128Mi/256Mi | min1/max2, 70% CPU |
  | payment-service | 100m/300m | 128Mi/256Mi | min1/max2, 70% CPU |
  | redis (customer-app) | 50m/200m | 64Mi/256Mi | n/a (single StatefulSet replica) |

  The two Java rows use the same limits as the Go/Python rows per the user's
  explicit choice, accepting the OOM risk noted in §2 (mitigated, not
  eliminated, by `-XX:MaxRAMPercentage=75.0`).
- A `itsm-secrets`-equivalent K8s Secret (`customer-app-secrets`, created
  manually before `helm install`, same as Platform App's pattern) holding
  `database-url` and `redis-url` keys, referenced via `secretKeyRef` in each
  service's Deployment env.

## 8. K8s namespace

`customer-app/infra/k8s/namespaces/dev/namespace-customer-app-dev.yaml` (and
`qa/` variant) — single shared namespace per env, **not** one namespace per
tenant. This matches what Platform App actually deploys today (`itsm-dev`
single namespace, confirmed by reading its live namespace manifest and Helm
values) rather than `SYSTEM_PROMPT.md`'s aspirational per-tenant-namespace
text, which was never implemented. Tenant isolation for customer-app is
entirely via `X-Tenant-ID` header → `search_path` at the DB layer, which is
what all 4 services already implement in code — no K8s-level tenant
isolation needed. `istio-injection: enabled` label, matching `itsm-dev`'s.

No Istio `VirtualService`/`Gateway`/`RequestAuthentication` manifests are
in scope — customer-app isn't customer-facing (no public subdomain routing
needed); it's an internal signal generator. If/when it needs its own public
ingress, that's a separate future piece of work.

## 9. Resource budget

Worst-case (all 4 app services HPA-maxed at 2 replicas + 1 Redis pod), summed
from §7's table:

- Memory limit: `(256Mi × 2) × 4 + 256Mi` = **2304Mi (≈2.25Gi)**
- Memory request: `(128Mi × 2) × 4 + 64Mi` = **1088Mi (≈1.06Gi)**
- CPU limit: `(300m × 2) × 4 + 200m` = **2600m**
- CPU request: `(100m × 2) × 4 + 50m` = **850m**

This is documented in the deployment guide as a **pre-deploy check to run
live**, not verified against actual node allocatable capacity in this pass
(no live cluster access was used for this spec — this is arithmetic against
the values table only). The guide's prerequisites section will include
`kubectl describe nodes` and a manual go/no-go against whatever headroom
Platform App + AI Engine have already claimed.

## 10. CI

Extend the existing matrix-style jobs in `.github/workflows/ci-build.yml`,
`ci-lint.yml`, and `ci-docker-push.yml` (currently listing
`platform-app/services/<name>` entries per the 2026-08-15 split) with 4
more entries for `customer-app/services/{order,catalog,delivery,payment}-service`.
`ci-docker-push.yml` only runs its push step on merge to `main`, so this
doesn't push any images as a side effect of this work — it only takes effect
on the next merge, same as any other CI config change.

## 11. Documentation

- `customer-app/docs/deployment-guide.md` — following CLAUDE.md's required
  shape (prerequisites, ordered steps, expected output, verification
  queries/commands, rollback, troubleshooting, acceptance checklist).
  Covers: running `run-migrations.sh`, running `create-customer-tenants.sh`
  with `SEED=true`, creating `customer-app-secrets`, `helm install`, and the
  §9 resource-budget check as an explicit pre-deploy step.
- `customer-app/services/payment-service/README.md` — see §2.

## 12. Explicit non-goals for this pass

- No migrations run against the live Postgres.
- No `helm install`/`kubectl apply` against the live cluster.
- No end-to-end verification against real infrastructure.
- No changes to Platform App's own scripts/charts (the registry-insert gap
  noted in §5 is flagged, not fixed, in Platform App's copy).
- No Istio ingress/routing for customer-app (§8).
- No changes to `SYSTEM_PROMPT.md` or `CLAUDE.md` to reflect customer-app's
  existence — out of scope for this spec, belongs to whatever pass finally
  rewrites those for the three-project split (already flagged as not-yet-done
  in the 2026-08-15 notes).

All of the above are handed to the user as a deployment guide + reviewed
artifacts, per the user's explicit choice to stop short of touching live
infrastructure in this pass.

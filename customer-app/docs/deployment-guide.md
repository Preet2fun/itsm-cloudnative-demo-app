# Customer App — Deployment Guide (Phase 1: first live deploy to `customer-app-dev`)

Closes GitHub issues [#34](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/34)
(deploy to the live cluster) and [#27](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/27)
(create `customer_tenants` registry + seed 3 tenant schemas). This is the
deployment guide the 2026-08-20 completion design (§11) called for but never
wrote — everything below is verified against the actual code and Helm
values in the repo, not the original plan's proposal.

## Overview

Deploys all 4 customer-app services + a dedicated Redis to a new
`customer-app-dev` namespace on the live kubeadm cluster, for the first
time ever — nothing customer-app-related has touched the live cluster or
live Postgres before this.

| Service | Language | Port | Depends on |
|---|---|---|---|
| order-service | Go | 8080 | Postgres |
| catalog-service | Python | 8000 | Postgres, Redis |
| delivery-service | Java | 8080 | Postgres |
| payment-service | Java | 8080 | Postgres |
| redis | — | 6379 | — (dedicated to customer-app, no auth) |

All 4 services trust `X-Tenant-ID` from headers directly — there is no
JWT/Istio-authn layer wired up yet (that's Phase 3 of `customer-app/TODO.md`),
so every test call below sends the header manually, same as Platform App's
own Phase 4 guide did before its Istio phase landed.

**Known doc drift, not a blocker:** `catalog-service/README.md` still says
"No Redis cache yet" — that's stale. `app/cache.py` and the `redis_url`
config field both exist in code; the README just wasn't updated when the
completion pass wired it in.

---

## Prerequisites

| Tool | Check |
|---|---|
| kubectl (context = the kubeadm cluster, not any other cluster) | `kubectl get nodes` → 3 nodes |
| Helm 3.15+ | `helm version` |
| Docker + Docker Hub account (`preet2fun`) | `docker login` |
| `migrate` CLI (golang-migrate) | `migrate -version` |
| `psql` | `psql --version` |
| A default StorageClass exists on the cluster | `kubectl get storageclass` → some class marked `(default)` |
| Network reachability to Postgres | `psql -h 172.16.12.226 -p 5432 -U itsm -d itsm -c 'select 1;'` |

Run everything below from one machine that has all of the above — the repo
is polyglot but every script here is plain bash/SQL/Helm, nothing
language-specific to install beyond Docker itself.

```bash
export DATABASE_URL="postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable"
cd customer-app   # all commands below are relative to this directory
```

---

## Step 0 — Pre-deploy resource budget check

`values.yaml` already runs Java services (delivery/payment) at 256Mi/512Mi,
not the 128Mi/256Mi in root `CLAUDE.md` §4's table — that table is stale;
this is the real envelope being deployed. Worst case, all 4 services
HPA-maxed at 2 replicas + 1 Redis pod:

| | Request | Limit |
|---|---|---|
| Memory | ≈1.56Gi | ≈3.25Gi |
| CPU | 850m | 2600m |

```bash
kubectl describe nodes | grep -A 5 "Allocated resources"
kubectl top nodes
```

Compare against real headroom in `INFRA-INVENTORY.md` (not the static ~5Gi
figure in `CLAUDE.md` §4 — that number drifts). If it doesn't fit
comfortably alongside Platform App, **stop here** — this is exactly the
capacity risk tracked in
[#36](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/36)
(Phase 9 of the TODO list), and the fix (lower limits, add node RAM, or
force `maxReplicas: 1` in dev) belongs there, not as an improvised change
mid-deploy.

---

## Step 1 — Run database migrations

```bash
bash scripts/run-migrations.sh
```

Expected output ends with `==> Migrations complete.` This creates
`public.customer_tenants` and the `create_customer_tenant_schema()`
function, tracked in its own `customer_app_schema_migrations` table (kept
separate from Platform App's migration tracking on the same Postgres
instance).

Verify:
```bash
psql "$DATABASE_URL" -c "\dt public.customer_tenants"
psql "$DATABASE_URL" -c "SELECT proname FROM pg_proc WHERE proname = 'create_customer_tenant_schema';"
```

---

## Step 2 — Create tenant registry + seed data

```bash
SEED=true bash scripts/create-customer-tenants.sh
```

This registers `customer_a`/`customer_b`/`customer_c` in
`public.customer_tenants`, creates each tenant's schema (5 tables:
restaurants, menu_items, orders, deliveries, payments), and loads the seed
SQL for each — closes #27.

Verify:
```bash
psql "$DATABASE_URL" -c "SELECT slug FROM public.customer_tenants ORDER BY slug;"
# Expected: customer_a, customer_b, customer_c

psql "$DATABASE_URL" -c "SET search_path TO customer_a, public; SELECT count(*) FROM restaurants;"
# Expected: 2

psql "$DATABASE_URL" -c "SET search_path TO customer_c, public; SELECT count(*) FROM restaurants;"
# Expected: 1 (customer_c is the deliberately minimal tenant — used for the isolation check in Step 7)
```

---

## Step 3 — Create the K8s Secret

The chart expects a secret named `customer-app-secrets` with exactly two
keys (`database-url`, `redis-url` — confirmed against every service's
`deployment.yaml`; Redis itself has no auth configured):

```bash
kubectl create namespace customer-app-dev --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic customer-app-secrets \
  --from-literal=database-url="postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable" \
  --from-literal=redis-url="redis://redis:6379/0" \
  -n customer-app-dev

kubectl describe secret customer-app-secrets -n customer-app-dev
# Expected: Data section lists database-url and redis-url (values hidden)
```

---

## Step 4 — Build and push Docker images

Tags must match `infra/helm/customer-app/values.yaml` exactly — `order-service`
and `catalog-service` are `v0.1.0`, `delivery-service` and `payment-service`
are `v0.1.1` (bumped from `v0.1.0` after the `runAsNonRoot`/UID fix below;
`imagePullPolicy: IfNotPresent` means a same-tag rebuild won't actually get
pulled onto nodes that already cached the old image):

```bash
docker build -t preet2fun/order-service:v0.1.0 services/order-service/
docker push preet2fun/order-service:v0.1.0

docker build -t preet2fun/catalog-service:v0.1.0 services/catalog-service/
docker push preet2fun/catalog-service:v0.1.0

docker build -t preet2fun/delivery-service:v0.1.1 services/delivery-service/
docker push preet2fun/delivery-service:v0.1.1

docker build -t preet2fun/payment-service:v0.1.1 services/payment-service/
docker push preet2fun/payment-service:v0.1.1
```

If you bump a tag again in the future, update `values.yaml` to match before
`helm upgrade`, or the chart will keep referencing the old tag.

**Known fixed issue (2026-09-10, #1):** the original `delivery-service`/
`payment-service` Dockerfiles created their `nonroot` user via Alpine's
`adduser -S` with no fixed UID, which fails Kubernetes' `runAsNonRoot: true`
check (`cannot verify user is non-root`) the moment an explicit `runAsUser`
is set. Both Dockerfiles now pin UID/GID `65532` (matching the Go/Python
services' distroless convention), and both Helm templates now set
`runAsUser: 65532` to match.

**Known fixed issue (2026-09-10, #2):** with the UID fix in place the Java
containers still CrashLoopBackOff'd — exit code `137`, `describe` showing
`Killing … failed liveness probe` and readiness/liveness `connection refused`.
Cause: Spring Boot + the OTel javaagent take **~90–110s** to bind port 8080 on
a 300m CPU limit (`Started …Application in 71s`, `process running for 103s`),
but the liveness probe (`initialDelaySeconds: 30`, `periodSeconds: 20`,
`failureThreshold: 3`) SIGKILLs the container at ~90s — before it ever listens,
forever. Fixed by adding a **`startupProbe`** (`periodSeconds: 10`,
`failureThreshold: 30` → 300s boot grace) to both Java services in
`values.yaml` and their deployment templates; readiness/liveness now use
`initialDelaySeconds: 0` since the startupProbe holds them off until the app is
up, and all three probes get `timeoutSeconds: 3` (the 1s default flakes while
the JVM warms). Java-only — the Go/Python services start in 1–3s and are
untouched. *Optional follow-up:* raising the two Java services' CPU limit from
`300m` to `500m–1000m` cuts cold start to ~20–30s (CLAUDE.md §4 treats CPU as
the non-binding constraint); the startupProbe makes them stable either way.

**Known fixed issue (2026-09-10, #3):** the OTel Java agent logged
`ConfigurationException: OTLP endpoint must be a valid URL: otel-collector.itsm-dev:4317`
/ `MalformedURLException: unknown protocol` on every boot and exported **zero**
traces/metrics (agent fails open, so the app still ran). Cause: `values.yaml`
`global.otelCollectorEndpoint` had no URL scheme — the Go/Python SDKs tolerate
`host:port`, but the Java agent requires `http://` (or `https://`). Fixed to
`http://otel-collector.itsm-dev:4317` in `values.yaml` and
`http://otel-collector.itsm-qa:4317` in `values-qa.yaml` (plaintext http — the
collector has no in-cluster TLS).

---

## Step 5 — Deploy with Helm

```bash
helm upgrade --install customer-app infra/helm/customer-app \
  --namespace customer-app-dev \
  --create-namespace \
  -f infra/helm/customer-app/values.yaml
```

```bash
kubectl get pods -n customer-app-dev -w
```

**`delivery-service` / `payment-service` take ~2–3 min to reach `1/1`** — the
`startupProbe` is polling the still-booting JVM. `0/1 Running` with the restart
count at `0` during that window is expected; only a *climbing* restart count is
a problem (see Troubleshooting).

**If the upgrade fails on `StatefulSet "redis" is invalid: … updates to
statefulset spec … are forbidden`:** a chart change to `volumeClaimTemplates`
can't be applied in place. Either re-run with
`--set redis.persistence.storageClass=local-path` (renders the STS identical to
what's live, so Helm skips it), or do it once properly:
`kubectl delete statefulset redis -n customer-app-dev --cascade=orphan` (keeps
`redis-0` and its PVC running) then re-run the upgrade — Helm recreates the STS
and re-adopts the pod.

Expected final state (all `1/1 Running`):
```
NAME                                READY   STATUS    RESTARTS   AGE
order-service-xxx                  1/1     Running   0          ...
catalog-service-xxx                1/1     Running   0          ...
delivery-service-xxx               1/1     Running   0          ...
payment-service-xxx                1/1     Running   0          ...
redis-0                            1/1     Running   0          ...
```

---

## Step 6 — Verify K8s resources

```bash
kubectl get pods -n customer-app-dev
kubectl get svc -n customer-app-dev
kubectl get hpa -n customer-app-dev
# Expected: 4 HPAs, each minReplicas=1 maxReplicas=2 — never higher, per root CLAUDE.md §4
kubectl get pvc -n customer-app-dev
# Expected: redis-data-redis-0   Bound   ...   1Gi   <your cluster's default StorageClass>
```

The chart doesn't hardcode a StorageClass name — the PVC omits
`storageClassName` entirely so Kubernetes provisions from whatever's marked
`(default)` on the cluster.

---

## Step 7 — Test each service

```bash
kubectl port-forward -n customer-app-dev svc/order-service 8081:8080 &
kubectl port-forward -n customer-app-dev svc/catalog-service 8082:8000 &
kubectl port-forward -n customer-app-dev svc/delivery-service 8083:8080 &
kubectl port-forward -n customer-app-dev svc/payment-service 8084:8080 &
```

**catalog-service — restaurants + tenant isolation:**
```bash
curl -s http://localhost:8082/api/v1/health
# Expected: {"status":"ok","service":"catalog-service"}

curl -s http://localhost:8082/api/v1/restaurants -H "X-Tenant-ID: customer_a" | python3 -m json.tool
# Expected: total: 2 (Tandoor House, Pasta Corner)

curl -s http://localhost:8082/api/v1/restaurants -H "X-Tenant-ID: customer_c" | python3 -c "import sys,json; print('customer_c total:', json.load(sys.stdin)['total'])"
# Expected: 1 — tenant isolation confirmed

# Second identical call should be a Redis cache hit — check catalog-service logs
kubectl logs -n customer-app-dev -l app=catalog-service --tail=20 | grep -i cache
```

**order-service:**
```bash
curl -s http://localhost:8081/api/v1/health
# Expected: {"status":"ok","service":"order-service"}

curl -s http://localhost:8081/api/v1/orders -H "X-Tenant-ID: customer_a" | python3 -m json.tool
# Expected: 4 orders (delivered, out_for_delivery, preparing, cancelled)
```

**delivery-service:**
```bash
curl -s http://localhost:8083/api/v1/health
# Expected: {"status":"ok","service":"delivery-service"}

curl -s http://localhost:8081/api/v1/orders -H "X-Tenant-ID: customer_a" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['orders'][0]['id'])"
# copy an order id from above, then:
curl -s "http://localhost:8083/api/v1/deliveries?orderId=<order-id>" -H "X-Tenant-ID: customer_a" | python3 -m json.tool
```

**payment-service:**
```bash
curl -s http://localhost:8084/api/v1/health
# Expected: {"status":"ok","service":"payment-service"}

curl -s -X POST http://localhost:8084/api/v1/payments \
  -H "Content-Type: application/json" -H "X-Tenant-ID: customer_a" \
  -d '{"orderId":"00000000-0000-0000-0000-000000000000","amount":5.00,"paymentMethod":"mock"}'
# Expected: 500 (order FK doesn't exist) — this just proves the service and DB path work;
# use a real order_id from the order-service call above for a clean 201.
```

---

## Rollback

```bash
helm rollback customer-app -n customer-app-dev

# Or full teardown (does NOT touch Postgres data — migrations/tenants stay):
helm uninstall customer-app -n customer-app-dev
kubectl delete secret customer-app-secrets -n customer-app-dev
```

To also undo the DB side:
```bash
bash scripts/run-migrations.sh down 1   # repeat to roll back further
```

---

## Troubleshooting

### Any service `CrashLoopBackOff`
```bash
kubectl logs -n customer-app-dev -l app=<service-name> --previous
```
- `DATABASE_URL`/`database_url` missing → secret wasn't created before `helm install`, or key name mismatch
- `could not connect to server` → Postgres unreachable from the cluster; check `172.16.12.226` firewall/network path from a cluster node, not just your workstation
- catalog-service only: Redis connection errors are logged as warnings, not fatal (cache-aside degrades to always-MISS) — don't mistake this for a crash

### `delivery-service` / `payment-service` CrashLoopBackOff, exit `137`, ~90s cycle
**Not OOM** — an OOMKill shows `Reason: OOMKilled`; this shows `Reason: Error`
with `Exit Code: 137`, plus events `Killing … failed liveness probe`.
```bash
kubectl describe pod -n customer-app-dev <pod> | grep -A6 'Last State'
kubectl logs -n customer-app-dev <pod> --previous | grep -E 'Started .*Application|HikariPool'
```
The liveness probe is killing the JVM before it finishes starting. The chart
ships a `startupProbe` on both Java services (`values.yaml`
`deliveryService.startupProbe` / `paymentService.startupProbe`, 300s grace) to
prevent this — if it regressed, confirm those keys still exist and the
deployment templates still render a `startupProbe:` block
(`helm template … | grep -A4 startupProbe`). One-off live patch without a chart
change: `helm upgrade … --set deliveryService.livenessProbe.initialDelaySeconds=180 --set paymentService.livenessProbe.initialDelaySeconds=180`.

### `helm upgrade` fails: `StatefulSet "redis" is invalid … forbidden`
A chart change to redis's `volumeClaimTemplates` (e.g. `storageClassName`)
can't be applied to a live StatefulSet. Fix: `kubectl delete statefulset redis
-n customer-app-dev --cascade=orphan` (leaves `redis-0` + its PVC running),
then re-run the upgrade — Helm recreates the STS and re-adopts the pod, no data
loss. Or pin the live value: `--set redis.persistence.storageClass=local-path`.

### redis-0 `Pending`
```bash
kubectl describe pod redis-0 -n customer-app-dev
kubectl get pvc -n customer-app-dev
```
- PVC `Pending` → no StorageClass marked `(default)` on the cluster (`kubectl get storageclass`); mark one default or set `redis.persistence.storageClass` explicitly in `values.yaml`

### Traces not appearing anywhere
`values.yaml` points `OTEL_EXPORTER_OTLP_ENDPOINT` at
`http://otel-collector.itsm-dev:4317` — Platform App's observability stack. If
[#40](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/40) is
still open, that collector may not actually be running yet. This does not
block this deploy — OTLP export failures are non-fatal background retries,
not request-blocking. Tracked as Phase 7 of `customer-app/TODO.md`.

Check the Java pods for `OTLP endpoint must be a valid URL` /
`MalformedURLException: unknown protocol` at startup — that means the
`http://` scheme is missing from `global.otelCollectorEndpoint` (see "Known
fixed issue #3"); the agent then exports nothing at all. `kubectl logs -n
customer-app-dev <delivery-or-payment-pod> | grep -i otel` to confirm the
agent started clean (`opentelemetry-javaagent - version: …` with no
`ConfigurationException` after it).

### `helm install` succeeds but `kubectl get hpa` shows nothing
HPA requires the metrics-server to be running on the cluster — check
`kubectl get deployment metrics-server -n kube-system` (should already be
there from Platform App's setup).

---

## Acceptance Checklist

- [ ] `kubectl get pods -n customer-app-dev` — all 5 pods `1/1 Running`
- [ ] `delivery-service` / `payment-service` reached `1/1` within ~3 min and hold `RESTARTS 0` (startupProbe working, not liveness-killed)
- [ ] `kubectl get hpa -n customer-app-dev` — 4 HPAs, `min=1 max=2` each
- [ ] `kubectl get pvc -n customer-app-dev` — `redis-data-redis-0` Bound
- [ ] `GET /api/v1/health` returns `{"status":"ok",...}` on all 4 services
- [ ] `GET /api/v1/restaurants` with `X-Tenant-ID: customer_a` returns 2 restaurants
- [ ] `GET /api/v1/restaurants` with `X-Tenant-ID: customer_c` returns 1 restaurant (tenant isolation holds)
- [ ] `GET /api/v1/orders` with `X-Tenant-ID: customer_a` returns 4 orders
- [ ] A `POST /api/v1/payments` with a real `orderId` from customer_a returns 201
- [ ] Resource budget check (Step 0) was run and compared against real node headroom before deploying
- [ ] This guide itself exists and is accurate — closes the outstanding deliverable from the 2026-08-20 completion design §11

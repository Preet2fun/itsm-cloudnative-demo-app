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
| `local-path` StorageClass already installed (Platform App Phase 5 installs this) | `kubectl get storageclass` → `local-path (default)` |
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

```bash
for svc in order-service catalog-service delivery-service payment-service; do
  docker build -t preet2fun/${svc}:v0.1.0 services/${svc}/
  docker push preet2fun/${svc}:v0.1.0
done
```

This matches the tags already set in `infra/helm/customer-app/values.yaml`
(`v0.1.0` for all 4) — no `--set` image-tag overrides needed for this first
deploy. If you rebuild with the same tag later, `imagePullPolicy:
IfNotPresent` means running pods won't pick it up automatically — bump the
tag or `kubectl rollout restart deployment/<name> -n customer-app-dev`.

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
# Expected: redis-data-redis-0   Bound   ...   1Gi   local-path
```

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

### redis-0 `Pending`
```bash
kubectl describe pod redis-0 -n customer-app-dev
kubectl get pvc -n customer-app-dev
```
- PVC `Pending` → `local-path` StorageClass missing/not default; see Platform App's Phase 5 guide for install steps

### Traces not appearing anywhere
`values.yaml` points `OTEL_EXPORTER_OTLP_ENDPOINT` at
`otel-collector.itsm-dev:4317` — Platform App's observability stack. If
[#40](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/40) is
still open, that collector may not actually be running yet. This does not
block this deploy — OTLP export failures are non-fatal background retries,
not request-blocking. Tracked as Phase 7 of `customer-app/TODO.md`.

### `helm install` succeeds but `kubectl get hpa` shows nothing
HPA requires the metrics-server to be running on the cluster — check
`kubectl get deployment metrics-server -n kube-system` (should already be
there from Platform App's setup).

---

## Acceptance Checklist

- [ ] `kubectl get pods -n customer-app-dev` — all 5 pods `1/1 Running`
- [ ] `kubectl get hpa -n customer-app-dev` — 4 HPAs, `min=1 max=2` each
- [ ] `kubectl get pvc -n customer-app-dev` — `redis-data-redis-0` Bound
- [ ] `GET /api/v1/health` returns `{"status":"ok",...}` on all 4 services
- [ ] `GET /api/v1/restaurants` with `X-Tenant-ID: customer_a` returns 2 restaurants
- [ ] `GET /api/v1/restaurants` with `X-Tenant-ID: customer_c` returns 1 restaurant (tenant isolation holds)
- [ ] `GET /api/v1/orders` with `X-Tenant-ID: customer_a` returns 4 orders
- [ ] A `POST /api/v1/payments` with a real `orderId` from customer_a returns 201
- [ ] Resource budget check (Step 0) was run and compared against real node headroom before deploying
- [ ] This guide itself exists and is accurate — closes the outstanding deliverable from the 2026-08-20 completion design §11

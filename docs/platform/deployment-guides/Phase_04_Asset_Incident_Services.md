# Phase 4 Deployment Guide — Asset Service & Incident Service (Python)

## Overview

This phase deploys two Python/FastAPI microservices plus their required infrastructure:
- **Redis** (StatefulSet, 1Gi PVC) — asset list caching
- **RabbitMQ** (StatefulSet, 2Gi PVC) — incident event publishing
- **Asset Service** — CRUD for assets + Redis caching + GET /assets/{id}/incidents
- **Incident Service** — CRUD for incidents + RabbitMQ event publishing + SLA tracking

All services read `X-Tenant-ID` from headers (Istio-injected in Phase 6, manually sent for testing).
`search_path` is set per DB connection to isolate tenant data.

---

## Prerequisites

| Tool | Check |
|---|---|
| kubectl (cluster running) | `kubectl get nodes` |
| Helm 3.15+ | `helm version` |
| Docker + Docker Hub account | `docker login` |
| Phase 3 complete | `kubectl get pods -n itsm-dev -l app=user-service` → Running |
| local-path StorageClass installed | See Step 0 below |

---

## Step 0 — Install local-path StorageClass (one-time cluster setup)

```bash
# Install Rancher local-path-provisioner
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.26/deploy/local-path-storage.yaml

# Set as default StorageClass
kubectl patch storageclass local-path \
  -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'

# Verify
kubectl get storageclass
# Expected: local-path (default)   rancher.io/local-path   ...

kubectl get pods -n local-path-storage
# Expected: local-path-provisioner-xxx   1/1   Running
```

---

## Step 1 — Update the K8s Secret

The existing `itsm-secrets` must be extended with four new keys.
This command recreates it preserving the existing jwt-secret value:

```bash
JWT=$(kubectl get secret itsm-secrets -n itsm-dev \
  -o jsonpath='{.data.jwt-secret}' | base64 -d)

kubectl delete secret itsm-secrets -n itsm-dev

kubectl create secret generic itsm-secrets \
  --from-literal=database-url="postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable" \
  --from-literal=jwt-secret="${JWT}" \
  --from-literal=redis-url="redis://redis:6379/0" \
  --from-literal=rabbitmq-url="amqp://itsm:itsm@rabbitmq:5672/" \
  --from-literal=rabbitmq-user="itsm" \
  --from-literal=rabbitmq-password="itsm" \
  -n itsm-dev

# Verify all 6 keys exist
kubectl describe secret itsm-secrets -n itsm-dev
```

For QA (when needed):
```bash
kubectl create secret generic itsm-secrets \
  --from-literal=database-url="postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable" \
  --from-literal=jwt-secret="$(openssl rand -base64 48)" \
  --from-literal=redis-url="redis://redis:6379/0" \
  --from-literal=rabbitmq-url="amqp://itsm:itsm@rabbitmq:5672/" \
  --from-literal=rabbitmq-user="itsm" \
  --from-literal=rabbitmq-password="itsm" \
  -n itsm-qa
```

---

## Step 2 — Build and push Docker images

```bash
# Asset Service
cd services/asset-service
docker build -t preet2fun/asset-service:latest .
docker push preet2fun/asset-service:latest

# Incident Service
cd ../incident-service
docker build -t preet2fun/incident-service:latest .
docker push preet2fun/incident-service:latest
```

Verify images locally before pushing:
```bash
docker run --rm \
  -e DATABASE_URL="postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable" \
  -e REDIS_URL="redis://localhost:6379/0" \
  -p 8000:8000 \
  preet2fun/asset-service:latest &

curl -s http://localhost:8000/api/v1/health
# Expected: {"status":"ok","service":"asset-service"}
docker stop $(docker ps -q --filter ancestor=preet2fun/asset-service:latest)
```

---

## Step 3 — Deploy with Helm

```bash
# From repo root
helm upgrade --install itsm-app infra/helm/itsm-app \
  --namespace itsm-dev \
  --create-namespace \
  -f infra/helm/itsm-app/values.yaml \
  --set global.imageTag=latest
```

Watch everything come up:
```bash
kubectl get pods -n itsm-dev -w
```

Expected final state (all `1/1 Running`):
```
NAME                               READY   STATUS    RESTARTS   AGE
user-service-xxx                   1/1     Running   0          ...
asset-service-xxx                  1/1     Running   0          ...
incident-service-xxx               1/1     Running   0          ...
redis-0                            1/1     Running   0          ...
rabbitmq-0                         1/1     Running   0          ...
```

---

## Step 4 — Verify Redis and RabbitMQ

```bash
# Redis is accepting connections
kubectl exec -n itsm-dev redis-0 -- redis-cli ping
# Expected: PONG

# RabbitMQ management UI (port-forward)
kubectl port-forward -n itsm-dev svc/rabbitmq 15672:15672 &
# Open http://localhost:15672 — login: itsm / itsm

# Check PVCs are Bound
kubectl get pvc -n itsm-dev
# Expected:
# rabbitmq-data-rabbitmq-0   Bound   ...   2Gi    local-path
# redis-data-redis-0         Bound   ...   1Gi    local-path
```

---

## Step 5 — Test Asset Service

```bash
kubectl port-forward -n itsm-dev svc/asset-service 8001:80 &

# Health
curl -s http://localhost:8001/api/v1/health
# Expected: {"status":"ok","service":"asset-service"}

# List assets — tenant_a has 20 seeded assets
curl -s http://localhost:8001/api/v1/assets \
  -H "X-Tenant-ID: tenant_a" | python3 -m json.tool
# Expected: {"assets":[...],"total":20,"limit":20,"offset":0}

# Filter by type
curl -s "http://localhost:8001/api/v1/assets?asset_type=hardware" \
  -H "X-Tenant-ID: tenant_a" | python3 -c "import sys,json; d=json.load(sys.stdin); print('hardware assets:', d['total'])"

# Get single asset
curl -s http://localhost:8001/api/v1/assets/a2000001-0000-0000-0000-000000000001 \
  -H "X-Tenant-ID: tenant_a" | python3 -m json.tool

# Create asset
curl -s -X POST http://localhost:8001/api/v1/assets \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant_a" \
  -d '{"name":"Test Server","asset_type":"hardware","status":"active","location":"DC-Rack-C1"}' \
  | python3 -m json.tool
# Expected: 201 with new asset object

# Get incidents for an asset
curl -s http://localhost:8001/api/v1/assets/a2000001-0000-0000-0000-000000000001/incidents \
  -H "X-Tenant-ID: tenant_a" | python3 -m json.tool

# Tenant isolation — tenant_c has 5 assets
curl -s http://localhost:8001/api/v1/assets \
  -H "X-Tenant-ID: tenant_c" | python3 -c "import sys,json; d=json.load(sys.stdin); print('tenant_c assets:', d['total'])"
# Expected: 5
```

---

## Step 6 — Test Incident Service

```bash
kubectl port-forward -n itsm-dev svc/incident-service 8002:80 &

# Health
curl -s http://localhost:8002/api/v1/health
# Expected: {"status":"ok","service":"incident-service"}

# List incidents — tenant_a has 15 seeded
curl -s http://localhost:8002/api/v1/incidents \
  -H "X-Tenant-ID: tenant_a" | python3 -c "import sys,json; d=json.load(sys.stdin); print('total:', d['total'])"
# Expected: 15

# Filter by priority
curl -s "http://localhost:8002/api/v1/incidents?priority=P1" \
  -H "X-Tenant-ID: tenant_a" | python3 -m json.tool

# Create incident — triggers RabbitMQ publish
INCIDENT=$(curl -s -X POST http://localhost:8002/api/v1/incidents \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant_a" \
  -d '{"title":"Test P2 incident","description":"Created via Phase 4 test","priority":"P2"}' \
  | python3 -m json.tool)
echo "$INCIDENT"
# Expected: 201 with incident object including sla_breach_at

INCIDENT_ID=$(echo "$INCIDENT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")

# Add event
curl -s -X POST http://localhost:8002/api/v1/incidents/${INCIDENT_ID}/events \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant_a" \
  -d '{"event_type":"comment","payload":{"note":"Investigating"},"actor_id":"a1000001-0000-0000-0000-000000000001"}' \
  | python3 -m json.tool

# Assign incident
curl -s -X POST http://localhost:8002/api/v1/incidents/${INCIDENT_ID}/assign \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant_a" \
  -d '{"assigned_to":"a1000001-0000-0000-0000-000000000003"}' \
  | python3 -m json.tool
# Expected: status changes to "in_progress"

# Resolve incident
curl -s -X POST http://localhost:8002/api/v1/incidents/${INCIDENT_ID}/resolve \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant_a" \
  -d '{"resolution_notes":"Issue resolved"}' \
  | python3 -m json.tool
# Expected: status="resolved", resolved_at set

# Get event history
curl -s http://localhost:8002/api/v1/incidents/${INCIDENT_ID}/events \
  -H "X-Tenant-ID: tenant_a" | python3 -m json.tool
```

---

## Step 7 — Verify RabbitMQ received events

After creating/resolving incidents above, check RabbitMQ:

```bash
# Via management UI at http://localhost:15672
# Queues → check itsm.incidents exchange has messages

# Or via CLI
kubectl exec -n itsm-dev rabbitmq-0 -- \
  rabbitmqctl list_exchanges name type durable
# Expected: itsm.incidents   topic   true
```

---

## Step 8 — Verify all K8s resources

```bash
kubectl get pods -n itsm-dev
kubectl get svc -n itsm-dev
kubectl get hpa -n itsm-dev
kubectl get pvc -n itsm-dev
kubectl get statefulset -n itsm-dev
```

---

## Rollback

```bash
helm rollback itsm-app -n itsm-dev

# Or uninstall
helm uninstall itsm-app -n itsm-dev
```

---

## Troubleshooting

### asset-service CrashLoopBackOff
```bash
kubectl logs -n itsm-dev -l app=asset-service --previous
```
- `database_url field required` → Secret missing `database-url` key
- `redis_url field required` → Secret missing `redis-url` key
- `could not connect to server` → DB unreachable; check `172.16.12.226` firewall

### incident-service CrashLoopBackOff
```bash
kubectl logs -n itsm-dev -l app=incident-service --previous
```
- `rabbitmq_url field required` → Secret missing `rabbitmq-url` key
- `aio_pika...connection refused` → RabbitMQ pod not yet ready; incident-service will retry

### redis-0 or rabbitmq-0 Pending
```bash
kubectl describe pod redis-0 -n itsm-dev
kubectl get pvc -n itsm-dev
```
- PVC stuck in `Pending` → local-path-provisioner not running; re-run Step 0
- `no nodes available` → cluster resources exhausted; check `kubectl top nodes`

### RabbitMQ authentication error
- Confirm secret has both `rabbitmq-user` and `rabbitmq-password` keys
- Confirm values match what was set when the pod first started (RabbitMQ stores credentials in the PVC on first boot)

### Redis cache not working (cache always MISS)
- Check Redis pod is Running: `kubectl get pods -n itsm-dev -l app=redis`
- Verify `redis-url` secret key resolves: `redis://redis:6379/0` (DNS: service name `redis` in same namespace)

---

## Acceptance Checklist

- [ ] `kubectl get pods -n itsm-dev` — all 5 pods `1/1 Running`
- [ ] `kubectl get pvc -n itsm-dev` — both PVCs `Bound`
- [ ] `GET /api/v1/health` on asset-service returns `{"status":"ok"}`
- [ ] `GET /api/v1/health` on incident-service returns `{"status":"ok"}`
- [ ] `GET /api/v1/assets` with `X-Tenant-ID: tenant_a` returns 20 assets
- [ ] `GET /api/v1/assets` with `X-Tenant-ID: tenant_c` returns 5 assets (tenant isolation)
- [ ] Second `GET /api/v1/assets` call is served from Redis cache (check asset-service logs)
- [ ] `GET /api/v1/incidents` with `X-Tenant-ID: tenant_a` returns 15 incidents
- [ ] Create incident → RabbitMQ exchange `itsm.incidents` shows message
- [ ] Resolve incident → `resolved_at` is set, `status = "resolved"`
- [ ] `kubectl get hpa -n itsm-dev` shows asset-service-hpa and incident-service-hpa

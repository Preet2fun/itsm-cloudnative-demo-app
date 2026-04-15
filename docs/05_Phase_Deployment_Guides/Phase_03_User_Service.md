# Phase 3 Deployment Guide — User Service (Go)

## Overview

This phase builds and deploys the User Service — the only service that **issues JWTs**.
All other services consume the `X-Tenant-ID` and `X-User-Role` headers that Istio injects
from the validated JWT (Phase 6). Until Istio is configured, you send these headers manually
when testing.

```
Client ──POST /api/v1/auth/login──▶ User Service ──▶ PostgreSQL (tenant_<slug>.users)
                                          │
                                          └──▶ Issues HS256 JWT
                                          └──▶ JWKS endpoint (Phase 6 — Istio)
```

---

## Prerequisites

| Tool | Check |
|---|---|
| Go 1.22+ | `go version` |
| Docker | `docker version` |
| kubectl (kubeadm cluster running) | `kubectl get nodes` |
| Helm 3.15+ | `helm version` |
| Phase 2 complete | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM public.tenants"` → 3 rows |

---

## Step 1 — Fetch Go dependencies

```bash
cd services/user-service
go mod tidy
go mod download
```

Expected: `go.sum` is created. No errors.

---

## Step 2 — Build and verify locally

```bash
cd services/user-service

# Set required env vars for local test
export DATABASE_URL="postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable"
export JWT_SECRET="local-dev-secret-change-in-qa"
export ENV=dev

# Build
go build ./...

# Run
go run ./cmd &
SERVICE_PID=$!

# Health check
curl -s http://localhost:8080/api/v1/health
# Expected: {"status":"ok","service":"user-service"}

# JWKS endpoint
curl -s http://localhost:8080/api/v1/.well-known/jwks.json | python3 -m json.tool
# Expected: {"keys":[{"kty":"oct","use":"sig","kid":"itsm-hs256-v1","alg":"HS256","k":"..."}]}

kill $SERVICE_PID
```

---

## Step 3 — Test the API end-to-end

```bash
export DATABASE_URL="postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable"
export JWT_SECRET="local-dev-secret-change-in-qa"
go run ./cmd &

# Login (seed user from Phase 2)
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice.admin@globaltech.io","password":"Password1!","tenant_slug":"tenant_a"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "JWT: ${TOKEN}"

# List users — manually send X-Tenant-ID (Istio does this in Phase 6)
curl -s http://localhost:8080/api/v1/users \
  -H "X-Tenant-ID: tenant_a" \
  -H "X-User-Role: admin" \
  | python3 -m json.tool
# Expected: {"users":[...],"total":10,...}

# Get single user
curl -s http://localhost:8080/api/v1/users/a1000001-0000-0000-0000-000000000001 \
  -H "X-Tenant-ID: tenant_a" | python3 -m json.tool

# Refresh token
curl -s -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Authorization: Bearer ${TOKEN}" | python3 -m json.tool

# Create a new user
curl -s -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant_a" \
  -H "X-User-Role: admin" \
  -d '{"email":"test.user@globaltech.io","password":"TestPass1!","full_name":"Test User","role":"viewer"}' \
  | python3 -m json.tool
# Expected: 201 with new user object

# Internal endpoint (used by Notification Service in Phase 5)
curl -s "http://localhost:8080/internal/users/a1000001-0000-0000-0000-000000000001?tenant_slug=tenant_a" \
  | python3 -m json.tool

kill $SERVICE_PID
```

---

## Step 4 — Build Docker image

```bash
cd services/user-service

# Replace <registry> with your container registry (e.g. ghcr.io/your-org)
docker build -t <registry>/itsm/user-service:latest .

# Verify it runs
docker run --rm \
  -e DATABASE_URL="postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable" \
  -e JWT_SECRET="local-dev-test" \
  -e ENV=dev \
  -p 8080:8080 \
  <registry>/itsm/user-service:latest &

curl -s http://localhost:8080/api/v1/health
docker stop $(docker ps -q --filter ancestor=<registry>/itsm/user-service:latest)

# Push to registry
docker push <registry>/itsm/user-service:latest
```

---

## Step 5 — Create the K8s Secret

Secrets are **never stored in git**. Create them directly in the cluster:

```bash
# Replace values with your actual DATABASE_URL and a strong JWT_SECRET
kubectl create secret generic itsm-secrets \
  --from-literal=database-url="postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable" \
  --from-literal=jwt-secret="$(openssl rand -base64 48)" \
  -n itsm-dev

# Verify (values are base64-encoded — that's expected)
kubectl get secret itsm-secrets -n itsm-dev -o yaml
```

For QA:
```bash
kubectl create secret generic itsm-secrets \
  --from-literal=database-url="postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable" \
  --from-literal=jwt-secret="$(openssl rand -base64 48)" \
  -n itsm-qa
```

---

## Step 6 — Deploy with Helm

```bash
# Update values.yaml: set global.imageRegistry to your registry prefix
# e.g. global.imageRegistry: "ghcr.io/your-org/"

# Dev
helm upgrade --install itsm-app infra/helm/itsm-app \
  --namespace itsm-dev \
  --create-namespace \
  -f infra/helm/itsm-app/values.yaml \
  --set global.imageTag=latest

# QA (override with values-qa.yaml)
helm upgrade --install itsm-app infra/helm/itsm-app \
  --namespace itsm-qa \
  --create-namespace \
  -f infra/helm/itsm-app/values.yaml \
  -f infra/helm/itsm-app/values-qa.yaml \
  --set global.imageTag=latest
```

---

## Step 7 — Verify on K8s

```bash
# Pod is Running
kubectl get pods -n itsm-dev -l app=itsm-user-service
# Expected: NAME                               READY   STATUS    RESTARTS   AGE
#           itsm-user-service-<hash>           1/1     Running   0          Xs

# HPA is registered
kubectl get hpa -n itsm-dev
# Expected: itsm-user-service-hpa ... min:1 max:2

# Service is created
kubectl get svc -n itsm-dev itsm-user-service

# Live logs
kubectl logs -n itsm-dev -l app=itsm-user-service --follow

# Port-forward and test
kubectl port-forward -n itsm-dev svc/itsm-user-service 8080:80 &

curl -s http://localhost:8080/api/v1/health
# Expected: {"status":"ok","service":"user-service"}

# Login from the forwarded port
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice.admin@globaltech.io","password":"Password1!","tenant_slug":"tenant_a"}'
```

---

## Step 8 — Verify what to check in the GUI / logs

| Check | Expected |
|---|---|
| `kubectl logs` on pod startup | `{"level":"INFO","msg":"config loaded"}` and `{"level":"INFO","msg":"database connected"}` |
| `GET /api/v1/health` | `{"status":"ok","service":"user-service"}` |
| `POST /api/v1/auth/login` with seed user | Returns `token`, `expires_at`, `user` object |
| JWT decoded at [jwt.io](https://jwt.io) | Claims: `tenant_id`, `role`, `email`, `sub`, `exp`, `iat`, `jti` |
| `GET /api/v1/users` with wrong tenant slug | HTTP 400 — `X-Tenant-ID contains invalid characters` |
| `GET /api/v1/.well-known/jwks.json` | `{"keys":[{"kty":"oct","alg":"HS256",...}]}` |

---

## Tenant isolation test

```bash
# tenant_a users
curl -s http://localhost:8080/api/v1/users \
  -H "X-Tenant-ID: tenant_a" | python3 -c "import sys,json; d=json.load(sys.stdin); print('tenant_a users:', d['total'])"
# Expected: 10

# tenant_c users — different data
curl -s http://localhost:8080/api/v1/users \
  -H "X-Tenant-ID: tenant_c" | python3 -c "import sys,json; d=json.load(sys.stdin); print('tenant_c users:', d['total'])"
# Expected: 5
```

---

## Rollback

```bash
# Roll back to previous Helm release
helm rollback itsm-app -n itsm-dev

# Or uninstall completely
helm uninstall itsm-app -n itsm-dev
```

---

## Troubleshooting

### Pod in CrashLoopBackOff
```bash
kubectl describe pod -n itsm-dev -l app=itsm-user-service
kubectl logs -n itsm-dev -l app=itsm-user-service --previous
```
- `config: DATABASE_URL is required` → Secret `itsm-secrets` not created or key name mismatch
- `config: JWT_SECRET is required` → Same
- `database: ping database: ...` → DB machine not reachable from cluster; check `<machine-ip>` and firewall

### Login returns 401 "invalid credentials"
- Confirm seed data was loaded: `psql $DATABASE_URL -c "SET search_path TO tenant_a; SELECT email FROM users LIMIT 3;"`
- Seed password bcrypt cost is 10 (fast); service uses cost 12 for new users — these are different but both valid bcrypt

### OTel "dial otel collector" warning at startup
- Expected in Phase 3 — OTel Collector is deployed in Phase 8
- The service starts and runs normally without it (trace exporter errors are non-fatal)

---

## Acceptance checklist

- [ ] `go build ./...` succeeds with no errors
- [ ] `go run ./cmd` starts and responds to `/api/v1/health`
- [ ] Login returns a valid JWT for all three seed tenants
- [ ] JWT decoded at jwt.io shows all six required claims
- [ ] `GET /api/v1/users` with `X-Tenant-ID: tenant_a` returns 10 users
- [ ] `GET /api/v1/users` with `X-Tenant-ID: tenant_c` returns 5 users (tenant isolation confirmed)
- [ ] Create / Update / Delete user CRUD works
- [ ] Docker image builds and passes health check
- [ ] `kubectl get pods -n itsm-dev` shows `1/1 Running`
- [ ] `kubectl get hpa -n itsm-dev` shows `1/2` replicas

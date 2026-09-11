# Customer App — Phase 3: Istio Ingress + JWT Authn Deployment Guide

Closes GitHub issue [#49](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/49).
Design: `docs/superpowers/specs/2026-09-10-customer-app-istio-ingress-jwt-authn-design.md`.

## Overview

Joins `customer-app-dev` to the Istio mesh and puts it behind the shared
IngressGateway, authenticated by the same `user-service` JWTs platform-app
uses. Before this, nothing outside the namespace could reach these services;
after, a valid `customer_a`/`customer_b`/`customer_c` token reaches them
through `http://<node-ip>:30080` with `X-Tenant-ID`/`X-User-Role` injected
from the token's claims — services never see the token.

## Prerequisites

| Tool | Check |
|---|---|
| kubectl (context = the kubeadm cluster) | `kubectl get nodes` → 3 nodes |
| Helm 3.15+ | `helm version` |
| `istioctl` | `istioctl version` |
| `psql` | `psql --version` |
| A bcrypt hash generator on the master | `command -v htpasswd \|\| python3 -c 'import bcrypt'` |
| Phase 1 + 2 complete | `kubectl get pods -n customer-app-dev` → all `1/1 Running` |
| `user-service` live | `kubectl get pods -n itsm-dev -l app=user-service` → `2/2 Running` |

```bash
export DATABASE_URL="postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable"
cd customer-app
```

## Step 1 — Enable sidecar injection

```bash
kubectl label ns customer-app-dev istio-injection=enabled --overwrite
kubectl get ns customer-app-dev -L istio-injection
```
Expected: `ISTIO-INJECTION` column shows `enabled`.

## Step 2 — Roll out the proxy-start annotation and restart everything

```bash
helm upgrade --install customer-app infra/helm/customer-app \
  --namespace customer-app-dev \
  -f infra/helm/customer-app/values.yaml \
  --set redis.persistence.storageClass=local-path

kubectl rollout restart deployment -n customer-app-dev
kubectl rollout restart statefulset/redis -n customer-app-dev

kubectl get pods -n customer-app-dev -w
```
Expected: every pod eventually `2/2 Running`. Java services (delivery/payment)
take ~2-3 min (existing `startupProbe`); with `holdApplicationUntilProxyStarts`
they should not crash-loop this time (Known fixed issue #2, Phase 1). `redis-0`
briefly restarts — cache-aside means a transient MISS, non-fatal.

## Step 3 — Apply the Istio config

```bash
ENV=dev bash scripts/apply-istio-config.sh
```
Expected: ends with the active-policies listing and
`Verify with: istioctl analyze -n customer-app-dev`. Run that too:
```bash
istioctl analyze -n customer-app-dev
```
Expected: no errors (a warning about no local `Gateway` resource in this
namespace is expected and fine — it intentionally reuses `itsm-dev/itsm-gateway`).

## Step 4 — Seed login users

```bash
SEED_PASSWORD='<pick a dev password>' bash scripts/seed-customer-user.sh
```
Expected output ends with a table listing `owner@customer-a.example` /
`owner@customer-b.example`, both `role=admin`, `is_active=t`.

## Step 5 — Verify: mesh auth end-to-end

```bash
NODE_IP="$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')"
RESOLVE="--resolve customer-app.dev.local:30080:${NODE_IP}"

# no token -> 403
curl -s -o /dev/null -w '%{http_code}\n' $RESOLVE http://customer-app.dev.local:30080/api/v1/restaurants

# garbage token -> 401
curl -s -o /dev/null -w '%{http_code}\n' $RESOLVE \
  -H "Authorization: Bearer not-a-real-jwt" http://customer-app.dev.local:30080/api/v1/restaurants
```
Expected: `403` then `401`.

Get a real JWT for `customer_a` (dev-mode MFA code is logged, not emailed).
**Important:** `/api/v1/auth/*` only exists in platform-app's `itsm-routing`
VirtualService (`hosts: ["*"]`). Istio routes by exact-host-match-wins — once
`customer-app-routing` claims the exact host `customer-app.dev.local`,
requests with that Host header are routed **exclusively** by it and never
fall through to `itsm-routing`, even for paths it doesn't define. So auth
calls must go to the **bare node IP** (an unclaimed Host), not
`customer-app.dev.local` (confirmed live 2026-09-11 — the first attempt at
this step returned an empty body and every downstream `json.load` failed
until this was fixed):
```bash
AUTH_BASE="http://${NODE_IP}:30080"

SESSION_ID=$(curl -s -X POST ${AUTH_BASE}/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@customer-a.example","password":"<the SEED_PASSWORD you picked>"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["session_id"])')

curl -s -X POST ${AUTH_BASE}/api/v1/auth/mfa/send \
  -H 'Content-Type: application/json' -d "{\"session_id\":\"$SESSION_ID\"}" > /dev/null

CODE=$(kubectl logs -n itsm-dev deploy/user-service --since=60s \
  | grep 'dev-mode: MFA OTP' | grep '"email":"owner@customer-a.example"' | tail -1 \
  | python3 -c 'import sys,json; print(json.loads(sys.stdin.readline())["code"])')

JWT_A=$(curl -s -X POST ${AUTH_BASE}/api/v1/auth/mfa/verify \
  -H 'Content-Type: application/json' \
  -d "{\"session_id\":\"$SESSION_ID\",\"code\":\"$CODE\"}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

# valid token -> 200, customer_a's own restaurants (THIS one DOES use customer-app.dev.local)
curl -s $RESOLVE -H "Authorization: Bearer $JWT_A" http://customer-app.dev.local:30080/api/v1/restaurants | python3 -m json.tool
# Expected: total 2

# header-spoof defense: JWT still says customer_a even with a spoofed header
curl -s $RESOLVE -H "Authorization: Bearer $JWT_A" -H "X-Tenant-ID: customer_b" \
  http://customer-app.dev.local:30080/api/v1/restaurants | python3 -c 'import sys,json;print(json.load(sys.stdin)["total"])'
# Expected: 2 (still customer_a's count, not customer_b's 1)
```

## Step 6 — Re-run the (now JWT-based) tenant isolation smoke test

```bash
SEED_PASSWORD='<the same dev password>' bash scripts/tenant-isolation-smoke-test.sh
```
Expected tail: `25 passed, 0 failed` / `Tenant isolation holds through the mesh.`

## Rollback

```bash
kubectl delete -f infra/k8s/istio/authorization-policies/dev/authz-deny-unauthenticated.yaml
kubectl delete -f infra/k8s/istio/request-authentication/dev/request-auth.yaml
kubectl delete -f infra/k8s/istio/virtual-services/dev/virtual-service.yaml
kubectl delete -f infra/k8s/istio/peer-authentication/dev/peer-auth-mtls.yaml
kubectl delete -f infra/k8s/istio/destination-rules/dev/destination-rule.yaml
kubectl label ns customer-app-dev istio-injection-
kubectl rollout restart deployment,statefulset -n customer-app-dev
helm rollback customer-app -n customer-app-dev
```
Seeded `public.users` rows are inert if left in place, or:
```bash
psql "$DATABASE_URL" -c "DELETE FROM public.users WHERE email IN ('owner@customer-a.example','owner@customer-b.example');"
```

## Troubleshooting

### Pods stuck `1/2` or restarting after Step 2
`istio-proxy` container not ready yet, or `holdApplicationUntilProxyStarts`
missing from the rendered manifest (check `kubectl get deploy <name> -n
customer-app-dev -o jsonpath='{.spec.template.metadata.annotations}'`).

### `apply-istio-config.sh` exits with "some pods are not 2/2 READY"
Exactly the guard it's designed to hit — finish Step 2 first
(`kubectl rollout restart` + wait) before re-running.

### `istioctl analyze` reports the VirtualService references an unknown gateway
Confirm platform-app's `itsm-gateway` still exists: `kubectl get gateway -n itsm-dev`.
This plan never modifies it, so this would mean something else changed it.

### Login/MFA calls return an empty body (curl succeeds, JSON parsing fails)
**Confirmed live 2026-09-11.** `/api/v1/auth/*` and `/api/v1/.well-known/*`
are routed by platform-app's own `itsm-routing` VirtualService
(`hosts: ["*"]`), not `customer-app-routing`. Istio routes by
exact-host-match-wins: once `customer-app-routing` claims the exact host
`customer-app.dev.local`, requests carrying that Host header are routed
**exclusively** by it and never fall through to `itsm-routing`, even for
paths only `itsm-routing` defines. Using `--resolve customer-app.dev.local:...`
(or `-H "Host: customer-app.dev.local"`) for an auth call is therefore always
wrong — use the **bare node IP** instead (`http://${NODE_IP}:30080/api/v1/auth/...`,
no `--resolve`), which is an unclaimed Host and still falls to `itsm-routing`.
Confirm `kubectl get virtualservice -n itsm-dev itsm-routing` still exists
with `hosts: ["*"]` if this ever regresses.

### `seed-customer-user.sh` fails with "no bcrypt hash generator found"
`apt-get install -y apache2-utils` on the master (or `pip install bcrypt` for
the python3 fallback).

## Acceptance Checklist

- [ ] `kubectl get pods -n customer-app-dev` — all pods `2/2 Running`
- [ ] `istioctl analyze -n customer-app-dev` — no errors
- [ ] No token → `403`; garbage token → `401`
- [ ] Valid `customer_a` JWT → `200`, 2 restaurants
- [ ] Valid `customer_a` JWT + spoofed `X-Tenant-ID: customer_b` → still 2 (customer_a's own)
- [ ] `tenant-isolation-smoke-test.sh` → `25 passed, 0 failed`
- [ ] `customer-app/TODO.md` Phase 3 checked off, #49 moved to Done on the board

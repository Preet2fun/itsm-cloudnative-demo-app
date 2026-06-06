# Phase 6 — Istio + OPA Deployment Guide

## Overview

This phase adds two security layers to the ITSM platform:

| Layer | Component | What it does |
|---|---|---|
| 1 — JWT Validation | Istio RequestAuthentication | Validates RS256 JWT on every request; injects `X-Tenant-ID` and `X-User-Role` headers |
| 2a — Tenant Isolation | Istio AuthorizationPolicy DENY | Blocks unauthenticated requests to protected API paths |
| 2b — RBAC | OPA ext_authz (CUSTOM) | Role + method + path enforcement via Rego |
| 3 — mTLS | Istio PeerAuthentication STRICT | All pod-to-pod traffic encrypted |

After this phase the app is accessed at **`http://<node-ip>:30080`** through the Istio IngressGateway. The temporary port-forward is no longer needed.

---

## Prerequisites

- Phase 5 validated on the cluster
- `istioctl` installed on the K8s master (Step 1 below)
- `kubectl` access to the cluster from the master
- The RSA key pair generated in Step 0

---

## Files Changed in This Phase

| File | Change |
|---|---|
| `services/user-service/internal/config/config.go` | HS256 → RS256: loads RSA private key from `JWT_PRIVATE_KEY` env var |
| `services/user-service/internal/handlers/auth.go` | Signs tokens with RS256; verifies with RSA public key; adds `iss` claim |
| `services/user-service/internal/handlers/jwks.go` | Serves RSA public key (kty=RSA, n, e) instead of oct key |
| `services/user-service/cmd/main.go` | JWKS handler receives `*rsa.PrivateKey` |
| `infra/helm/itsm-app/templates/user-service/deployment.yaml` | `JWT_SECRET` → `JWT_PRIVATE_KEY` from secret key `jwt-private-key` |
| `infra/istio/istio-operator.yaml` | IstioOperator: demo profile, NodePort 30080, OPA ext_authz provider |
| `infra/k8s/istio/gateway.yaml` | Istio Gateway (HTTP port 80) |
| `infra/k8s/istio/virtual-services/dev/virtual-service.yaml` | Path-based routing to all services |
| `infra/k8s/istio/request-authentication/dev/request-auth.yaml` | JWT validation + header injection |
| `infra/k8s/istio/authorization-policies/dev/authz-deny-unauthenticated.yaml` | DENY unauthenticated access to API paths |
| `infra/k8s/istio/peer-authentication/dev/peer-auth-mtls.yaml` | STRICT mTLS |
| `infra/k8s/opa/deployment.yaml` | OPA with Envoy plugin |
| `infra/k8s/opa/service.yaml` | OPA ClusterIP service (gRPC 9191, HTTP 8181) |
| `infra/k8s/opa/config-configmap.yaml` | OPA startup config |
| `infra/k8s/opa/policy-configmap.yaml` | Rego RBAC policy |
| `infra/k8s/opa/authz-policy-custom/dev/authz-opa-custom.yaml` | CUSTOM AuthorizationPolicy → OPA |

---

## Step 0 — Generate RSA Key Pair and Update K8s Secret

Run on the **K8s master**:

```bash
# Generate RSA-2048 private key (PKCS#1 PEM)
openssl genrsa -out /tmp/jwt-private.pem 2048

# Verify the key was generated correctly
openssl rsa -in /tmp/jwt-private.pem -noout -text | head -5

# Delete the existing secret (it had JWT_SECRET; we replace with JWT_PRIVATE_KEY)
kubectl delete secret itsm-secrets -n itsm-dev

# Recreate with the new key name
# Replace <your-rabbitmq-password> with whatever value you used before
kubectl create secret generic itsm-secrets -n itsm-dev \
  --from-literal=database-url='postgres://itsm:itsm@172.16.13.168:5432/itsm?sslmode=disable' \
  --from-file=jwt-private-key=/tmp/jwt-private.pem \
  --from-literal=rabbitmq-password='itsm'

# Confirm the keys in the secret
kubectl get secret itsm-secrets -n itsm-dev -o jsonpath='{.data}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(list(d.keys()))"
# Expected: ['database-url', 'jwt-private-key', 'rabbitmq-password']

# Clean up temp file
rm /tmp/jwt-private.pem
```

---

## Step 1 — Install istioctl and Istio

```bash
# Download istioctl 1.22 (on the K8s master)
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.22.0 TARGET_ARCH=x86_64 sh -
cd istio-1.22.0
export PATH=$PWD/bin:$PATH

# Verify istioctl
istioctl version

# Install Istio using the operator file
istioctl install -f infra/istio/istio-operator.yaml -y

# Watch installation progress (takes ~2 minutes)
kubectl get pods -n istio-system -w
```

**Expected output — all pods Running:**
```
NAME                                    READY   STATUS    RESTARTS
istio-ingressgateway-xxxxx              1/1     Running   0
istiod-xxxxx                            1/1     Running   0
```

**Verify NodePort is configured:**
```bash
kubectl get svc istio-ingressgateway -n istio-system
# Should show NodePort with 30080:80/TCP and 30443:443/TCP
```

---

## Step 2 — Rebuild and Redeploy User Service (RS256)

On the **K8s master**, in the repo root:

```bash
# Build new user-service image with RS256 changes
cd services/user-service
docker build -t preet2fun/user-service:latest .
docker push preet2fun/user-service:latest
cd ../..

# Redeploy via Helm (picks up new secret key + new image)
helm upgrade --install itsm-app ./infra/helm/itsm-app \
  -f infra/helm/itsm-app/values.yaml \
  -n itsm-dev

# Wait for user-service to be ready
kubectl rollout status deployment/user-service -n itsm-dev

# Verify JWKS now returns RSA format (kty=RSA, not oct)
kubectl port-forward svc/user-service 8080:80 -n itsm-dev &
sleep 3
curl -s http://localhost:8080/api/v1/.well-known/jwks.json | python3 -m json.tool
# Expected: {"keys": [{"kty": "RSA", "alg": "RS256", ...}]}
kill %1
```

---

## Step 3 — Restart All Pods to Inject Istio Sidecars

```bash
# Rollout restart injects Envoy sidecar into every pod
kubectl rollout restart deployment -n itsm-dev
kubectl rollout restart statefulset -n itsm-dev

# Wait for all pods to be 2/2 READY (app container + Envoy sidecar)
kubectl get pods -n itsm-dev -w
```

**Expected — all pods show READY 2/2:**
```
NAME                              READY   STATUS
frontend-xxx                      2/2     Running
user-service-xxx                  2/2     Running
asset-service-xxx                 2/2     Running
incident-service-xxx              2/2     Running
redis-0                           2/2     Running
rabbitmq-0                        2/2     Running
```

> **Note:** OPA pod will be 1/1 (sidecar injection disabled for OPA intentionally).

---

## Step 4 — Apply Istio Gateway and VirtualService

```bash
kubectl apply -f infra/k8s/istio/gateway.yaml
kubectl apply -f infra/k8s/istio/virtual-services/dev/virtual-service.yaml

# Verify routing is active
istioctl analyze -n itsm-dev
```

**Quick test — frontend is now reachable via IngressGateway:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://172.16.15.206:30080/api/health
# Expected: 200
```

From your **laptop browser**: `http://172.16.15.206:30080` — login page should appear.

---

## Step 5 — Deploy OPA

```bash
kubectl apply -f infra/k8s/opa/config-configmap.yaml
kubectl apply -f infra/k8s/opa/policy-configmap.yaml
kubectl apply -f infra/k8s/opa/deployment.yaml
kubectl apply -f infra/k8s/opa/service.yaml

# Wait for OPA to be ready
kubectl rollout status deployment/opa -n itsm-dev

# Verify OPA health
kubectl exec -n itsm-dev deploy/opa -- \
  wget -qO- http://localhost:8181/health
# Expected: {}
```

---

## Step 6 — Apply RequestAuthentication

```bash
kubectl apply -f infra/k8s/istio/request-authentication/dev/request-auth.yaml

# Verify Istio can reach the JWKS endpoint
kubectl exec -n istio-system deploy/istiod -- \
  curl -s http://user-service.itsm-dev.svc.cluster.local/api/v1/.well-known/jwks.json
# Expected: {"keys":[{"kty":"RSA",...}]}
```

---

## Step 7 — Apply AuthorizationPolicies

```bash
# Layer 1: DENY unauthenticated requests to protected API paths
kubectl apply -f infra/k8s/istio/authorization-policies/dev/authz-deny-unauthenticated.yaml

# Layer 2: CUSTOM OPA RBAC (apply AFTER OPA is confirmed running)
kubectl apply -f infra/k8s/opa/authz-policy-custom/dev/authz-opa-custom.yaml

# Verify policies are active
kubectl get authorizationpolicy -n itsm-dev
```

---

## Step 8 — Apply mTLS STRICT

```bash
# Only apply after all pods are confirmed 2/2 READY
kubectl apply -f infra/k8s/istio/peer-authentication/dev/peer-auth-mtls.yaml

# Verify mTLS is active
istioctl x describe pod \
  $(kubectl get pod -n itsm-dev -l app=user-service -o jsonpath='{.items[0].metadata.name}') \
  -n itsm-dev | grep mTLS
```

---

## Step 9 — Acceptance Test

All tests from your **laptop browser** at `http://172.16.15.206:30080`:

| # | Test | Expected |
|---|---|---|
| 1 | `GET http://172.16.15.206:30080/` | Redirects to `/login` (200) |
| 2 | Login with `alice.admin@globaltech.io` / `Password1!` / `tenant_a` | Dashboard loads, JWT stored in localStorage |
| 3 | `curl http://172.16.15.206:30080/api/v1/incidents/` (no token) | `403 Forbidden` |
| 4 | `curl -H "Authorization: Bearer <invalid>" http://172.16.15.206:30080/api/v1/incidents/` | `401 Unauthorized` |
| 5 | Navigate to Incidents — list loads | `200 OK`, data from incident-service |
| 6 | Create an incident | Incident created and visible in list |
| 7 | Navigate to Assets — list loads | `200 OK`, data from asset-service |
| 8 | Log out, log in as `henry.viewer@globaltech.io` / `Password1!` / `tenant_a` | Dashboard loads |
| 9 | As viewer: attempt to create an incident via UI | `403 Forbidden` returned by OPA |
| 10 | Check OPA logs | `allow: true/false` entries visible |

```bash
# Check OPA decision logs
kubectl logs -n itsm-dev deploy/opa --tail=30 | grep -E "allow|decision"

# Check Istio access log (pick any backend pod)
kubectl logs -n itsm-dev \
  $(kubectl get pod -n itsm-dev -l app=incident-service -o jsonpath='{.items[0].metadata.name}') \
  -c istio-proxy --tail=20
```

---

## Troubleshooting

### "JWKS fetch failed" in Istio logs
```bash
# Verify user-service JWKS endpoint is reachable from istiod
kubectl exec -n istio-system deploy/istiod -- \
  curl -v http://user-service.itsm-dev.svc.cluster.local/api/v1/.well-known/jwks.json
```
If connection refused: user-service pod may not have restarted with the RS256 changes. Run `kubectl rollout restart deployment/user-service -n itsm-dev`.

### 401 on valid token after RS256 migration
Old tokens issued with HS256 are invalid. Log out, clear localStorage in the browser, and log in again to get a fresh RS256 token.

### OPA returns 403 for all requests
Check OPA logs:
```bash
kubectl logs -n itsm-dev deploy/opa --tail=50
```
Common causes: policy syntax error in the ConfigMap, or `x-user-role` header not present (means RequestAuthentication didn't validate the JWT — check the token's `iss` claim matches `itsm-user-service`).

### Pods stuck at 1/2 READY after restart
The Envoy sidecar may be failing. Check:
```bash
kubectl describe pod -n itsm-dev <pod-name>
kubectl logs -n itsm-dev <pod-name> -c istio-proxy
```

### mTLS causing connection refused
If applied PeerAuthentication before all pods had sidecars:
```bash
# Temporarily switch to PERMISSIVE while fixing
kubectl patch peerauthentication itsm-mtls-strict -n itsm-dev \
  --type merge -p '{"spec":{"mtls":{"mode":"PERMISSIVE"}}}'
# Fix the pods, then switch back to STRICT
```

### Update OPA policy without redeployment
```bash
kubectl edit configmap opa-policy -n itsm-dev
kubectl rollout restart deployment/opa -n itsm-dev
```

---

## Rollback

```bash
# Remove OPA CUSTOM authz (restores pre-OPA state)
kubectl delete authorizationpolicy opa-authz -n itsm-dev

# Remove DENY policy (no JWT enforcement)
kubectl delete authorizationpolicy deny-unauthenticated-api -n itsm-dev

# Remove mTLS STRICT
kubectl delete peerauthentication itsm-mtls-strict -n itsm-dev

# Uninstall Istio entirely
istioctl uninstall --purge -y
kubectl delete namespace istio-system
```

---

## Acceptance Checklist

- [ ] `istio-system` namespace has 2 pods Running (istiod + ingressgateway)
- [ ] All itsm-dev pods are `2/2 Running` (app + Envoy sidecar)
- [ ] OPA pod is `1/1 Running` (no sidecar)
- [ ] JWKS endpoint returns `kty: RSA`
- [ ] `http://172.16.15.206:30080` loads login page (no port-forward)
- [ ] Login succeeds and dashboard loads
- [ ] Unauthenticated API request returns 403
- [ ] Invalid JWT returns 401
- [ ] Viewer role blocked from creating incidents (OPA → 403)
- [ ] Admin role has full access
- [ ] OPA decision logs show `allow: true/false` entries
- [ ] `istioctl x describe pod` confirms mTLS is STRICT

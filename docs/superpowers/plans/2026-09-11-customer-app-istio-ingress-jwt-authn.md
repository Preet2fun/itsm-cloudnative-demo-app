# Customer App — Istio Ingress + JWT Authn (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution note:** Tasks 6-9 and 11 apply changes to and run commands against the **live kubeadm cluster** (host: `kubernetes-master`, reached only through the interactive session with the human operator — no subagent or CI runner has `kubectl`/`psql` access to it). Tasks 1-5, 10, 12 are pure local file edits and can be done by any executor. Inline execution in the main session is the realistic path for this plan; see the note at the end.

**Goal:** Put customer-app's 4 services behind the shared Istio IngressGateway with real JWT authentication — a valid customer-tenant token (minted by the existing `user-service`) reaches order/catalog/delivery/payment-service with `X-Tenant-ID`/`X-User-Role` injected from its claims; missing or invalid tokens are rejected at the mesh.

**Architecture:** customer-app-dev joins the Istio mesh (sidecar injection + STRICT mTLS) and gets its own per-namespace `RequestAuthentication` + `AuthorizationPolicy`, mirroring platform-app's `itsm-dev` setup exactly. Ingress reuses the *existing* shared `Gateway` (`itsm-dev/itsm-gateway`) via a dedicated `VirtualService` host (`customer-app.dev.local`) so it never collides with platform-app's `hosts: ["*"]` catch-all. No new Gateway, no changes to platform-app.

**Tech Stack:** Istio 1.22 (`networking.istio.io/v1beta1`, `security.istio.io/v1beta1`), Helm 3.15+, bash, `user-service`'s existing RS256/JWKS + dev-mode MFA-via-logs login flow, `psql` + bcrypt for seed data.

**Spec:** `docs/superpowers/specs/2026-09-10-customer-app-istio-ingress-jwt-authn-design.md`

## Global Constraints

- Never validate JWTs inside application service handlers — Istio does it (root `CLAUDE.md` §3).
- HPA stays `min=1 max=2` — untouched by this plan.
- No new Gateway resource — bind to `itsm-dev/itsm-gateway` (spec D1).
- `PeerAuthentication` STRICT is applied **only** after every pod in the namespace is `2/2 READY` — applying it earlier breaks inter-service traffic (spec §4.1, mirrors platform-app's own script).
- `DATABASE_URL` is the one connection variable; never split into host/port/user/pass (root `CLAUDE.md` §3).
- No git push without the user asking; commits happen per-task, pushes are the user's call.
- Every deployable K8s change gets a deployment guide (root `CLAUDE.md` §9) — Task 6 is that guide, amended in later tasks as real output comes in (same pattern Phase 1 used).

---

### Task 1: `holdApplicationUntilProxyStarts` on all 4 customer-app deployments

**Files:**
- Modify: `customer-app/infra/helm/customer-app/templates/order-service/deployment.yaml:23-25`
- Modify: `customer-app/infra/helm/customer-app/templates/catalog-service/deployment.yaml:23-25`
- Modify: `customer-app/infra/helm/customer-app/templates/delivery-service/deployment.yaml` (same annotation block)
- Modify: `customer-app/infra/helm/customer-app/templates/payment-service/deployment.yaml` (same annotation block)

**Interfaces:**
- Produces: every customer-app pod template carries `proxy.istio.io/config` alongside the existing `sidecar.istio.io/inject: "true"` — Task 6's rollout restart (Task 7) is what actually exercises this.

- [ ] **Step 1: Add the annotation to all 4 templates**

Each of the 4 files has this exact block (only the `.Values.<service>Service` name differs):

```yaml
      annotations:
        sidecar.istio.io/inject: "true"
        checksum/secret: {{ .Values.orderService.secretName | sha256sum }}
```

Change it to (example for `order-service`; repeat for `catalogService`, `deliveryService`, `paymentService` using each file's existing `.Values.<x>Service.secretName`):

```yaml
      annotations:
        sidecar.istio.io/inject: "true"
        proxy.istio.io/config: '{"holdApplicationUntilProxyStarts": true}'
        checksum/secret: {{ .Values.orderService.secretName | sha256sum }}
```

- [ ] **Step 2: Verify the chart still renders and lints**

Run (from `customer-app/`):
```bash
helm lint infra/helm/customer-app -f infra/helm/customer-app/values.yaml
helm template customer-app infra/helm/customer-app -f infra/helm/customer-app/values.yaml \
  --show-only templates/order-service/deployment.yaml \
  --show-only templates/catalog-service/deployment.yaml \
  --show-only templates/delivery-service/deployment.yaml \
  --show-only templates/payment-service/deployment.yaml \
  | grep -c 'holdApplicationUntilProxyStarts'
```
Expected: `helm lint` → `0 chart(s) failed`; the `grep -c` count → `4`.

- [ ] **Step 3: Commit**

```bash
git add customer-app/infra/helm/customer-app/templates/*/deployment.yaml
git commit -m "feat(customer-app): hold app start until Istio proxy is ready"
```

---

### Task 2: dev Istio manifests — VirtualService, RequestAuthentication, deny-unauthenticated

**Files:**
- Create: `customer-app/infra/k8s/istio/virtual-services/dev/virtual-service.yaml`
- Create: `customer-app/infra/k8s/istio/request-authentication/dev/request-auth.yaml`
- Create: `customer-app/infra/k8s/istio/authorization-policies/dev/authz-deny-unauthenticated.yaml`
- Delete: `customer-app/infra/k8s/istio/authorization-policies/dev/authz-allow-intra-namespace.yaml`

**Interfaces:**
- Produces: the exact file paths Task 4's `apply-istio-config.sh` applies for `ENV=dev`.

- [ ] **Step 1: Write the VirtualService**

`customer-app/infra/k8s/istio/virtual-services/dev/virtual-service.yaml`:

```yaml
# VirtualService — path-based routing for customer-app through the shared
# Istio IngressGateway. Bound cross-namespace to platform-app's itsm-gateway
# (no dedicated Gateway resource) via a dedicated host, so this never
# collides with itsm-routing's `hosts: ["*"]` + catch-all-to-frontend.
#
# Route map:
#   /api/v1/restaurants*   -> catalog-service   (includes nested menu-items)
#   /api/v1/orders*        -> order-service
#   /api/v1/deliveries*    -> delivery-service
#   /api/v1/payments*      -> payment-service
#   (no catch-all - no frontend yet; unmatched paths get Istio's 404)

apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: customer-app-routing
  namespace: customer-app-dev
spec:
  hosts:
    - "customer-app.dev.local"
  gateways:
    - itsm-dev/itsm-gateway
  http:
    - match:
        - uri:
            prefix: /api/v1/restaurants
      route:
        - destination:
            host: catalog-service
            port:
              number: 80

    - match:
        - uri:
            prefix: /api/v1/orders
      route:
        - destination:
            host: order-service
            port:
              number: 80

    - match:
        - uri:
            prefix: /api/v1/deliveries
      route:
        - destination:
            host: delivery-service
            port:
              number: 80

    - match:
        - uri:
            prefix: /api/v1/payments
      route:
        - destination:
            host: payment-service
            port:
              number: 80
```

- [ ] **Step 2: Write the RequestAuthentication**

`customer-app/infra/k8s/istio/request-authentication/dev/request-auth.yaml`:

```yaml
# RequestAuthentication - JWT validation for all workloads in customer-app-dev.
# Same shape as platform-app's itsm-jwt-auth - one identity engine
# (user-service in itsm-dev) issues tokens for both apps (root CLAUDE.md S3).
#
# Behaviour:
#   - Bearer token present & valid   -> Envoy injects X-Tenant-ID/X-User-Role
#     from the tenant_id/role claims; forwards the original token too.
#   - Bearer token present & invalid -> 401 before the request reaches the service.
#   - No token -> passes through here; authz-deny-unauthenticated.yaml is what
#     actually requires a token on the protected paths.
#   - Platform-staff token (no tenant_id claim) -> X-Tenant-ID simply isn't
#     injected; services then return 400 "X-Tenant-ID header is required" -
#     cross-tenant staff browsing isn't supported yet (root CLAUDE.md S3, #47).

apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: customer-app-jwt-auth
  namespace: customer-app-dev
spec:
  jwtRules:
    - issuer: "itsm-user-service"
      jwksUri: "http://user-service.itsm-dev.svc.cluster.local/api/v1/.well-known/jwks.json"
      outputClaimToHeaders:
        - header: "x-tenant-id"
          claim: "tenant_id"
        - header: "x-user-role"
          claim: "role"
      forwardOriginalToken: true
```

- [ ] **Step 3: Write the deny-unauthenticated policy and remove the placeholder it replaces**

`customer-app/infra/k8s/istio/authorization-policies/dev/authz-deny-unauthenticated.yaml`:

```yaml
# AuthorizationPolicy - requires a valid JWT for customer-app's protected API
# paths. Same shape (and same DENY-not-ALLOW reasoning) as platform-app's
# deny-unauthenticated-api: DENY policies never trigger Istio's
# any-ALLOW-means-default-deny behavior, so this only ever removes access -
# it composes cleanly with Phase 4's future OPA CUSTOM policy.
#
# Supersedes authz-allow-intra-namespace.yaml (removed in the same change) -
# that policy predates customer-app having its own JWT/RequestAuthentication
# layer; see its own comment for why it had to go once this landed.

apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: customer-app-deny-unauthenticated
  namespace: customer-app-dev
spec:
  action: DENY
  rules:
    - from:
        - source:
            notRequestPrincipals: ["*"]
      to:
        - operation:
            paths:
              - /api/v1/restaurants*
              - /api/v1/orders*
              - /api/v1/deliveries*
              - /api/v1/payments*
```

Then:
```bash
git rm customer-app/infra/k8s/istio/authorization-policies/dev/authz-allow-intra-namespace.yaml
```

- [ ] **Step 4: Verify the YAML is well-formed**

```bash
python3 -c "
import yaml, sys
for f in [
    'infra/k8s/istio/virtual-services/dev/virtual-service.yaml',
    'infra/k8s/istio/request-authentication/dev/request-auth.yaml',
    'infra/k8s/istio/authorization-policies/dev/authz-deny-unauthenticated.yaml',
]:
    d = yaml.safe_load(open(f))
    assert d['metadata']['namespace'] == 'customer-app-dev', f
    print(f, '->', d['kind'], 'OK')
"
```
Run from `customer-app/`. Expected: 3 lines ending `OK`, no assertion error.

- [ ] **Step 5: Commit**

```bash
git add customer-app/infra/k8s/istio/virtual-services/dev/virtual-service.yaml \
        customer-app/infra/k8s/istio/request-authentication/dev/request-auth.yaml \
        customer-app/infra/k8s/istio/authorization-policies/dev/authz-deny-unauthenticated.yaml \
        customer-app/infra/k8s/istio/authorization-policies/dev/authz-allow-intra-namespace.yaml
git commit -m "feat(customer-app): dev Istio ingress + JWT authn manifests (#49)"
```

---

### Task 3: qa Istio manifests (parity, not applied to a live namespace)

**Files:**
- Create: `customer-app/infra/k8s/istio/virtual-services/qa/virtual-service.yaml`
- Create: `customer-app/infra/k8s/istio/request-authentication/qa/request-auth.yaml`
- Create: `customer-app/infra/k8s/istio/authorization-policies/qa/authz-deny-unauthenticated.yaml`
- Delete: `customer-app/infra/k8s/istio/authorization-policies/qa/authz-allow-intra-namespace.yaml`

**Interfaces:**
- Consumes: same shapes as Task 2.
- Produces: the file paths Task 4's script applies for `ENV=qa` (once a `customer-app-qa` namespace exists — out of scope here, per the spec's non-goals).

- [ ] **Step 1: Copy Task 2's 3 files with `dev` -> `qa` substitutions**

`customer-app/infra/k8s/istio/virtual-services/qa/virtual-service.yaml` — identical to Task 2 Step 1's file except:
```yaml
metadata:
  name: customer-app-routing
  namespace: customer-app-qa
spec:
  hosts:
    - "customer-app.qa.local"
  gateways:
    - itsm-dev/itsm-gateway
```
(routes unchanged — `catalog-service`/`order-service`/`delivery-service`/`payment-service` resolve inside `customer-app-qa` the same way they do in `dev`.)

`customer-app/infra/k8s/istio/request-authentication/qa/request-auth.yaml` — identical to Task 2 Step 2's file except `metadata.namespace: customer-app-qa`. `jwksUri` stays `user-service.itsm-dev.svc.cluster.local` — one identity engine for every environment (root `CLAUDE.md` §3); there is no `itsm-qa` deployment to point at instead.

`customer-app/infra/k8s/istio/authorization-policies/qa/authz-deny-unauthenticated.yaml` — identical to Task 2 Step 3's file except `metadata.namespace: customer-app-qa`.

- [ ] **Step 2: Remove the qa placeholder policy**

```bash
git rm customer-app/infra/k8s/istio/authorization-policies/qa/authz-allow-intra-namespace.yaml
```

- [ ] **Step 3: Verify YAML validity**

```bash
python3 -c "
import yaml
for f in [
    'infra/k8s/istio/virtual-services/qa/virtual-service.yaml',
    'infra/k8s/istio/request-authentication/qa/request-auth.yaml',
    'infra/k8s/istio/authorization-policies/qa/authz-deny-unauthenticated.yaml',
]:
    d = yaml.safe_load(open(f))
    assert d['metadata']['namespace'] == 'customer-app-qa', f
    print(f, '->', d['kind'], 'OK')
"
```
Run from `customer-app/`. Expected: 3 lines ending `OK`.

- [ ] **Step 4: Commit**

```bash
git add customer-app/infra/k8s/istio/virtual-services/qa/virtual-service.yaml \
        customer-app/infra/k8s/istio/request-authentication/qa/request-auth.yaml \
        customer-app/infra/k8s/istio/authorization-policies/qa/authz-deny-unauthenticated.yaml \
        customer-app/infra/k8s/istio/authorization-policies/qa/authz-allow-intra-namespace.yaml
git commit -m "feat(customer-app): qa Istio ingress + JWT authn manifests (parity, #49)"
```

---

### Task 4: `apply-istio-config.sh`

**Files:**
- Create: `customer-app/scripts/apply-istio-config.sh`

**Interfaces:**
- Consumes: the file paths created in Tasks 2-3, plus the already-existing `infra/k8s/istio/destination-rules/${ENV}/destination-rule.yaml` and `infra/k8s/istio/peer-authentication/${ENV}/peer-auth-mtls.yaml`.
- Produces: nothing later tasks import — this is a leaf script, invoked directly in Task 7.

- [ ] **Step 1: Write the script**

`customer-app/scripts/apply-istio-config.sh`:

```bash
#!/usr/bin/env bash
# Script: apply-istio-config.sh
# Description: Applies customer-app's Istio networking + security manifests
#              for the given environment, in the order that's safe under
#              STRICT mTLS. Structural port of
#              platform-app/scripts/apply-istio-config.sh. Does NOT touch the
#              shared itsm-gateway (customer-app reuses it) and does NOT
#              restart Deployments/StatefulSets itself - run `helm upgrade`
#              and `kubectl rollout restart` first, and wait for every pod to
#              reach 2/2, before running this script.
#
# Usage:
#   ENV=dev bash scripts/apply-istio-config.sh
#   ENV=qa  bash scripts/apply-istio-config.sh
#
# Safety: refuses to apply PeerAuthentication STRICT mTLS unless every pod in
# the namespace is already 2/2 READY (sidecars present) - applying STRICT
# before that breaks inter-service communication.

set -euo pipefail

ENV="${ENV:-dev}"
if [[ "${ENV}" != "dev" && "${ENV}" != "qa" ]]; then
  echo "ERROR: ENV must be 'dev' or 'qa', got '${ENV}'." >&2
  exit 1
fi

NS="customer-app-${ENV}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ISTIO_DIR="${REPO_ROOT}/infra/k8s/istio"

echo "==> Applying customer-app Istio config for ENV=${ENV} (namespace: ${NS})"

if ! kubectl get namespace "${NS}" &>/dev/null; then
  echo "ERROR: namespace ${NS} does not exist yet." >&2
  exit 1
fi

INJECTION_LABEL="$(kubectl get namespace "${NS}" -o jsonpath='{.metadata.labels.istio-injection}' 2>/dev/null || true)"
if [[ "${INJECTION_LABEL}" != "enabled" ]]; then
  echo "ERROR: namespace ${NS} is missing the istio-injection=enabled label." >&2
  echo "  kubectl label ns ${NS} istio-injection=enabled" >&2
  echo "  then restart every workload and re-run this script once all pods are 2/2." >&2
  exit 1
fi

NOT_READY=$(kubectl get pods -n "${NS}" \
  -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.status.containerStatuses[*].ready}{"\n"}{end}' \
  2>/dev/null \
  | grep -v "true true" \
  | grep -v "^$" || true)

if [[ -n "${NOT_READY}" ]]; then
  echo "ERROR: some pods in ${NS} are not 2/2 READY yet - Istio sidecars are" >&2
  echo "  missing on at least one pod. Fix these before applying mesh config:" >&2
  echo "${NOT_READY}" >&2
  echo "" >&2
  echo "  Hint: kubectl rollout restart deployment,statefulset -n ${NS}" >&2
  echo "  Then wait for 2/2 and re-run this script." >&2
  exit 1
fi

echo "    [1/5] Applying DestinationRule..."
kubectl apply -f "${ISTIO_DIR}/destination-rules/${ENV}/destination-rule.yaml"

echo "    [2/5] Applying VirtualService..."
kubectl apply -f "${ISTIO_DIR}/virtual-services/${ENV}/virtual-service.yaml"

echo "    [3/5] Applying RequestAuthentication..."
kubectl apply -f "${ISTIO_DIR}/request-authentication/${ENV}/request-auth.yaml"

echo "    [4/5] Applying deny-unauthenticated AuthorizationPolicy..."
kubectl apply -f "${ISTIO_DIR}/authorization-policies/${ENV}/authz-deny-unauthenticated.yaml"

echo "    [5/5] All pods 2/2 confirmed - applying PeerAuthentication STRICT mTLS..."
kubectl apply -f "${ISTIO_DIR}/peer-authentication/${ENV}/peer-auth-mtls.yaml"

echo ""
echo "==> Istio config applied for ${NS}."
echo ""
echo "    Active policies:"
kubectl get virtualservice,requestauthentication,authorizationpolicy,peerauthentication,destinationrule \
  -n "${NS}" 2>/dev/null

echo ""
echo "==> Verify with: istioctl analyze -n ${NS}"
```

- [ ] **Step 2: Syntax-check**

```bash
chmod +x scripts/apply-istio-config.sh
bash -n scripts/apply-istio-config.sh && echo "syntax OK"
command -v shellcheck >/dev/null && shellcheck scripts/apply-istio-config.sh || echo "(shellcheck not installed, skipped)"
```
Run from `customer-app/`. Expected: `syntax OK`; shellcheck (if present) with no errors (warnings about `${var}` style are fine to ignore, matching the existing scripts' style).

- [ ] **Step 3: Commit**

```bash
git add customer-app/scripts/apply-istio-config.sh
git commit -m "feat(customer-app): add apply-istio-config.sh (#49)"
```

---

### Task 5: `seed-customer-user.sh`

**Files:**
- Create: `customer-app/scripts/seed-customer-user.sh`

**Interfaces:**
- Produces: rows in `public.users` with `role='admin'`, `is_active=true`, and the given `tenant_id` — consumed by Task 8 (manual verification) and Task 10's rewritten smoke test (both log in as these emails).

- [ ] **Step 1: Write the script**

`customer-app/scripts/seed-customer-user.sh`:

```bash
#!/usr/bin/env bash
# Script: seed-customer-user.sh
# Description: Upserts one or more customer-app end-user login rows into the
#              shared public.users table, for Phase 3 (Istio ingress + JWT
#              authn) verification - logging in as a real customer_a/
#              customer_b user is how a JWT with the right tenant_id claim
#              gets minted. Does NOT use user-service's own
#              POST /api/v1/users (that route needs an admin JWT already -
#              chicken-and-egg for the very first user).
#
# Usage:
#   DATABASE_URL=postgres://itsm:itsm@<ip>:5432/itsm?sslmode=disable \
#   SEED_PASSWORD='<dev password>' \
#     bash scripts/seed-customer-user.sh
#
#   USERS="owner@customer-a.example:customer_a owner@customer-b.example:customer_b owner@customer-c.example:customer_c" \
#   DATABASE_URL=... SEED_PASSWORD=... bash scripts/seed-customer-user.sh
#
# Required env vars:
#   DATABASE_URL   - full Postgres connection string
#   SEED_PASSWORD  - plaintext password to hash and set for every seeded user
#
# Optional env vars:
#   USERS - space-separated "email:tenant_slug" pairs
#           (default: "owner@customer-a.example:customer_a owner@customer-b.example:customer_b")

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "  DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable SEED_PASSWORD=... bash scripts/seed-customer-user.sh" >&2
  exit 1
fi
if [[ -z "${SEED_PASSWORD:-}" ]]; then
  echo "ERROR: SEED_PASSWORD is not set." >&2
  exit 1
fi

USERS="${USERS:-owner@customer-a.example:customer_a owner@customer-b.example:customer_b}"

# gen_hash <password> -> a bcrypt cost-12 hash, matching user-service's
# bcryptCost = 12 (platform-app/services/user-service/internal/handlers/users.go).
gen_hash() {
  local pw="$1"
  if command -v htpasswd &>/dev/null; then
    htpasswd -bnBC 12 "" "$pw" | cut -d: -f2
  elif python3 -c 'import bcrypt' &>/dev/null 2>&1; then
    python3 -c 'import bcrypt,sys; print(bcrypt.hashpw(sys.argv[1].encode(), bcrypt.gensalt(12)).decode())' "$pw"
  elif command -v docker &>/dev/null; then
    docker run --rm httpd:2.4 htpasswd -bnBC 12 "" "$pw" | cut -d: -f2
  else
    echo "ERROR: no bcrypt hash generator found. Install one of: apache2-utils (htpasswd), python3 + the bcrypt package, or docker." >&2
    exit 1
  fi
}

echo "==> seed-customer-user.sh"

HASH="$(gen_hash "${SEED_PASSWORD}")"
if [[ -z "${HASH}" || "${HASH}" != '$2'* ]]; then
  echo "ERROR: generated hash doesn't look like a bcrypt hash (expected to start with '\$2'): '${HASH}'" >&2
  exit 1
fi

EMAILS_SQL=""
for pair in ${USERS}; do
  email="${pair%%:*}"
  slug="${pair##*:}"
  name="Owner (${slug})"
  echo "    seeding ${email}  (tenant_id=${slug})"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "
    INSERT INTO public.users (email, password_hash, full_name, role, tenant_id, is_active)
    VALUES ('${email}', '${HASH}', '${name}', 'admin', '${slug}', true)
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          tenant_id = EXCLUDED.tenant_id,
          is_active = true;
  " > /dev/null
  EMAILS_SQL="${EMAILS_SQL:+${EMAILS_SQL},}'${email}'"
done

echo "==> Seeded users:"
psql "${DATABASE_URL}" -c "SELECT email, role, tenant_id, is_active FROM public.users WHERE email IN (${EMAILS_SQL}) ORDER BY tenant_id;"

echo "==> Done."
```

- [ ] **Step 2: Syntax-check + a dry-run of the hash function alone**

```bash
chmod +x scripts/seed-customer-user.sh
bash -n scripts/seed-customer-user.sh && echo "syntax OK"

# exercise gen_hash() in isolation, no DB needed
bash -c '
source <(sed -n "/^gen_hash()/,/^}/p" scripts/seed-customer-user.sh)
h="$(gen_hash "test-password-123")"
echo "hash: $h"
[[ "$h" == \$2* ]] && echo "PASS: looks like a bcrypt hash" || { echo "FAIL: not a bcrypt hash"; exit 1; }
'
```
Run from `customer-app/`. Expected: `syntax OK`, then a `$2...` hash printed and `PASS: looks like a bcrypt hash`. If the runner has none of `htpasswd`/`python3-bcrypt`/`docker`, this step fails with the script's own error message — install one (on the Mac, `brew install httpd` gives `htpasswd`) before continuing; the master node will need the same.

- [ ] **Step 3: Commit**

```bash
git add customer-app/scripts/seed-customer-user.sh
git commit -m "feat(customer-app): add seed-customer-user.sh for Phase 3 JWT verification (#49)"
```

---

### Task 6: Phase 3 deployment guide (prescriptive draft)

**Files:**
- Create: `customer-app/docs/phase-03-istio-ingress-guide.md`

**Interfaces:**
- Consumes: every file path from Tasks 1-5.
- Produces: the step-by-step reference Tasks 7-9 and 11 follow and amend with real output (same pattern `deployment-guide.md` used for Phase 1's "Known fixed issue" notes).

- [ ] **Step 1: Write the guide**

`customer-app/docs/phase-03-istio-ingress-guide.md`:

```markdown
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
Expected: no errors (warnings about the missing Gateway resource in this
namespace are expected and fine — it intentionally reuses `itsm-dev/itsm-gateway`).

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

Get a real JWT for `customer_a` (dev-mode MFA code is logged, not emailed):
```bash
SESSION_ID=$(curl -s $RESOLVE -X POST http://customer-app.dev.local:30080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@customer-a.example","password":"<the SEED_PASSWORD you picked>"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["session_id"])')

curl -s $RESOLVE -X POST http://customer-app.dev.local:30080/api/v1/auth/mfa/send \
  -H 'Content-Type: application/json' -d "{\"session_id\":\"$SESSION_ID\"}" > /dev/null

CODE=$(kubectl logs -n itsm-dev deploy/user-service --since=60s \
  | grep 'dev-mode: MFA OTP' | grep '"email":"owner@customer-a.example"' | tail -1 \
  | python3 -c 'import sys,json; print(json.loads(sys.stdin.readline())["code"])')

JWT_A=$(curl -s $RESOLVE -X POST http://customer-app.dev.local:30080/api/v1/auth/mfa/verify \
  -H 'Content-Type: application/json' \
  -d "{\"session_id\":\"$SESSION_ID\",\"code\":\"$CODE\"}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

# valid token -> 200, customer_a's own restaurants
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

### Login/MFA calls 404 or 403 through the gateway
`/api/v1/auth/*` and `/api/v1/.well-known/*` are routed by platform-app's own
`itsm-routing` VirtualService, not this one — confirm `kubectl get
virtualservice -n itsm-dev itsm-routing` still exists and its `hosts` includes
`"*"`, and that you used `customer-app.dev.local` (which resolves to the same
gateway) not a bare node IP for these auth calls.

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
```

- [ ] **Step 2: Commit**

```bash
git add customer-app/docs/phase-03-istio-ingress-guide.md
git commit -m "docs(customer-app): Phase 3 Istio ingress deployment guide (#49)"
```

---

### Task 7: LIVE — enable the mesh and confirm every pod reaches 2/2

**Files:** none (cluster-state task; may amend Task 6's guide if reality differs from the draft).

**Interfaces:**
- Consumes: Task 1's chart, Task 6's guide Steps 1-2.
- Produces: a meshed `customer-app-dev` namespace, all pods `2/2` — the precondition every later task assumes.

- [ ] **Step 1: `git pull` on the master, then run guide Step 1**

```bash
cd /home/motadata/itsm-cloudnative-demo-app && git pull
cd customer-app
kubectl label ns customer-app-dev istio-injection=enabled --overwrite
kubectl get ns customer-app-dev -L istio-injection
```
Expected: `ISTIO-INJECTION` = `enabled`.

- [ ] **Step 2: Run guide Step 2 — helm upgrade + restart, wait for 2/2**

```bash
helm upgrade --install customer-app infra/helm/customer-app \
  --namespace customer-app-dev \
  -f infra/helm/customer-app/values.yaml \
  --set redis.persistence.storageClass=local-path

kubectl rollout restart deployment -n customer-app-dev
kubectl rollout restart statefulset/redis -n customer-app-dev

kubectl get pods -n customer-app-dev -w
```
Expected: every pod `2/2 Running`, stable restart counts (no climbing). This
may take several `Ctrl+C`-and-recheck cycles for the Java services (~2-3 min
each). Report back the final `kubectl get pods -n customer-app-dev` output.

- [ ] **Step 3: If anything crash-loops, capture evidence and amend the guide**

```bash
kubectl describe pod -n customer-app-dev <bad-pod> | tail -30
kubectl logs -n customer-app-dev <bad-pod> --previous --tail=100
```
If a genuinely new failure mode shows up (not already covered by Task 6's
Troubleshooting section), add a "Known fixed issue" entry to
`customer-app/docs/phase-03-istio-ingress-guide.md`, same pattern as Phase 1's
`deployment-guide.md`, fix it, and re-run this task's Step 2 until every pod
is stable `2/2`.

---

### Task 8: LIVE — apply Istio config, seed users, verify mesh auth end-to-end

**Files:** none (cluster-state task; amends Task 6's guide with the real captured output).

**Interfaces:**
- Consumes: Task 2/3/4's manifests + script, Task 5's seed script, Task 7's meshed namespace.
- Produces: live `VirtualService`/`RequestAuthentication`/`AuthorizationPolicy`/`PeerAuthentication` in `customer-app-dev`, two seeded `public.users` rows, and confirmed evidence that JWT-based ingress works — consumed by Task 11's smoke-test run.

- [ ] **Step 1: Run guide Step 3 — apply the Istio config**

```bash
ENV=dev bash scripts/apply-istio-config.sh
istioctl analyze -n customer-app-dev
```
Expected: script ends printing the active policies; `istioctl analyze` reports
no errors (a warning about no local `Gateway` is expected — by design, per
Task 2 Step 1's comment).

- [ ] **Step 2: Run guide Step 4 — seed the two login users**

```bash
export DATABASE_URL="postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable"
SEED_PASSWORD='<pick and remember a dev password>' bash scripts/seed-customer-user.sh
```
Expected: table listing `owner@customer-a.example` / `owner@customer-b.example`,
`role=admin`, `is_active=t`.

- [ ] **Step 3: Run guide Step 5 — the 403/401/200/spoof curl sequence**

Run every command block in guide Step 5, substituting the `SEED_PASSWORD` you
picked in Step 2. Expected, in order: `403`, `401`, then the `total` field of
the restaurants response is `2` for both the plain call and the
spoofed-header call.

- [ ] **Step 4: If any expectation doesn't hold, debug before continuing**

This is the same discipline as Phase 1's crash-loop investigation — read the
actual error (`kubectl logs -n customer-app-dev deploy/order-service`,
`kubectl logs -n itsm-dev deploy/user-service`, `istioctl analyze`) before
changing anything, and record the root cause + fix in Task 6's guide once
found. Do not proceed to Task 11 until Step 3's 4 expectations all hold.

---

### Task 9: Rewrite `tenant-isolation-smoke-test.sh` to authenticate via JWT

**Files:**
- Modify: `customer-app/scripts/tenant-isolation-smoke-test.sh` (full rewrite)

**Interfaces:**
- Consumes: `owner@customer-a.example` / `owner@customer-b.example` (Task 5/8), the gateway host/port from Task 2, the exact login/MFA JSON shapes from `user-service/internal/handlers/auth.go` and `internal/models` (`session_id`, `code`, `token` — all snake_case, verified in the design spec).
- Produces: nothing later tasks import — this is what Task 11 runs.

- [ ] **Step 1: Replace the script's content**

`customer-app/scripts/tenant-isolation-smoke-test.sh` (replaces the Phase 2
version in its entirety — raw `X-Tenant-ID` + port-forward no longer works
once Task 8's `deny-unauthenticated` policy is live):

```bash
#!/usr/bin/env bash
# Script: tenant-isolation-smoke-test.sh
# Description: Proves customer-app enforces per-tenant data isolation THROUGH
#              THE MESH - a request authenticated as customer_a (a real JWT,
#              minted via user-service's login+MFA flow) can never read
#              customer_b's restaurants/orders/deliveries/payments, whether by
#              list or by direct id, and a client-supplied X-Tenant-ID header
#              cannot override the JWT's tenant_id claim. Also checks the mesh
#              rejects missing/invalid tokens. Read-only, safe to re-run.
#              Supersedes the Phase 2 version (raw X-Tenant-ID via
#              port-forward), which 403s once Phase 3's deny-unauthenticated
#              policy is live. Re-verifies #35 as part of Phase 3 (#49).
#
# Usage:
#   SEED_PASSWORD='<dev password>' bash scripts/tenant-isolation-smoke-test.sh
#
# Required env vars:
#   SEED_PASSWORD - password for the users seed-customer-user.sh created
#
# Optional env vars:
#   NODE_IP       - a cluster node's reachable IP (default: first node's InternalIP via kubectl)
#   GATEWAY_HOST  - VirtualService host                (default: customer-app.dev.local)
#   GATEWAY_PORT  - IngressGateway NodePort             (default: 30080)
#   USER_A        - customer_a login email              (default: owner@customer-a.example)
#   USER_B        - customer_b login email              (default: owner@customer-b.example)
#
# Exit status: 0 if every assertion passed, 1 otherwise.

set -euo pipefail

: "${SEED_PASSWORD:?ERROR: SEED_PASSWORD is not set (password for the seeded users)}"

GATEWAY_HOST="${GATEWAY_HOST:-customer-app.dev.local}"
GATEWAY_PORT="${GATEWAY_PORT:-30080}"
USER_A="${USER_A:-owner@customer-a.example}"
USER_B="${USER_B:-owner@customer-b.example}"

if [[ -z "${NODE_IP:-}" ]]; then
  NODE_IP="$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')"
fi
[[ -n "${NODE_IP}" ]] || { echo "ERROR: could not determine NODE_IP; set it explicitly." >&2; exit 1; }

BASE="http://${GATEWAY_HOST}:${GATEWAY_PORT}"
RESOLVE_OPT="${GATEWAY_HOST}:${GATEWAY_PORT}:${NODE_IP}"

PASS=0
FAIL=0

# ── HTTP + JSON helpers ──────────────────────────────────────────────────────

# req <url> [extra curl args...]  ->  sets HTTP_CODE and HTTP_BODY
req() {
  local url="$1"; shift
  local tmp; tmp="$(mktemp)"
  HTTP_CODE="$(curl -s --resolve "${RESOLVE_OPT}" -o "$tmp" -w '%{http_code}' "$@" "$url")"
  HTTP_BODY="$(cat "$tmp")"
  rm -f "$tmp"
}

j_total()  { python3 -c 'import sys,json; print(json.load(sys.stdin).get("total",""))'; }
j_len()    { python3 -c 'import sys,json; print(len(json.load(sys.stdin)[sys.argv[1]]))' "$1"; }
j_ids()    { python3 -c 'import sys,json; print(" ".join(x["id"] for x in json.load(sys.stdin)[sys.argv[1]]))' "$1"; }
j_obj_id() { python3 -c 'import sys,json; print(json.load(sys.stdin)[sys.argv[1]][0]["id"])' "$1"; }
j_arr_id() { python3 -c 'import sys,json; a=json.load(sys.stdin); print(a[0]["id"] if a else "")'; }
j_arr_len(){ python3 -c 'import sys,json; print(len(json.load(sys.stdin)))'; }

check() {
  local desc="$1" actual="$2" expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf '  PASS  %s  (%s)\n' "$desc" "$actual"; PASS=$((PASS+1))
  else
    printf '  FAIL  %s  — expected [%s], got [%s]\n' "$desc" "$expected" "$actual"; FAIL=$((FAIL+1))
  fi
}

check_absent() {
  local desc="$1" needle="$2" hay="$3"
  if [[ " $hay " == *" $needle "* ]]; then
    printf '  FAIL  %s  — id %s leaked into results\n' "$desc" "$needle"; FAIL=$((FAIL+1))
  else
    printf '  PASS  %s\n' "$desc"; PASS=$((PASS+1))
  fi
}

# ── Login (dev MFA-code-via-logs; see user-service internal/handlers/auth.go) ─

# login <email> <password>  ->  echoes a JWT on stdout
login() {
  local email="$1" password="$2" tmp session_id code="" token attempt

  tmp="$(mktemp)"
  curl -s --resolve "${RESOLVE_OPT}" -o "$tmp" -X POST "${BASE}/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\"}"
  session_id="$(python3 -c 'import sys,json; print(json.load(sys.stdin)["session_id"])' < "$tmp")"

  curl -s --resolve "${RESOLVE_OPT}" -o /dev/null -X POST "${BASE}/api/v1/auth/mfa/send" \
    -H 'Content-Type: application/json' \
    -d "{\"session_id\":\"${session_id}\"}"

  for attempt in 1 2 3 4 5; do
    sleep 1
    code="$(kubectl logs -n itsm-dev deploy/user-service --since=60s 2>/dev/null \
      | grep 'dev-mode: MFA OTP' \
      | grep "\"email\":\"${email}\"" \
      | tail -1 \
      | python3 -c 'import sys,json; l=sys.stdin.readline(); print(json.loads(l)["code"]) if l.strip() else print("")' 2>/dev/null || true)"
    [[ -n "${code}" ]] && break
  done
  [[ -n "${code}" ]] || { echo "ERROR: could not find an MFA code for ${email} in user-service logs (checked last 60s, 5 attempts)" >&2; exit 1; }

  curl -s --resolve "${RESOLVE_OPT}" -o "$tmp" -X POST "${BASE}/api/v1/auth/mfa/verify" \
    -H 'Content-Type: application/json' \
    -d "{\"session_id\":\"${session_id}\",\"code\":\"${code}\"}"
  token="$(python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])' < "$tmp")"
  rm -f "$tmp"
  [[ -n "${token}" && "${token}" != "None" ]] || { echo "ERROR: mfa/verify did not return a token for ${email}" >&2; exit 1; }
  echo "${token}"
}

echo "==> Logging in as ${USER_A} and ${USER_B}"
JWT_A="$(login "${USER_A}" "${SEED_PASSWORD}")"
JWT_B="$(login "${USER_B}" "${SEED_PASSWORD}")"
echo "    got JWT_A (${#JWT_A} chars), JWT_B (${#JWT_B} chars)"
echo

# ── Phase 0 — mesh auth itself ──────────────────────────────────────────────
echo "==> Phase 0 — mesh rejects missing/invalid tokens"

req "${BASE}/api/v1/restaurants"
check "no token -> 403" "$HTTP_CODE" "403"

req "${BASE}/api/v1/restaurants" -H "Authorization: Bearer not-a-real-jwt"
check "garbage token -> 401" "$HTTP_CODE" "401"

echo
# ── Phase A — positive control: B sees its own data ─────────────────────────
echo "==> Phase A — customer_b sees its own data (proves the rows exist)"

req "${BASE}/api/v1/restaurants" -H "Authorization: Bearer ${JWT_B}"
check "B restaurants list -> 200" "$HTTP_CODE" "200"
check "B restaurant count"        "$(printf '%s' "$HTTP_BODY" | j_total)" "1"
B_REST_ID="$(printf '%s' "$HTTP_BODY" | j_obj_id restaurants)"

req "${BASE}/api/v1/orders" -H "Authorization: Bearer ${JWT_B}"
check "B orders list -> 200" "$HTTP_CODE" "200"
check "B order count"        "$(printf '%s' "$HTTP_BODY" | j_len orders)" "2"
B_ORDER_IDS="$(printf '%s' "$HTTP_BODY" | j_ids orders)"
B_ORDER_ID="${B_ORDER_IDS%% *}"

B_DELIV_ID=""; B_DELIV_ORDER=""
for oid in $B_ORDER_IDS; do
  req "${BASE}/api/v1/deliveries?orderId=${oid}" -H "Authorization: Bearer ${JWT_B}"
  did="$(printf '%s' "$HTTP_BODY" | j_arr_id)"
  if [[ -n "$did" ]]; then B_DELIV_ID="$did"; B_DELIV_ORDER="$oid"; break; fi
done
[[ -n "$B_DELIV_ID" ]] || { echo "ERROR: no delivery under any customer_b order — seed data problem" >&2; exit 1; }

B_PAY_ID=""; B_PAY_ORDER=""
for oid in $B_ORDER_IDS; do
  req "${BASE}/api/v1/payments?orderId=${oid}" -H "Authorization: Bearer ${JWT_B}"
  pid="$(printf '%s' "$HTTP_BODY" | j_arr_id)"
  if [[ -n "$pid" ]]; then B_PAY_ID="$pid"; B_PAY_ORDER="$oid"; break; fi
done
[[ -n "$B_PAY_ID" ]] || { echo "ERROR: no payment under any customer_b order — seed data problem" >&2; exit 1; }

req "${BASE}/api/v1/restaurants/${B_REST_ID}" -H "Authorization: Bearer ${JWT_B}"
check "B GET own restaurant by id -> 200" "$HTTP_CODE" "200"
req "${BASE}/api/v1/orders/${B_ORDER_ID}" -H "Authorization: Bearer ${JWT_B}"
check "B GET own order by id -> 200" "$HTTP_CODE" "200"
req "${BASE}/api/v1/deliveries/${B_DELIV_ID}" -H "Authorization: Bearer ${JWT_B}"
check "B GET own delivery by id -> 200" "$HTTP_CODE" "200"
req "${BASE}/api/v1/payments/${B_PAY_ID}" -H "Authorization: Bearer ${JWT_B}"
check "B GET own payment by id -> 200" "$HTTP_CODE" "200"

echo
# ── Phase B — isolation: A must not see B's data ────────────────────────────
echo "==> Phase B — customer_a must NOT see customer_b's data"

req "${BASE}/api/v1/restaurants" -H "Authorization: Bearer ${JWT_A}"
check        "A restaurant list is A's own count" "$(printf '%s' "$HTTP_BODY" | j_total)" "2"
check_absent "A restaurant list excludes B's restaurant" "$B_REST_ID" "$(printf '%s' "$HTTP_BODY" | j_ids restaurants)"

req "${BASE}/api/v1/orders" -H "Authorization: Bearer ${JWT_A}"
check "A order list is A's own count" "$(printf '%s' "$HTTP_BODY" | j_len orders)" "4"
A_ORDER_IDS="$(printf '%s' "$HTTP_BODY" | j_ids orders)"
for bid in $B_ORDER_IDS; do
  check_absent "A order list excludes B order ${bid:0:8}…" "$bid" "$A_ORDER_IDS"
done

req "${BASE}/api/v1/restaurants/${B_REST_ID}" -H "Authorization: Bearer ${JWT_A}"
check "A GET B's restaurant by id -> 404" "$HTTP_CODE" "404"
req "${BASE}/api/v1/orders/${B_ORDER_ID}" -H "Authorization: Bearer ${JWT_A}"
check "A GET B's order by id -> 404" "$HTTP_CODE" "404"
req "${BASE}/api/v1/deliveries/${B_DELIV_ID}" -H "Authorization: Bearer ${JWT_A}"
check "A GET B's delivery by id -> 404" "$HTTP_CODE" "404"
req "${BASE}/api/v1/payments/${B_PAY_ID}" -H "Authorization: Bearer ${JWT_A}"
check "A GET B's payment by id -> 404" "$HTTP_CODE" "404"

req "${BASE}/api/v1/deliveries?orderId=${B_DELIV_ORDER}" -H "Authorization: Bearer ${JWT_A}"
check "A list deliveries for B's order -> HTTP 200" "$HTTP_CODE" "200"
check "A list deliveries for B's order -> empty"    "$(printf '%s' "$HTTP_BODY" | j_arr_len)" "0"
req "${BASE}/api/v1/payments?orderId=${B_PAY_ORDER}" -H "Authorization: Bearer ${JWT_A}"
check "A list payments for B's order -> HTTP 200" "$HTTP_CODE" "200"
check "A list payments for B's order -> empty"    "$(printf '%s' "$HTTP_BODY" | j_arr_len)" "0"

echo
# ── Phase C — a client-supplied X-Tenant-ID cannot override the JWT claim ───
echo "==> Phase C — header-spoof defense"

req "${BASE}/api/v1/restaurants" -H "Authorization: Bearer ${JWT_A}" -H "X-Tenant-ID: customer_b"
check "A + spoofed X-Tenant-ID:customer_b -> still 200" "$HTTP_CODE" "200"
check "A + spoofed X-Tenant-ID:customer_b -> still A's count (2)" "$(printf '%s' "$HTTP_BODY" | j_total)" "2"

echo
echo "==> ${PASS} passed, ${FAIL} failed"
(( FAIL == 0 )) || exit 1
echo "==> Tenant isolation holds through the mesh."
```

- [ ] **Step 2: Syntax-check**

```bash
bash -n scripts/tenant-isolation-smoke-test.sh && echo "syntax OK"
command -v shellcheck >/dev/null && shellcheck scripts/tenant-isolation-smoke-test.sh || echo "(shellcheck not installed, skipped)"
```
Run from `customer-app/`. Expected: `syntax OK`.

**Caught during execution:** the first draft had `${SEED_PASSWORD:?ERROR: ...
(the seeded users' password)}"` — the apostrophe in "users'" broke bash's
`${...}` parameter-expansion parsing even inside double quotes
(`bash -n` failed with `syntax error near unexpected token 'fi'`, traced by
bisecting the file with `head -n N | bash -n` down to this exact line).
Reworded to drop the apostrophe: `(password for the seeded users)`. No other
apostrophes in the file are inside live code (the rest are in `#` comments,
which bash never quote-parses), confirmed by the syntax check passing clean
afterward.

- [ ] **Step 3: Commit**

```bash
git add customer-app/scripts/tenant-isolation-smoke-test.sh
git commit -m "test(customer-app): rewrite isolation smoke test to authenticate via JWT (#49)"
```

---

### Task 10: LIVE — run the rewritten smoke test, capture evidence

**Files:**
- Modify: `customer-app/docs/tenant-isolation-evidence.md` (append the new run; keep the Phase 2 run as history, don't delete it)

**Interfaces:**
- Consumes: Task 9's script, Task 8's live seeded users + applied Istio config.

- [ ] **Step 1: Run it**

```bash
cd /home/motadata/itsm-cloudnative-demo-app && git pull
cd customer-app
SEED_PASSWORD='<the same dev password from Task 8>' bash scripts/tenant-isolation-smoke-test.sh; echo "exit: $?"
```
Expected tail: `25 passed, 0 failed` → `Tenant isolation holds through the mesh.` → `exit: 0`.

- [ ] **Step 2: If anything fails, debug via the failing check's own output before re-running**

Each `FAIL` line names the exact assertion and what was expected vs. got —
that's the starting point, not a guess. Re-run only after understanding why
(e.g., a `404` where a `200` was expected on Phase A means the seed data or
the login itself is wrong, not the isolation logic).

- [ ] **Step 3: Append the captured run to the evidence doc**

Add a new section to `customer-app/docs/tenant-isolation-evidence.md`, after
the existing Phase 2 section, following its exact format (see that file for
the pattern: a "Captured run" fenced block with the real output, dated, plus
a one-line **Result**). Head it `## Phase 3 re-verification — via the mesh
(JWT-based)` and note at the top that raw-`X-Tenant-ID` calls now `403` (Phase
2's original method is superseded, not wrong — it tested the DB-level
`search_path` boundary directly, which still holds; this run additionally
proves the mesh-auth boundary).

- [ ] **Step 4: Commit**

```bash
git add customer-app/docs/tenant-isolation-evidence.md
git commit -m "docs(customer-app): capture Phase 3 JWT-based isolation test run — 25/25 pass (#49)"
```

---

### Task 11: LIVE — final guide amendment pass + close-out

**Files:**
- Modify: `customer-app/docs/phase-03-istio-ingress-guide.md` (only if Tasks 7-10 surfaced anything not already documented)
- Modify: `customer-app/TODO.md`

**Interfaces:** none — this is the wrap-up.

- [ ] **Step 1: Confirm the acceptance checklist**

Walk `customer-app/docs/phase-03-istio-ingress-guide.md`'s Acceptance
Checklist against what Tasks 7-10 actually produced. Tick each box only
against real evidence already captured in this session (per
`feedback_verify_done_when_criteria` — "reviewed clean" ≠ "criteria met").

- [ ] **Step 2: Update `customer-app/TODO.md`**

In the Phase 3 section, replace the 3 unchecked items with:

```markdown
- [x] `RequestAuthentication` pointing at user-service's JWKS endpoint (shared identity issuer) — live in `customer-app-dev`, 2026-09-11.
- [x] `Gateway` + `VirtualService` for customer-app routes (dev + qa) — bound to the existing shared `itsm-dev/itsm-gateway` (no new Gateway needed); dev applied and verified live, qa is manifests-only parity (no `customer-app-qa` namespace yet).
- [x] Verify: a valid shared-identity JWT (tenant_id = a `customer_tenants` slug) reaches order-service through the mesh with `X-Tenant-ID`/`X-User-Role` correctly injected — verified live 2026-09-11 (403/401/200 + header-spoof-defense curls, plus the rewritten `tenant-isolation-smoke-test.sh` at 25/25).

**Phase 3 DONE — move #49 to Done on the board.**
```

- [ ] **Step 3: Commit**

```bash
git add customer-app/docs/phase-03-istio-ingress-guide.md customer-app/TODO.md
git commit -m "docs(customer-app): close out Phase 3 — Istio ingress + JWT authn (#49)"
```

---

## Plan Self-Review

**Spec coverage:** §4.1 → Tasks 1, 7. §4.2 → Task 2/3 Step 1. §4.3 → Task 2/3 Step 2. §4.4 (+ file removals) → Task 2/3 Step 3. §4.5 → Task 5. §4.6 → Task 9's `login()` (verified against the actual `auth.go`/`models` JSON field names: `session_id`, `code`, `token`, all snake_case, and the `slog.NewJSONHandler` log format — the spec's draft grep assumed key=value text; the plan corrects it to JSON parsing). §4.7 → Task 4. §4.8 → Task 9. §5 verification → Task 8 Steps 1-3, Task 10. §6 file inventory → matches Tasks 1-5, 9-11 exactly, including both `git rm`s. §7 risks → each has a concrete mitigation step in Tasks 7/8/10. §8 rollback → Task 6's guide.

**Type/shape consistency:** `login()`'s JSON keys (`session_id`, `code`, `token`) match `models.MfaRequiredResponse`, `models.MfaVerifyRequest`, `models.LoginResponse` exactly (verified against `platform-app/services/user-service/internal/models` and `auth.go`, not assumed). The MFA-code log line is JSON (`slog.NewJSONHandler` in `cmd/main.go`) — Task 9's extraction parses it as JSON, not text. Assertion counts: Phase 0 (2) + Phase A (8) + Phase B (13) + Phase C (2) = 25, matching every "25 passed" reference in Tasks 9-11 and the spec.

**No placeholders:** every YAML/bash file above is complete, runnable content — none are excerpts or "same as Task N" pointers.

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-11-customer-app-istio-ingress-jwt-authn.md`.**

Given that Tasks 7, 8, 10, and 11's live steps require `kubectl`/`psql`/`istioctl` against `kubernetes-master`, which only this interactive session can reach (no subagent or CI runner has that access), **Inline Execution is the realistic choice** — Tasks 1-6 and 9 are pure local file edits any executor could do, but splitting the plan across two execution modes adds overhead for no benefit here. Recommend: **Inline Execution** (`superpowers:executing-plans`), running Tasks 1-6 and 9 in this session, then handing you the exact commands for the live tasks (7, 8, 10, 11) one at a time, same as Phases 1 and 2.

Which approach do you want?

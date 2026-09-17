# Customer App — OPA Rego RBAC Policy (Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire OPA's existing RBAC layer into customer-app, so a role lacking
permission is denied by OPA (403) before it ever reaches a service — closing
customer-app's last authz gap (root `CLAUDE.md` §3's two-layer model).

**Architecture:** Reuse the single existing shared OPA pod (`itsm-dev/opa`)
rather than standing up a second instance. Extract its inline Rego policy
into a standalone, `opa test`-able file (no behavior change). Add one new
`AuthorizationPolicy` (CUSTOM action) per env in `customer-app-dev`/`-qa`
pointing at the already-registered `opa-authz` extensionProvider. No new
Rego `allow` rules are needed — confirmed empirically (see spec §3 Decision
1): the existing unscoped `allow if { role == "admin" }` already covers
customer-app's admin users, and no existing rule matches customer-app's
paths for any other role, so they're already denied by
`default allow := false`.

**Tech Stack:** OPA 0.65.0-envoy (already deployed), Rego (`opa test`
framework), Istio `AuthorizationPolicy` CUSTOM action, bash (existing
`apply-istio-config.sh` pattern).

**Spec:** `docs/superpowers/specs/2026-09-17-customer-app-opa-rbac-design.md`

## Global Constraints

- **Never `git commit` or `git push`.** Every task's final step is "stop for
  review," not "commit" — root `CLAUDE.md` §13 and
  `docs/superpowers/specs/...` conventions elsewhere in this repo assume
  commits happen, but this repo's owner reviews and commits everything
  themselves. Do not run `git add`/`git commit`/`git push` at any point in
  this plan, even though the task template below still logs "what changed"
  for the reviewer.
- Root `CLAUDE.md` §2: check live cluster state via the kubernetes MCP
  server or a session with real `kubectl` access before writing/applying any
  K8s manifest — do not assume drift-free state from memory. In practice
  (established during Phase 3), the only reachable `kubectl`/`opa`-against-
  live-cluster access is from an interactive session on `kubernetes-master`
  itself; local machines in this project have unrelated `kubectl` contexts.
- Root `CLAUDE.md` §4: HPA min=1/max=2, do not change. This plan adds no new
  Deployment, so it doesn't touch HPA at all.
- `opa` CLI is available locally (verified: v1.15.2) and runs the policy
  file correctly against the same Rego syntax the deployed 0.65.0-envoy
  image uses (`import future.keywords.if`/`in`) — Tasks 1–2 need no cluster
  access at all, only local `opa test`.

---

### Task 1: Extract `authz.rego` + regression tests for platform-app's existing rules

**Files:**
- Create: `platform-app/infra/k8s/opa/authz.rego`
- Create: `platform-app/infra/k8s/opa/authz_test.rego`
- Modify: `platform-app/infra/k8s/opa/policy-configmap.yaml` (header comment
  only — no rule changes)

**Interfaces:**
- Produces: `platform-app/infra/k8s/opa/authz.rego`, an exact byte-for-byte
  copy of `policy-configmap.yaml`'s current `data.authz.rego` block —
  package `envoy.authz`, rule names `public`/`allow`, inputs
  `method`/`path`/`role` read from `input.attributes.request.http.*` — that
  Task 2's tests and future `opa test` runs load directly.

- [ ] **Step 1: Create `platform-app/infra/k8s/opa/authz.rego`**

```rego
# Extracted from platform-app/infra/k8s/opa/policy-configmap.yaml's
# data.authz.rego block, byte-for-byte — this file exists so `opa test` has
# something to run against; the ConfigMap stays the deployed source of
# truth. If you edit the policy, edit BOTH and keep them in sync (opa test
# will not catch drift between them — it only tests this file).
package envoy.authz

import future.keywords.if
import future.keywords.in

default allow := false

# ── Helpers ────────────────────────────────────────────────────────────────
method := input.attributes.request.http.method
path   := input.attributes.request.http.path
role   := input.attributes.request.http.headers["x-user-role"]

# ── Public paths — allow without JWT ──────────────────────────────────────
# Login endpoint
public if { path == "/api/v1/auth/login" }
# MFA endpoints — a user has no JWT yet at this point in the flow
public if { path == "/api/v1/auth/mfa/send" }
public if { path == "/api/v1/auth/mfa/verify" }
# JWKS endpoint (Istio fetches this)
public if { startswith(path, "/api/v1/.well-known/") }
# Health checks on any service
public if { endswith(path, "/health") }
# All non-API paths: Next.js pages, _next/static, favicons, etc.
public if { not startswith(path, "/api/v1/") }

allow if { public }

# ── Admin — full access to all API paths ───────────────────────────────────
allow if { role == "admin" }

# ── Agent — read/write on incidents and assets; read-only on users ─────────
allow if {
  role == "agent"
  startswith(path, "/api/v1/incidents")
  method in {"GET", "POST", "PUT", "PATCH", "DELETE"}
}
allow if {
  role == "agent"
  startswith(path, "/api/v1/assets")
  method in {"GET", "POST", "PUT", "PATCH"}
}
allow if {
  role == "agent"
  startswith(path, "/api/v1/users")
  method == "GET"
}

# ── Viewer — read-only on incidents and assets ─────────────────────────────
allow if {
  role == "viewer"
  startswith(path, "/api/v1/incidents")
  method == "GET"
}
allow if {
  role == "viewer"
  startswith(path, "/api/v1/assets")
  method == "GET"
}
```

- [ ] **Step 2: Create `platform-app/infra/k8s/opa/authz_test.rego`**

```rego
package envoy.authz

import future.keywords.if

# ── Public paths ─────────────────────────────────────────────────────────
test_public_login_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/auth/login", "headers": {}
  }}}}
}

test_public_mfa_send_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/auth/mfa/send", "headers": {}
  }}}}
}

test_public_jwks_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/.well-known/jwks.json", "headers": {}
  }}}}
}

test_public_health_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/incidents/health", "headers": {}
  }}}}
}

test_public_non_api_path_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/_next/static/chunk.js", "headers": {}
  }}}}
}

# ── Admin ────────────────────────────────────────────────────────────────
test_admin_allowed_any_path if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "DELETE", "path": "/api/v1/users/123", "headers": {"x-user-role": "admin"}
  }}}}
}

# ── Agent ────────────────────────────────────────────────────────────────
test_agent_allowed_incidents_write if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/incidents", "headers": {"x-user-role": "agent"}
  }}}}
}

test_agent_allowed_assets_write if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "PUT", "path": "/api/v1/assets/1", "headers": {"x-user-role": "agent"}
  }}}}
}

test_agent_denied_assets_delete if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "DELETE", "path": "/api/v1/assets/1", "headers": {"x-user-role": "agent"}
  }}}}
}

test_agent_allowed_users_read if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/users", "headers": {"x-user-role": "agent"}
  }}}}
}

test_agent_denied_users_write if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/users", "headers": {"x-user-role": "agent"}
  }}}}
}

# ── Viewer ───────────────────────────────────────────────────────────────
test_viewer_allowed_incidents_read if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/incidents", "headers": {"x-user-role": "viewer"}
  }}}}
}

test_viewer_denied_incidents_write if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/incidents", "headers": {"x-user-role": "viewer"}
  }}}}
}

# ── Default deny ─────────────────────────────────────────────────────────
test_no_role_denied_protected_path if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/incidents", "headers": {}
  }}}}
}

test_unknown_role_denied_protected_path if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/incidents", "headers": {"x-user-role": "nobody"}
  }}}}
}
```

- [ ] **Step 3: Run the tests**

```bash
opa test platform-app/infra/k8s/opa/authz.rego platform-app/infra/k8s/opa/authz_test.rego -v
```

(`opa test <dir>` fails with "merge error" — it also tries to parse the
non-Rego YAML files in that directory. Target the two `.rego` files
explicitly.)

Expected: `PASS: 15/15` (all regression tests pass immediately — this task
changes no behavior, it only makes today's behavior testable).

- [ ] **Step 4: Add a sync-pointer comment to `policy-configmap.yaml`**

In `platform-app/infra/k8s/opa/policy-configmap.yaml`, insert this comment
immediately above `data:` (line 6), no other changes to the file:

```yaml
# The Rego policy below is kept byte-for-byte in sync with
# platform-app/infra/k8s/opa/authz.rego (the opa-test-able copy). Edit both.
```

- [ ] **Step 5: Stop for review**

Do not commit. Run `git status --short` and `git diff --stat` and summarize
what changed for the reviewer: 2 new files, 1 one-line comment addition.

---

### Task 2: Add customer-app test coverage (proves the existing rule already covers it)

**Files:**
- Modify: `platform-app/infra/k8s/opa/authz_test.rego`

**Interfaces:**
- Consumes: `allow` from `platform-app/infra/k8s/opa/authz.rego` (Task 1) —
  no changes to that file in this task.

- [ ] **Step 1: Append customer-app test cases to `authz_test.rego`**

```rego
# ── Customer-app (Phase 4) ───────────────────────────────────────────────
# No new allow rules needed for these — the existing unscoped
# `allow if { role == "admin" }` already covers them, and no existing
# agent/viewer rule mentions these paths, so default allow := false already
# denies non-admin roles. See
# docs/superpowers/specs/2026-09-17-customer-app-opa-rbac-design.md §3
# Decision 1 for the full reasoning.

test_admin_allowed_customer_app_restaurants if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/restaurants", "headers": {"x-user-role": "admin"}
  }}}}
}

test_admin_allowed_customer_app_orders if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/orders", "headers": {"x-user-role": "admin"}
  }}}}
}

test_admin_allowed_customer_app_deliveries if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "PUT", "path": "/api/v1/deliveries/1/status", "headers": {"x-user-role": "admin"}
  }}}}
}

test_admin_allowed_customer_app_payments if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/payments", "headers": {"x-user-role": "admin"}
  }}}}
}

test_viewer_denied_customer_app_restaurants if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/restaurants", "headers": {"x-user-role": "viewer"}
  }}}}
}

test_agent_denied_customer_app_orders if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/orders", "headers": {"x-user-role": "agent"}
  }}}}
}

test_no_role_denied_customer_app_payments if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/payments", "headers": {}
  }}}}
}

test_customer_app_health_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/health", "headers": {}
  }}}}
}
```

- [ ] **Step 2: Run the tests**

```bash
opa test platform-app/infra/k8s/opa/authz.rego platform-app/infra/k8s/opa/authz_test.rego -v
```

Expected: `PASS: 23/23` — all 15 from Task 1 plus these 8, with zero changes
to `authz.rego`. If any of the 8 new tests fail, STOP — that means the
"no new rules needed" premise (spec §3 Decision 1) was wrong, and this task
needs to add real `allow` rules instead of just tests. Do not proceed to
Task 3 on a failing assumption.

- [ ] **Step 3: Stop for review**

Do not commit. Summarize: 1 file modified (`authz_test.rego`, +8 tests),
`opa test` output showing 21/21.

---

### Task 3: Create customer-app's OPA `AuthorizationPolicy` manifests

**Files:**
- Create: `customer-app/infra/k8s/istio/authorization-policies/dev/authz-opa-rbac.yaml`
- Create: `customer-app/infra/k8s/istio/authorization-policies/qa/authz-opa-rbac.yaml`

**Interfaces:**
- Consumes: the `opa-authz` extensionProvider, already registered mesh-wide
  in `platform-app/infra/istio/istio-operator.yaml` (unchanged by this
  plan) — pointing at `opa.itsm-dev.svc.cluster.local:9191`.
- Produces: a new Istio `AuthorizationPolicy` object named
  `customer-app-opa-rbac` in each of `customer-app-dev`/`customer-app-qa`,
  for Task 4's `apply-istio-config.sh` step and Task 5's live apply to
  consume by file path.

- [ ] **Step 1: Create the dev manifest**

`customer-app/infra/k8s/istio/authorization-policies/dev/authz-opa-rbac.yaml`:

```yaml
# AuthorizationPolicy — Layer 2 RBAC: delegates to the shared OPA instance
# (itsm-dev/opa) via the "opa-authz" provider already registered mesh-wide
# in platform-app/infra/istio/istio-operator.yaml. Same provider
# platform-app's own opa-authz AuthorizationPolicy (itsm-dev) uses — see
# docs/superpowers/specs/2026-09-17-customer-app-opa-rbac-design.md for why
# a dedicated customer-app OPA instance wasn't needed.
#
# No new Rego rules exist for customer-app specifically: the existing
# unscoped `allow if { role == "admin" }` in
# platform-app/infra/k8s/opa/authz.rego already covers customer-app's admin
# users, and no existing rule matches these paths for any other role, so
# they're already denied by default.

apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: customer-app-opa-rbac
  namespace: customer-app-dev
spec:
  action: CUSTOM
  provider:
    name: opa-authz
  rules:
    - to:
        - operation:
            paths:
              - /api/v1/restaurants*
              - /api/v1/orders*
              - /api/v1/deliveries*
              - /api/v1/payments*
```

- [ ] **Step 2: Create the qa manifest**

`customer-app/infra/k8s/istio/authorization-policies/qa/authz-opa-rbac.yaml`:

```yaml
# AuthorizationPolicy — Layer 2 RBAC, qa parity manifest.
# See dev/authz-opa-rbac.yaml for the full rationale.
#
# References "opa-authz" (the itsm-dev provider), not "opa-authz-qa" —
# customer-app-qa doesn't have its own identity engine or OPA instance
# either (see customer-app/infra/k8s/istio/request-authentication/qa/
# request-auth.yaml's own comment on this same pattern). Not applied by
# apply-istio-config.sh until customer-app-qa exists as a live namespace.

apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: customer-app-opa-rbac
  namespace: customer-app-qa
spec:
  action: CUSTOM
  provider:
    name: opa-authz
  rules:
    - to:
        - operation:
            paths:
              - /api/v1/restaurants*
              - /api/v1/orders*
              - /api/v1/deliveries*
              - /api/v1/payments*
```

- [ ] **Step 3: Validate both files parse as valid YAML**

```bash
python3 -c "
import yaml
for f in [
    'customer-app/infra/k8s/istio/authorization-policies/dev/authz-opa-rbac.yaml',
    'customer-app/infra/k8s/istio/authorization-policies/qa/authz-opa-rbac.yaml',
]:
    with open(f) as fh:
        doc = yaml.safe_load(fh)
    assert doc['kind'] == 'AuthorizationPolicy'
    assert doc['spec']['action'] == 'CUSTOM'
    assert doc['spec']['provider']['name'] == 'opa-authz'
    print(f, 'OK')
"
```

Expected: both files print `OK`. (Not using `kubectl apply --dry-run`
here — local `kubectl` in this environment points at an unrelated cluster;
schema validity gets a real check in Task 5 against the live cluster.)

- [ ] **Step 4: Stop for review**

Do not commit. Summarize: 2 new files, YAML validation output.

---

### Task 4: Wire `apply-istio-config.sh` to apply the new policy

**Files:**
- Modify: `customer-app/scripts/apply-istio-config.sh:73-76` (the `[4/5]`
  step and the step-count comments)

**Interfaces:**
- Consumes: `customer-app/infra/k8s/istio/authorization-policies/${ENV}/authz-opa-rbac.yaml`
  (Task 3).

- [ ] **Step 1: Insert the new apply step**

In `customer-app/scripts/apply-istio-config.sh`, the current steps 4-5
(lines 73-77) read:

```bash
echo "    [4/5] Applying deny-unauthenticated AuthorizationPolicy..."
kubectl apply -f "${ISTIO_DIR}/authorization-policies/${ENV}/authz-deny-unauthenticated.yaml"

echo "    [5/5] All pods 2/2 confirmed - applying PeerAuthentication STRICT mTLS..."
kubectl apply -f "${ISTIO_DIR}/peer-authentication/${ENV}/peer-auth-mtls.yaml"
```

Replace with (renumbering 4/5→4/6, 5/5→6/6, inserting the new step between
them — OPA RBAC composes fine either before or after STRICT mTLS lock-in,
but grouping it with the other AuthorizationPolicy keeps both authz-layer
steps adjacent):

```bash
echo "    [4/6] Applying deny-unauthenticated AuthorizationPolicy..."
kubectl apply -f "${ISTIO_DIR}/authorization-policies/${ENV}/authz-deny-unauthenticated.yaml"

echo "    [5/6] Applying OPA RBAC AuthorizationPolicy..."
kubectl apply -f "${ISTIO_DIR}/authorization-policies/${ENV}/authz-opa-rbac.yaml"

echo "    [6/6] All pods 2/2 confirmed - applying PeerAuthentication STRICT mTLS..."
kubectl apply -f "${ISTIO_DIR}/peer-authentication/${ENV}/peer-auth-mtls.yaml"
```

- [ ] **Step 2: Check the script's syntax**

```bash
bash -n customer-app/scripts/apply-istio-config.sh
```

Expected: no output (syntax OK).

- [ ] **Step 3: Stop for review**

Do not commit. Summarize: 1 file modified (renumbered steps 4-5→4-6, new
step inserted), `bash -n` result.

---

### Task 5 (LIVE — requires a session with real `kubectl`/`opa` access to `kubernetes-master`): Apply and verify

**This task cannot run from a normal repo checkout or a fresh subagent.**
Per Phase 3's own precedent, only an interactive session with a shell on
`kubernetes-master` can reach the live cluster — hand these exact commands
to that session and paste the output back for the next step.

**Files:** none (live cluster state only — Tasks 1-4's files must already
be present on `kubernetes-master`, i.e. `git pull` there first).

**Interfaces:**
- Consumes: `customer-app/infra/k8s/istio/authorization-policies/dev/authz-opa-rbac.yaml`
  (Task 3), the updated `apply-istio-config.sh` (Task 4).

- [ ] **Step 1: Pull the latest changes onto `kubernetes-master` and apply the new policy**

```bash
cd /home/motadata/itsm-cloudnative-demo-app
git pull origin main
cd customer-app
ENV=dev bash scripts/apply-istio-config.sh
```

Expected: ends with the active-policies listing now including
`customer-app-opa-rbac` under `AuthorizationPolicy`.

- [ ] **Step 2: Seed one temporary non-admin customer-app user**

```bash
export DATABASE_URL="postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
  INSERT INTO public.users (email, password_hash, full_name, role, tenant_id, is_active)
  VALUES (
    'staff@customer-a.example',
    (SELECT password_hash FROM public.users WHERE email = 'owner@customer-a.example'),
    'Staff (customer_a)', 'viewer', 'customer_a', true
  )
  ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash, role = 'viewer',
        tenant_id = 'customer_a', is_active = true;
"
```

This reuses `owner@customer-a.example`'s already-known password hash (from
the `DevPass123!` seeded in Phase 3), so no new password needs tracking —
same login flow, `role: viewer` instead of `admin`.

- [ ] **Step 3: Get a JWT for the non-admin user and confirm OPA denies it**

```bash
NODE_IP="$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')"
AUTH_BASE="http://${NODE_IP}:30080"
RESOLVE="--resolve customer-app.dev.local:30080:${NODE_IP}"

SESSION_ID=$(curl -s -X POST ${AUTH_BASE}/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"staff@customer-a.example","password":"DevPass123!"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["session_id"])')

curl -s -X POST ${AUTH_BASE}/api/v1/auth/mfa/send \
  -H 'Content-Type: application/json' -d "{\"session_id\":\"$SESSION_ID\"}" > /dev/null

CODE=$(kubectl logs -n itsm-dev deploy/user-service --since=60s \
  | grep 'dev-mode: MFA OTP' | grep '"email":"staff@customer-a.example"' | tail -1 \
  | python3 -c 'import sys,json; print(json.loads(sys.stdin.readline())["code"])')

JWT_STAFF=$(curl -s -X POST ${AUTH_BASE}/api/v1/auth/mfa/verify \
  -H 'Content-Type: application/json' \
  -d "{\"session_id\":\"$SESSION_ID\",\"code\":\"$CODE\"}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

echo "=== expect 403 (OPA denies viewer role) ==="
curl -s -o /dev/null -w '%{http_code}\n' $RESOLVE \
  -H "Authorization: Bearer $JWT_STAFF" http://customer-app.dev.local:30080/api/v1/restaurants
```

Expected: `403`. If this is `200`, STOP — OPA isn't enforcing yet, don't
proceed to Step 4 on that assumption; check `kubectl get authorizationpolicy
-n customer-app-dev` and OPA's decision log
(`kubectl logs -n itsm-dev deploy/opa --since=2m`) before continuing.

- [ ] **Step 4: Confirm the existing admin JWT is unaffected**

```bash
SESSION_ID=$(curl -s -X POST ${AUTH_BASE}/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@customer-a.example","password":"DevPass123!"}' \
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

echo "=== expect 200, total 2 (admin unaffected) ==="
curl -s $RESOLVE -H "Authorization: Bearer $JWT_A" \
  http://customer-app.dev.local:30080/api/v1/restaurants | python3 -m json.tool
```

Expected: `200`, `"total": 2`.

- [ ] **Step 5: Re-run the full tenant-isolation smoke test — must still be 25/25**

```bash
cd /home/motadata/itsm-cloudnative-demo-app/customer-app
SEED_PASSWORD='DevPass123!' bash scripts/tenant-isolation-smoke-test.sh
```

Expected: `25 passed, 0 failed`. This proves OPA's new enforcement doesn't
break the existing admin-JWT tenant-isolation path.

- [ ] **Step 6: Remove the temporary test user**

```bash
psql "$DATABASE_URL" -c "DELETE FROM public.users WHERE email = 'staff@customer-a.example';"
```

- [ ] **Step 7: Report back**

Paste all output from Steps 1-6 back for evaluation before Task 6.

---

### Task 6: Close out Phase 4 in `customer-app/TODO.md`

**Files:**
- Modify: `customer-app/TODO.md` (Phase 4 section)

**Interfaces:** none — this is the wrap-up, consumes Task 5's confirmed
live results.

- [ ] **Step 1: Update the Phase 4 checklist**

Replace the Phase 4 section's 3 unchecked items with:

```markdown
## Phase 4 — OPA Rego RBAC policy for customer-app
**GitHub: [#50](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/50)**

- [x] Rego rules: role + HTTP method + path, mirroring platform-app's `infra/k8s/opa/` pattern — **no new rules needed**: the existing unscoped `allow if { role == "admin" }` already covers customer-app's admin users, confirmed via `opa test`. Rego extracted into a standalone, testable `platform-app/infra/k8s/opa/authz.rego` (kept in sync with `policy-configmap.yaml`) since no such file existed on `main`.
- [x] Policy test file — `platform-app/infra/k8s/opa/authz_test.rego`, 21 tests (13 platform-app regression + 8 customer-app), all passing.
- [x] Verify live: a valid JWT with a role lacking permission is denied by OPA, not the service — verified live 2026-09-17: `role: viewer` JWT → `403` from OPA on `/api/v1/restaurants`; existing `role: admin` JWT unaffected (`200`); full `tenant-isolation-smoke-test.sh` still 25/25 after.

**Phase 4 DONE — #50 not yet moved to Done on the board (repo owner's call, per project policy on GitHub actions).**
```

- [ ] **Step 2: Stop for review**

Do not commit. Summarize the final diff across all 6 tasks for the user:
`git status --short` and `git diff --stat` against the full set of files
touched by this plan.

---

## Plan Self-Review

**Spec coverage:** §3 Decision 1 (no new rules, admin already covered) →
Task 2 proves it empirically via tests, Task 5 Step 3-4 proves it live. §3
Decision 2 (shared pod, no restart needed) → Task 5 never restarts `opa`,
only applies a new `AuthorizationPolicy`. §3 Decision 3 (same file) → Task 1
extracts `authz.rego` from the existing `policy-configmap.yaml`, no split.
§3 Decision 4 (temporary non-admin user) → Task 5 Step 2/6. §4.1 → Task 1
(no-op, documented). §4.2 → Task 3. §4.3 → Tasks 1-2. §4.4 → Task 5. §5
Files → matches Tasks 1, 3, 4, 6 exactly. §6 Risks → the sync-drift risk has
its own step (Task 1 Step 4's comment); the "no agent/viewer coverage" risk
is explicitly out of scope, no task needed. §7 Rollback → not a task (it's
a single `kubectl delete`, documented in the spec, not needed unless
something goes wrong).

**No placeholders:** every Rego/YAML/bash block above is complete, runnable
content — none are excerpts or "same as Task N" pointers. All test case
inputs are concrete JSON matching Envoy's actual `ext_authz` input shape.

**Type/signature consistency:** every test in Tasks 1-2 calls `allow` (the
single exported rule name in `authz.rego`) with the same
`input.attributes.request.http.{method,path,headers}` shape the policy
itself reads from (verified by actually running `opa test` locally against
this exact content before writing the plan — 3/3 passed in the spot-check).
`policy-configmap.yaml`'s AuthorizationPolicy references (`opa-authz`
provider name) match exactly what Task 3's new manifests reference — no
new provider name invented.

---

Given Task 5 requires live `kubernetes-master` access that only this
interactive session (via the user's pasted terminal output) can reach —
same constraint Phase 3's plan hit — and Tasks 1-4 are small, local, and
`opa test`/`bash -n`-verifiable without any cluster dependency, splitting
this across two execution modes adds more overhead than it saves at this
size.

**Recommend: Inline Execution** (`superpowers:executing-plans`) — Tasks 1-4
run in this session with local verification, then Task 5's exact commands
get handed to you one block at a time (same pattern as Phase 3), and Task 6
closes out once Task 5's live results are back.

Which approach do you want?

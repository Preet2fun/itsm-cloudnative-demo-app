# Platform Staff OPA Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `platform_admin`/`platform_analyst` JWTs working OPA authorization on `/api/v1/users`, closing GitHub issue #48 ("OPA Rego policy has no rules for platform_admin/platform_analyst").

**Architecture:** Extract the Rego policy currently embedded inline in `platform-app/infra/k8s/opa/policy-configmap.yaml` into a standalone, `opa test`-able `authz.rego` file (kept byte-for-byte in sync with the ConfigMap's `data.authz.rego` block); add two new `allow` rules to it following the file's existing per-role pattern; cover both with `opa test` unit tests (RED before the rules exist, GREEN after); wire `opa test` into CI; document the deploy/verify steps in the existing Phase 6 guide.

**Tech Stack:** Open Policy Agent (Rego), `opa` CLI (v1.15.2 confirmed installed locally; CI pins v1.20.1), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-03-platform-staff-opa-authz-design.md`

## Global Constraints

- New rules apply **only** to `/api/v1/users` — never widen scope to `/api/v1/assets` or `/api/v1/incidents` (those services hard-require `X-Tenant-ID`, which platform staff never carry; see spec §2).
- `platform_admin` gets `GET`/`POST`/`PUT`/`PATCH`/`DELETE` on `/api/v1/users*` (full access, no carve-outs — matches existing `admin` precedent, including `ChangePassword`).
- `platform_analyst` gets `GET` only on `/api/v1/users*`.
- Do not modify the existing `admin`/`agent`/`viewer` rule bodies — only add new blocks.
- `platform-app/infra/k8s/opa/authz.rego` and the `data.authz.rego` block inside `policy-configmap.yaml` must always be kept byte-identical in Rego content (ConfigMap adds YAML wrapping/indentation only).
- No new dependencies without asking the user first (per root `CLAUDE.md` §7) — this plan introduces none (OPA is already installed/used in the cluster; the `opa` CLI is a local/CI dev tool, not a runtime dependency).

---

## Task 1: Extract the inline policy into a standalone, testable `authz.rego`

This is a refactor with **no behavior change** — it ports the exact rules
that already exist inside the ConfigMap into a real `.rego` file so `opa
test` can exercise them, and adds baseline regression tests proving nothing
moved. No new production logic here, so tests passing immediately is
expected and correct (per TDD's "add tests for existing code" case) — this
task is the safety net Task 2's real RED/GREEN cycle builds on.

**Files:**
- Create: `platform-app/infra/k8s/opa/authz.rego`
- Create: `platform-app/infra/k8s/opa/authz_test.rego`

**Interfaces:**
- Produces: `authz.rego` (package `envoy.authz`, rule `allow`) and
  `authz_test.rego` (baseline `test_*` rules) — Task 2 adds to both files;
  Task 3/4 reference `platform-app/infra/k8s/opa/` as the directory `opa
  test` runs against.

- [ ] **Step 1: Create `authz.rego` with the exact current policy content**

Copy verbatim (dedented from the ConfigMap's 4-space YAML block-scalar
indent) — this must match `policy-configmap.yaml`'s current
`data.authz.rego` value exactly:

```rego
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

- [ ] **Step 2: Create `authz_test.rego` with baseline regression tests**

```rego
package envoy.authz

import future.keywords.if

test_public_login_allowed_without_role if {
	allow with input as {"attributes": {"request": {"http": {
		"method": "POST",
		"path": "/api/v1/auth/login",
		"headers": {},
	}}}}
}

test_admin_allowed_full_access if {
	allow with input as {"attributes": {"request": {"http": {
		"method": "DELETE",
		"path": "/api/v1/incidents/123",
		"headers": {"x-user-role": "admin"},
	}}}}
}

test_agent_allowed_write_incidents if {
	allow with input as {"attributes": {"request": {"http": {
		"method": "POST",
		"path": "/api/v1/incidents",
		"headers": {"x-user-role": "agent"},
	}}}}
}

test_agent_denied_delete_assets if {
	not allow with input as {"attributes": {"request": {"http": {
		"method": "DELETE",
		"path": "/api/v1/assets/1",
		"headers": {"x-user-role": "agent"},
	}}}}
}

test_viewer_allowed_read_assets if {
	allow with input as {"attributes": {"request": {"http": {
		"method": "GET",
		"path": "/api/v1/assets",
		"headers": {"x-user-role": "viewer"},
	}}}}
}

test_viewer_denied_write_incidents if {
	not allow with input as {"attributes": {"request": {"http": {
		"method": "POST",
		"path": "/api/v1/incidents",
		"headers": {"x-user-role": "viewer"},
	}}}}
}
```

- [ ] **Step 3: Run the tests and confirm all pass**

Run: `opa test platform-app/infra/k8s/opa/ -v`
Expected: `PASS: 6/6` (all six `test_*` rules pass — this proves the
extraction is behaviorally identical to the ConfigMap's current content).

- [ ] **Step 4: Commit**

```bash
git add platform-app/infra/k8s/opa/authz.rego platform-app/infra/k8s/opa/authz_test.rego
git commit -m "test: extract OPA policy to standalone authz.rego with baseline coverage"
```

---

## Task 2: Add `platform_admin`/`platform_analyst` rules (TDD)

**Files:**
- Modify: `platform-app/infra/k8s/opa/authz_test.rego`
- Modify: `platform-app/infra/k8s/opa/authz.rego`
- Modify: `platform-app/infra/k8s/opa/policy-configmap.yaml`

**Interfaces:**
- Consumes: `authz.rego`/`authz_test.rego` from Task 1.
- Produces: `authz.rego` and `policy-configmap.yaml` both carrying the two
  new `allow` rules, byte-identical to each other — Task 4's live
  verification and deployment-guide update depend on this exact rule shape.

- [ ] **Step 1: Add failing tests for both new roles**

Append to `platform-app/infra/k8s/opa/authz_test.rego`:

```rego
test_platform_admin_allowed_full_access_on_users if {
	allow with input as {"attributes": {"request": {"http": {
		"method": "DELETE",
		"path": "/api/v1/users/42",
		"headers": {"x-user-role": "platform_admin"},
	}}}}
}

test_platform_admin_denied_on_assets if {
	not allow with input as {"attributes": {"request": {"http": {
		"method": "GET",
		"path": "/api/v1/assets",
		"headers": {"x-user-role": "platform_admin"},
	}}}}
}

test_platform_admin_denied_on_incidents if {
	not allow with input as {"attributes": {"request": {"http": {
		"method": "GET",
		"path": "/api/v1/incidents",
		"headers": {"x-user-role": "platform_admin"},
	}}}}
}

test_platform_analyst_allowed_read_on_users if {
	allow with input as {"attributes": {"request": {"http": {
		"method": "GET",
		"path": "/api/v1/users/42",
		"headers": {"x-user-role": "platform_analyst"},
	}}}}
}

test_platform_analyst_denied_write_on_users if {
	not allow with input as {"attributes": {"request": {"http": {
		"method": "POST",
		"path": "/api/v1/users",
		"headers": {"x-user-role": "platform_analyst"},
	}}}}
}

test_platform_analyst_denied_on_assets if {
	not allow with input as {"attributes": {"request": {"http": {
		"method": "GET",
		"path": "/api/v1/assets",
		"headers": {"x-user-role": "platform_analyst"},
	}}}}
}
```

- [ ] **Step 2: Run tests and confirm the new ones fail for the right reason**

Run: `opa test platform-app/infra/k8s/opa/ -v`
Expected: `FAIL: 2/10` — specifically
`test_platform_admin_allowed_full_access_on_users` and
`test_platform_analyst_allowed_read_on_users` fail (they assert `allow`,
but no rule matches `platform_admin`/`platform_analyst` yet, so `allow`
stays `false`). The other four new tests
(`test_platform_admin_denied_on_assets`,
`test_platform_admin_denied_on_incidents`,
`test_platform_analyst_denied_write_on_users`,
`test_platform_analyst_denied_on_assets`) pass trivially already — nothing
allows those roles yet, so asserting `not allow` is vacuously true. The two
`_allowed_` tests are the only real RED signal here. If any other test
fails (including the six baseline tests from Task 1), stop and investigate
before proceeding — that means the mock `input` shape is wrong, not that
the feature is missing.

- [ ] **Step 3: Add the two new rules to `authz.rego`**

Append to the end of `platform-app/infra/k8s/opa/authz.rego` (after the
final `viewer` block):

```rego

# ── Platform Admin — full access to the shared identity API ───────────────
allow if {
  role == "platform_admin"
  startswith(path, "/api/v1/users")
  method in {"GET", "POST", "PUT", "PATCH", "DELETE"}
}

# ── Platform Analyst — read-only on the shared identity API ───────────────
allow if {
  role == "platform_analyst"
  startswith(path, "/api/v1/users")
  method == "GET"
}
```

- [ ] **Step 4: Sync the same two rules into `policy-configmap.yaml`**

In `platform-app/infra/k8s/opa/policy-configmap.yaml`, the file currently
ends (after this repo's existing content) with the `viewer` block closing
at:

```yaml
    allow if {
      role == "viewer"
      startswith(path, "/api/v1/assets")
      method == "GET"
    }
```

Insert immediately after that block, preserving the file's 4-space
block-scalar indentation:

```yaml

    # ── Platform Admin — full access to the shared identity API ───────────────
    allow if {
      role == "platform_admin"
      startswith(path, "/api/v1/users")
      method in {"GET", "POST", "PUT", "PATCH", "DELETE"}
    }

    # ── Platform Analyst — read-only on the shared identity API ───────────────
    allow if {
      role == "platform_analyst"
      startswith(path, "/api/v1/users")
      method == "GET"
    }
```

Validate the YAML still parses:
`python3 -c "import yaml; yaml.safe_load(open('platform-app/infra/k8s/opa/policy-configmap.yaml'))"`
Expected: no output (no exception raised).

- [ ] **Step 5: Run tests and confirm all pass**

Run: `opa test platform-app/infra/k8s/opa/ -v`
Expected: `PASS: 12/12`

- [ ] **Step 6: Commit**

```bash
git add platform-app/infra/k8s/opa/authz.rego platform-app/infra/k8s/opa/authz_test.rego platform-app/infra/k8s/opa/policy-configmap.yaml
git commit -m "feat: add platform_admin/platform_analyst OPA rules for /api/v1/users"
```

---

## Task 3: Wire `opa test` into CI

**Files:**
- Modify: `.github/workflows/ci-lint.yml`

**Interfaces:**
- Consumes: `platform-app/infra/k8s/opa/` (authz.rego + authz_test.rego)
  from Tasks 1–2 as the directory `opa test` runs against.

- [ ] **Step 1: Add a `test-opa` job**

Add this job to `.github/workflows/ci-lint.yml`, alongside the existing
`lint-go`/`lint-python`/`lint-typescript` jobs (same file, top-level under
`jobs:`):

```yaml
  test-opa:
    name: Test OPA policies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install OPA
        run: |
          curl -L -o opa https://github.com/open-policy-agent/opa/releases/download/v1.20.1/opa_linux_amd64_static
          chmod +x opa
          sudo mv opa /usr/local/bin/
      - name: opa test — authz policy
        run: opa test platform-app/infra/k8s/opa/ --fail-on-empty
```

(`opa_linux_amd64_static` is the exact Linux amd64 static-binary asset name
published on every `open-policy-agent/opa` GitHub release — verified
against the v1.20.1 release assets before writing this step.)

- [ ] **Step 2: Validate the workflow YAML parses**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-lint.yml'))"`
Expected: no output (no exception raised).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci-lint.yml
git commit -m "ci: run opa test on the platform-app OPA policy"
```

---

## Task 4: Document the deploy/verify steps in the Phase 6 guide

The plan's automated tasks stop here — issue #48's "Done when" clause
requires proof on the **live** cluster, which this environment does not
have credentials for (`kubectl cluster-info` here resolves to an unrelated
AWS EKS context, and the `kubernetes` MCP server configured in
`.claude/settings.json` isn't reachable in this session). This task
produces the exact runbook for whoever has cluster access (the user, or a
future session with the MCP server connected) to execute and check off.

**Files:**
- Modify: `platform-app/docs/platform/deployment-guides/Phase_06_Istio_OPA.md`

**Interfaces:**
- Consumes: the deployed rule shape from Task 2 (`platform_admin` full
  access / `platform_analyst` read-only, both scoped to `/api/v1/users`)
  and the seeded `alice.admin@globaltech.io` platform_admin credential from
  `platform-app/database/seeds/seed-platform-users.sql`.

- [ ] **Step 1: Add a dated update section documenting the new rules**

Insert a new section after the existing "### Update OPA policy without
redeployment" subsection (currently at the end of `## Troubleshooting`,
just before `## Rollback`) in
`platform-app/docs/platform/deployment-guides/Phase_06_Istio_OPA.md`:

```markdown
### Update (2026-09-03) — platform_admin / platform_analyst rules

Closes issue #48. `platform-app/infra/k8s/opa/policy-configmap.yaml` now
grants `platform_admin` full access and `platform_analyst` read-only access
to `/api/v1/users` — see
`docs/superpowers/specs/2026-09-03-platform-staff-opa-authz-design.md` for
the design and `docs/superpowers/plans/2026-09-03-platform-staff-opa-authz.md`
for the implementation. `/api/v1/assets` and `/api/v1/incidents` remain
denied for both platform roles (those services require `X-Tenant-ID`, which
platform staff never carry) — this is intentional, not a bug.

**Redeploy the policy:**
```bash
kubectl apply -f platform-app/infra/k8s/opa/policy-configmap.yaml
kubectl rollout restart deployment/opa -n itsm-dev
kubectl rollout status deployment/opa -n itsm-dev --timeout=60s
```

**Verify live**, from the K8s master or anywhere with network access to
`172.16.15.206:30080`:

| # | Test | Expected |
|---|---|---|
| 1 | `curl -X POST http://172.16.15.206:30080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"alice.admin@globaltech.io","password":"Password1!"}'` | `200`, JWT in response body (`alice.admin` is the seeded `platform_admin` user — see `platform-app/database/seeds/seed-platform-users.sql`) |
| 2 | `curl http://172.16.15.206:30080/api/v1/users -H "Authorization: Bearer <platform_admin token>"` | `200` — proves the new `platform_admin` rule |
| 3 | `curl http://172.16.15.206:30080/api/v1/assets -H "Authorization: Bearer <platform_admin token>"` | `403` — proves the scope boundary (not a 422, since OPA denies before the request reaches asset-service) |
| 4 | `curl -X POST http://172.16.15.206:30080/api/v1/users -H "Authorization: Bearer <platform_admin token>" -H 'Content-Type: application/json' -d '{"email":"quinn.analyst@globaltech.io","password":"Password1!","full_name":"Quinn Analyst","role":"platform_analyst"}'` | `201` — creates a `platform_analyst` test user (also confirms `platform_admin`'s write access) |
| 5 | Log in as `quinn.analyst@globaltech.io` / `Password1!`, then `curl http://172.16.15.206:30080/api/v1/users -H "Authorization: Bearer <platform_analyst token>"` | `200` — proves the `platform_analyst` read rule |
| 6 | `curl -X POST http://172.16.15.206:30080/api/v1/users -H "Authorization: Bearer <platform_analyst token>" -H 'Content-Type: application/json' -d '{}'` | `403` — proves `platform_analyst` is read-only |

```bash
# If any of the above return 403 unexpectedly, check OPA logs:
kubectl logs -n itsm-dev deploy/opa --tail=50
```
```

- [ ] **Step 2: Add the two new rows to the Acceptance Checklist**

At the end of the same file's `## Acceptance Checklist` section, add:

```markdown
- [ ] `platform_admin` (`alice.admin@globaltech.io`) can `GET`/`POST` `/api/v1/users`, denied on `/api/v1/assets`
- [ ] `platform_analyst` can `GET` `/api/v1/users`, denied on `POST /api/v1/users`
```

- [ ] **Step 3: Commit**

```bash
git add platform-app/docs/platform/deployment-guides/Phase_06_Istio_OPA.md
git commit -m "docs: document platform_admin/platform_analyst OPA rules and live verification"
```

- [ ] **Step 4: Hand off for live verification**

This step has no file changes — it's the actual closing of issue #48.
Whoever has live cluster access runs Step 1's redeploy commands and the
6-row verification table above, checks the two new Acceptance Checklist
boxes, and only then is issue #48 (and its three "In Progress" sibling
board items with the same live-DB-verification gap, per project memory)
eligible to move to Done — per this repo's "verify Done-when criteria
against real evidence" convention, not just "code merged."

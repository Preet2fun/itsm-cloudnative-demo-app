# Platform Staff OPA Authorization — Design

Status: **approved design, ready for implementation planning.** Produced via
the brainstorming process (architectural path) from a conversation on
2026-09-03, closing GitHub issue
[#48](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/48)
("OPA Rego policy has no rules for platform_admin/platform_analyst"),
discovered during the identity-tenancy-consolidation final review and
explicitly left out of that work's scope. Builds on
`docs/superpowers/specs/2026-08-27-identity-tenancy-consolidation-design.md`
(the "Identity Design" below), whose §2 explicitly deferred "cross-tenant
data browsing" past that spec.

---

## 1. Background

The identity-tenancy-consolidation work (merged to `main` at `8f4fc05`,
2026-09-02) added two new roles to the shared `public.users` table —
`platform_admin` and `platform_analyst` — for platform-app's own
cross-tenant staff (`tenant_id = NULL`). `user-service`'s application layer
already understands these roles: `isPlatformStaff()` and `callerCanAccess()`
in `platform-app/services/user-service/internal/handlers/users.go` let
either role read/act on any user regardless of tenant.

That work never touched
`platform-app/infra/k8s/opa/policy-configmap.yaml`. OPA's `CUSTOM`
authorization action runs **before** application code, `default allow :=
false`, and the existing rules only match `role in {"admin", "agent",
"viewer"}`. A `platform_admin` or `platform_analyst` JWT is valid and passes
Istio's `RequestAuthentication`, but every single request is then denied by
OPA — the role matches no rule. Platform-staff login is not usable in any
deployed cluster today.

## 2. Scope of this spec

**In scope:** OPA Rego rules granting `platform_admin`/`platform_analyst`
access to `/api/v1/users` (the one platform-app resource whose application
code already handles `tenant_id = NULL` callers), plus the test coverage and
live-cluster verification to prove it.

**Out of scope (explicitly, deferred elsewhere):**
- **Platform-staff access to `/api/v1/assets` and `/api/v1/incidents`.**
  Verified in `asset-service/app/router.py` and `incident-service/app/router.py`:
  both declare `X-Tenant-ID` as a **required** FastAPI header
  (`Header(..., alias="X-Tenant-ID")`). Istio's `outputClaimToHeaders` never
  injects that header for platform staff — there is no `tenant_id` claim to
  read it from. Granting OPA access to these paths today would trade a 403
  for a 422 on every request; it would not produce working cross-tenant
  browsing. That capability is still the Identity Design §2's deferred item
  and needs its own design pass (a tenant-selector mechanism, likely tied to
  a future platform-app UI screen) — not invented here.
- **`/internal/users/{id}` (`InternalGetByID`).** This is the existing HIGH
  finding tracked separately (SPIFFE peer-principal allowlist, per Identity
  Design and root `CLAUDE.md` §12) — a service-mesh-internal, mTLS-only
  route, not part of this ingress-facing OPA policy's concern.
- **`notification-service`.** Confirmed it exposes no HTTP API at all (pure
  RabbitMQ consumer, no `chi` router, no `ListenAndServe`) — nothing to add
  a rule for.
- Any change to the existing `admin`/`agent`/`viewer` rules, or to
  `/api/v1/auth/refresh`'s apparent pre-existing gap (it isn't in the public
  path list and isn't covered by any role rule either — a preexisting
  condition unrelated to platform staff, not touched by this spec).

## 3. Current state (verified, not assumed)

Read directly from `platform-app/infra/k8s/opa/policy-configmap.yaml` and
the platform-app service routers:

- Existing rules follow this shape: a `public` boolean for unauthenticated
  paths, then one `allow if { role == "<role>" ... }` block per role, using
  shared `method`/`path`/`role` helpers extracted from
  `input.attributes.request.http`.
- `admin` gets a single blanket rule: `allow if { role == "admin" }` — every
  path, every method, no exceptions (this is the existing precedent for
  "full access" roles, referenced in §4 below).
- `agent` and `viewer` each get path-prefix + method-set rules scoped to
  `/api/v1/incidents` and `/api/v1/assets`; `agent` additionally gets
  read-only on `/api/v1/users`.
- `user-service`'s routes (`cmd/main.go`): `/api/v1/users` (`GET /`, `POST
  /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `PUT /{id}/password`) — all
  under one `chi.Router` group, so a single path-prefix rule covers all of
  them, matching how the existing `agent`/`viewer` rules are already
  written.
- No `.rego` test file exists anywhere in this repo today, and no CI
  workflow references `opa` or `rego`. This is the first Rego test coverage
  added to the project. `opa` CLI v1.15.2 is available for local and CI use.

## 4. Design

### 4.1 New Rego rules

Two new `allow` blocks in `policy-configmap.yaml`'s `authz.rego`, placed
after the existing `viewer` block, following the file's established
per-role-comment-header style:

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

`platform_admin` is deliberately the full read/write set (including `PUT
/{id}/password`, i.e. `ChangePassword` for any user including other platform
staff) — no narrower carve-out, matching the existing `admin` role's
unqualified full access within its scope. `platform_analyst` is GET-only,
matching the existing `viewer` role's shape and the "analyst" naming,
even though today's application layer (`isPlatformStaff()`) does not itself
distinguish the two roles — OPA becomes the actual enforcement point for
that read/write boundary, same as it already is for `admin` vs `viewer`.

### 4.2 Testing

New file `platform-app/infra/k8s/opa/authz_test.rego`, using the standard
`opa test` framework (package `envoy.authz`, `import future.keywords.if`,
test functions named `test_<behavior>`). Coverage, one behavior per test:

- `platform_admin` GET/POST/PUT/DELETE on `/api/v1/users...` → allow
- `platform_admin` on `/api/v1/assets` or `/api/v1/incidents` → deny (proves
  the scope boundary from §2 holds, not just that the new rule exists)
- `platform_analyst` GET on `/api/v1/users...` → allow
- `platform_analyst` POST/PUT/DELETE on `/api/v1/users...` → deny
- Existing `admin`/`agent`/`viewer` behavior unchanged (regression guard —
  at least one pre-existing case per role, since this is the first time
  these rules get any automated coverage at all)

Run locally with `opa test platform-app/infra/k8s/opa/`. TDD sequence: write
tests against the *current* file first (RED — new-role tests fail because
the rules don't exist), then add the two rules from §4.1 (GREEN).

### 4.3 CI

Add an `opa test` step to `.github/workflows/ci-lint.yml` — the existing
workflow with one lint job per `platform-app` service (`gofmt` for
user-service, `ruff` for asset-service/incident-service, etc., per Phase 9's
GitHub Actions setup). A new job in that same file runs `opa test
platform-app/infra/k8s/opa/`, matching how the other jobs are each scoped to
one platform-app subsystem. This is net-new CI surface (none existed for OPA
before), scoped to just running the test suite in §4.2 — no other CI
changes.

### 4.4 Live verification

Issue #48's "Done when" requires proof on a live cluster, not just unit
tests (Rego unit tests exercise the policy in isolation — they don't prove
Istio → OPA → service wiring end-to-end):

1. Apply the updated `policy-configmap.yaml` to the `itsm-dev` namespace.
2. Log in as the seeded platform_admin user (`alice.admin@globaltech.io`,
   per `platform-app/database/seeds/seed-platform-users.sql`) through the
   real login flow to get a real JWT.
3. Call `GET /api/v1/users` through the Istio ingress gateway with that
   token → expect 200.
4. Call `GET /api/v1/assets` with the same token → expect 403 (proves the
   scope boundary, not an accident of a missing header check).
5. Repeat step 3 with a `platform_analyst` token, then confirm `POST
   /api/v1/users` with that same token → expect 403.

## 5. Error handling / edge cases

- **`ChangePassword` privilege scope.** Flagged and explicitly accepted:
  `platform_admin` can change any user's password, including another
  platform admin's. This mirrors `admin`'s existing unqualified power within
  its scope — no new asymmetric restriction invented here.
- **Method casing / unknown methods.** Not a new concern — inherited as-is
  from the existing `agent`/`viewer` rules' `method in {...}` pattern; this
  spec doesn't change that behavior.

## 6. Open questions carried forward

- **Cross-tenant browsing of `/api/v1/assets` and `/api/v1/incidents` by
  platform staff** — still not designed. Needs its own spec: how does a
  platform analyst select which tenant's data to view when Istio has no
  `X-Tenant-ID` claim to inject? (Likely a tenant-selector UI + a
  service-side mechanism to accept an explicitly-chosen tenant from an
  already-authenticated platform-staff caller — the same shape the Identity
  Design flagged and deferred, not invented ad hoc here or there.)
- **`/api/v1/auth/refresh` has no matching OPA rule for *any* role**
  (`agent`/`viewer`/`admin` included) — observed while reading the policy
  file, predates this spec, not fixed here. Worth its own ticket.

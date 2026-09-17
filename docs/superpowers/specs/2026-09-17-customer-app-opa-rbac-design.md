# Customer App — OPA Rego RBAC Policy (Phase 4)

## 0. Critical correction, found live during Task 5 verification (2026-09-17)

Everything below this section describes the plan as originally approved.
While verifying it live, a real, pre-existing bug surfaced that goes beyond
this phase's original scope: **OPA's `ext_authz` check runs *before*
`jwt_authn` in Istio's filter chain** for `CUSTOM`-action
`AuthorizationPolicy` objects (confirmed via the actual filter order —
`rbac, ext_authz, jwt_authn, rbac` — and OPA's own decision log, which
showed no `x-user-role`/`x-tenant-id` header present on any request it
evaluated). The policy's `role` helper read `input.attributes.request.http.headers["x-user-role"]`
— a header `jwt_authn`'s `claim_to_headers` only adds *after* `ext_authz`
already ran. Every role-based `allow` rule was therefore silently
unreachable for real traffic, in **both apps** — this predates Phase 4
entirely; Phase 4 just happened to be the first time anyone exercised it
with a live JWT end-to-end.

**Fix (first pass):** `role` was derived by unverified `io.jwt.decode()` of
the `Authorization: Bearer` token directly in Rego, not from a header. Safe
without signature verification because `jwt_authn` still runs immediately
after, unconditionally, and independently rejects any invalid signature
regardless of what OPA decides — a forged claim could pass OPA's check but
would still be rejected by `jwt_authn` right after. Applied to both
`platform-app/infra/k8s/opa/authz.rego` and `policy-configmap.yaml`'s
inline copy (kept in sync per §4.3's own convention) — fixing platform-app's
RBAC as a side effect, confirmed by the user as in-scope (2026-09-17,
"fix it now, both apps"). Verified: `opa test` 25/25.

**Fix (second pass, same session):** an automated background security review
flagged the unverified decode as HIGH severity — correctly. The
"jwt_authn re-checks it anyway" reasoning holds for every path wired up
*today*, but it's an implicit coupling this file can't enforce or make
visible on its own: a future ext_authz-protected route added without a
matching jwt_authn gate would have no signature check at all. Upgraded to
`io.jwt.decode_verify()` with the same "itsm-rs256-v1" public key already
pinned in the RequestAuthentication manifests (§4.1's own JWKS-under-STRICT-
mTLS fix from earlier the same day) — closing the gap directly instead of
relying on a downstream filter to compensate. Verified against a real
signed token captured live (`owner@customer-b.example`, `role: admin`),
with `with time.now_ns as ...` pinning verification to shortly after the
token's `iat` so the test stays deterministic regardless of the token's
real `exp` or the local clock. Also added a tampered-signature test (same
claims, altered signature bytes) to prove verification is actually
happening, not just claim-reading. Final: `opa test` 27/27.

## 1. Problem

Phase 3 (Istio ingress + JWT authn) put customer-app behind the shared
gateway with mTLS-validated JWTs — Istio now confirms *who* a caller is
(`X-Tenant-ID`/`X-User-Role`, derived from the JWT, never client-supplied).
It does not yet confirm *what that role is allowed to do*. Right now any
authenticated request — any role, any tenant — reaches every customer-app
service. Root `CLAUDE.md` §3's two-layer authz model (Istio AuthorizationPolicy
for tenant isolation, OPA `ext_authz` CUSTOM for RBAC) is only half-applied to
customer-app: layer 1 exists (`customer-app-deny-unauthenticated.yaml`, plus
mTLS/tenant-schema isolation), layer 2 (OPA) doesn't exist for this app at
all today. This is customer-app's last authz gap.

## 2. Goals / Non-goals

**Goals**
- A caller's `X-User-Role` (from their validated JWT) is checked against a
  Rego policy before any customer-app service handler runs.
- A role lacking permission is denied by OPA (403), never reaches the
  service — verified live.
- Match the user's explicit simplicity call (2026-09-17 brainstorming):
  today customer-app only has `admin` users, one per tenant. No `agent`/
  `viewer` role semantics are designed or needed yet.

**Non-goals**
- Designing what `agent`/`viewer` mean for customer-app's business domain —
  no such users exist yet; deferred until there's a real product need.
- A dedicated OPA instance for customer-app — explicitly rejected in favor
  of the shared pod (see Decision 2 below).
- Any change to `platform-app/infra/istio/istio-operator.yaml` (mesh-wide
  Istio config) — not needed; see Decision 2.

## 3. Decisions (locked in brainstorming 2026-09-17, corrected while writing the plan)

1. **Role model: `admin`-only — and no new Rego rules are actually needed.**
   Re-reading the live policy while writing the plan: `allow if { role ==
   "admin" }` (`policy-configmap.yaml` line 36) is **unscoped** — no path
   check at all, so it already grants `admin` access to *any* path in
   *either* app. Once customer-app-dev's `AuthorizationPolicy` routes its
   traffic to OPA, `admin` JWTs already pass through this existing rule with
   **zero new `allow` rules**, and `viewer`/`agent`/no-role JWTs are already
   denied for customer-app's 4 paths since no existing rule mentions them.
   Confirmed with the user (2026-09-17): don't add redundant path-scoped
   admin rules for customer-app — wire the `AuthorizationPolicy` and add
   *tests* proving both the allow (via the existing blanket rule) and the
   deny, but no new policy code. If `admin`'s blanket grant is ever scoped
   down later, customer-app's tests will catch the regression and rules can
   be added then.
2. **Reuse the existing shared OPA pod** (`itsm-dev/opa`), rather than
   standing up a second instance in `customer-app-dev`. Confirmed no
   technical blocker: OPA has `sidecar.istio.io/inject: "false"` (not a mesh
   workload), so `itsm-mtls-strict` (STRICT PeerAuthentication, itsm-dev)
   doesn't apply to it and cross-namespace calls already work exactly like
   platform-app's own itsm-dev callers. The existing `opa-authz`
   extensionProvider (registered once, mesh-wide, in `istio-operator.yaml`)
   can be referenced by a new `AuthorizationPolicy` in `customer-app-dev`
   without any change to that file — extensionProviders aren't
   namespace-scoped for consumption. Given Decision 1 (no new Rego rules, so
   `policy-configmap.yaml`'s deployed content is untouched), this phase
   doesn't even need to restart the shared OPA pod — only a new
   `AuthorizationPolicy` resource in customer-app-dev/qa is added, pointing
   at the already-running `opa-authz` provider. (OPA is `replicas: 1` with
   no `--watch` flag, so a *future* phase that does add real Rego rules
   would need a restart shared with platform-app — that tradeoff still
   applies then, just not in this phase.) Avoids a second OPA pod's memory
   footprint given §4's documented tight headroom either way.
3. **The policy stays in the same file platform-app's already uses**
   (`platform-app/infra/k8s/opa/policy-configmap.yaml`'s `authz.rego` block,
   extracted read-only into a testable `authz.rego` — see §4.3) — one Rego
   package (`envoy.authz`), no split between apps. If a future phase ever
   needs real customer-app-specific rules, they'd join this same file, not a
   new one, since it's the same pod loading one policy.
4. **Verification needs one temporary non-admin customer-app user**, since
   none exist today. Seeded the same way `seed-customer-user.sh` already
   seeds admin users, deleted after the check (or left inert — same
   rollback note as that script already documents for its admin users).

## 4. Design

### 4.1 No Rego rule changes needed — `platform-app/infra/k8s/opa/policy-configmap.yaml`

**Corrected from the original brainstorm (see Decision 1): no new `allow`
rules are added.** The existing unscoped `allow if { role == "admin" }`
already grants customer-app's admin users access to any path once OPA is in
the request path, and the existing `default allow := false` combined with no
`agent`/`viewer` rule mentioning `/api/v1/{restaurants,orders,deliveries,payments}`
already denies those roles for customer-app's paths. This file is untouched
by this phase except for extraction into a standalone, testable
`authz.rego` (§4.3) — the ConfigMap's inline content stays byte-for-byte
what it is today.

The existing `public if { endswith(path, "/health") }` rule already covers
all 4 services' health checks too.

### 4.2 AuthorizationPolicy — `customer-app/infra/k8s/istio/authorization-policies/{dev,qa}/authz-opa-rbac.yaml`

New file, one per env, mirroring platform-app's own
`infra/k8s/opa/authz-policy-custom/{dev,qa}/authz-opa-custom.yaml` shape
exactly, just in customer-app-dev/qa and pointed at customer-app's paths:

```yaml
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

Scoped to customer-app's own paths (unlike platform-app's `rules: [{}]`
match-all) since this policy object lives in `customer-app-dev` and should
only ever see customer-app's own traffic anyway — the explicit path list is
belt-and-suspenders documentation of intent, not a functional requirement.

`apply-istio-config.sh` (customer-app's own script, `customer-app/scripts/`)
gets a new step applying this file, same pattern as its existing 5 steps.

### 4.3 Extract `authz.rego` + add `authz_test.rego`

No standalone `.rego` file exists on `main` today — the policy only exists
inline inside `policy-configmap.yaml`'s `data.authz.rego` block, and `opa
test` needs real files on disk to run against. No `authz_test.rego` exists
on `main` either — TODO.md's reference to one is aspirational; it only
exists on the unmerged `worktree-platform-staff-opa-authz` branch (issue
#48, unrelated work). Rather than block on that branch merging:

- Create `platform-app/infra/k8s/opa/authz.rego` — an exact, byte-for-byte
  copy of the ConfigMap's current `data.authz.rego` block, with a header
  comment noting the two must be kept in sync (the ConfigMap stays the
  deployed source of truth; this file exists so `opa test` has something to
  run against). Same precedent the unmerged worktree already established for
  this exact split — used here purely as a structural reference, read-only,
  not merged from.
- Create `platform-app/infra/k8s/opa/authz_test.rego`, standard `opa test`
  framework (`package envoy.authz`, `import future.keywords.if`). Covers:
  - Regression coverage for every existing platform-app rule (public paths,
    admin, agent, viewer) — all should pass immediately, since nothing about
    platform-app's behavior is changing.
  - `role: admin` + each of the 4 customer-app path prefixes → allow (via
    the existing blanket admin rule — see Decision 1).
  - `role: viewer` (or missing role) + each of the 4 customer-app path
    prefixes → deny.

### 4.4 Live verification

1. Seed one temporary non-admin customer-app user (e.g.
   `staff@customer-a.example`, `role: viewer` or `agent` — doesn't matter
   which, since neither has an `allow` rule) via the same upsert pattern
   `seed-customer-user.sh` already uses.
2. Log in as that user, get a valid JWT (passes Istio's layer — the token
   itself is legitimately signed).
3. `GET /api/v1/restaurants` with that JWT → expect `403` from OPA, not the
   service (confirm via `kubectl logs` on catalog-service showing no
   handler invocation, or via OPA's own decision log — `decision_logs:
   console: true` is already configured).
4. Same call with the existing `owner@customer-a.example` (`admin`) JWT →
   expect `200`, unaffected by the new policy.
5. Re-run `tenant-isolation-smoke-test.sh` in full — must still be 25/25;
   OPA denying non-admin roles must not affect the existing admin-JWT tenant
   isolation checks.

## 5. Files

- Create: `platform-app/infra/k8s/opa/authz.rego` (extracted, byte-for-byte
  copy of the ConfigMap's inline policy — no rule changes)
- Create: `platform-app/infra/k8s/opa/authz_test.rego` (new file — doesn't
  exist on `main`)
- `platform-app/infra/k8s/opa/policy-configmap.yaml` itself is untouched
  except a comment pointing at `authz.rego`
- Create: `customer-app/infra/k8s/istio/authorization-policies/dev/authz-opa-rbac.yaml`
- Create: `customer-app/infra/k8s/istio/authorization-policies/qa/authz-opa-rbac.yaml`
- Modify: `customer-app/scripts/apply-istio-config.sh` (apply the new file)
- Modify: `customer-app/TODO.md` (Phase 4 checkboxes on completion)

## 6. Risks

- **Shared-pod restart blip** (Decision 2) — accepted, matches existing
  single-replica risk posture; mitigated by doing the restart during a
  low-traffic window and verifying platform-app's own health immediately
  after.
- **`authz.rego` and the ConfigMap's inline copy drift out of sync** — since
  no rule changes happen in this phase, the extraction is a one-time copy;
  `opa test` running the extracted file catches drift the moment a future
  change forgets to update both. No live risk from this phase itself, since
  the ConfigMap's actual deployed content is unchanged.
- **No agent/viewer coverage** — explicitly out of scope (Decision 1); not a
  gap in this phase, a deferred decision for whenever those roles get a real
  definition.

## 7. Rollback

Delete `customer-app-opa-rbac` (dev+qa) — that alone removes OPA enforcement
from customer-app's traffic and falls back to Phase 3's state (JWT-validated
but no RBAC check). No OPA pod restart needed for rollback, since
`policy-configmap.yaml`'s deployed content never changed in this phase.

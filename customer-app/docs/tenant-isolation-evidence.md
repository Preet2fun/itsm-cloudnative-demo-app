# Customer App — Multi-Tenant Isolation Evidence (Phase 2)

Closes GitHub issue [#35](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/35).

## What this proves

Every customer-app service resolves its Postgres `search_path` **per request,
server-side, from the `X-Tenant-ID` header** (never from a client-supplied
field). This test confirms that boundary actually holds on the live
`customer-app-dev` deployment: a caller sending `X-Tenant-ID: customer_a`
cannot read `customer_b`'s data through **any** of the four services, by list
endpoint or by direct resource id.

There is no auth layer in front of the services yet (Phase 3), so the test
sends the tenant header directly — exactly the trust model the services run
under today.

## The test

`customer-app/scripts/tenant-isolation-smoke-test.sh` — read-only (all GETs),
safe to re-run. It:

1. **Phase A (positive control)** — as `customer_b`, lists and fetches-by-id
   its own restaurant / order / delivery / payment. All must succeed, so a
   later `404` means "isolated", not "the row doesn't exist".
2. **Phase B (isolation)** — as `customer_a`:
   - `GET /restaurants` and `GET /orders` return only A's rows, and none of
     B's ids appear in the list.
   - `GET /restaurants/{B_id}`, `/orders/{B_id}`, `/deliveries/{B_id}`,
     `/payments/{B_id}` each return **404**.
   - `GET /deliveries?orderId={B_order}` and `GET /payments?orderId={B_order}`
     each return an **empty list**.
3. **Phase C (spot check)** — as `customer_c`, restaurant count is C's own (1).

Assertion counts are anchored to the seeded data
(`customer_a` 2 restaurants / 4 orders, `customer_b` 1 / 2, `customer_c` 1 / 1).

## How to run

```bash
cd customer-app
bash scripts/tenant-isolation-smoke-test.sh
```

Self-manages `kubectl port-forward` for all 4 services in `customer-app-dev`
(service port `80`) and tears them down on exit. To run against a different
namespace or through an ingress once Phase 3 lands:

```bash
NAMESPACE=customer-app-qa bash scripts/tenant-isolation-smoke-test.sh
# or
ORDER_URL=http://… CATALOG_URL=http://… DELIVERY_URL=http://… PAYMENT_URL=http://… \
  bash scripts/tenant-isolation-smoke-test.sh
```

Exit code `0` = every assertion passed.

## Captured run

`customer-app-dev`, 2026-09-10, images `delivery/payment:v0.1.1`,
`order/catalog:v0.1.0`:

```
==> Port-forwarding customer-app services in namespace 'customer-app-dev' (svc port 80)
==> tenant-isolation-smoke-test  (A='customer_a' trying to reach B='customer_b')

==> Phase A — customer_b sees its own data (proves the rows exist)
  PASS  B restaurants list -> 200  (200)
  PASS  B restaurant count  (1)
  PASS  B orders list -> 200  (200)
  PASS  B order count  (2)
  PASS  B GET own restaurant by id -> 200  (200)
  PASS  B GET own order by id -> 200  (200)
  PASS  B GET own delivery by id -> 200  (200)
  PASS  B GET own payment by id -> 200  (200)

==> Phase B — customer_a must NOT see customer_b's data
  PASS  A restaurant list is A's own count  (2)
  PASS  A restaurant list excludes B's restaurant
  PASS  A order list is A's own count  (4)
  PASS  A order list excludes B order e385857a…
  PASS  A order list excludes B order b6cefe3f…
  PASS  A GET B's restaurant by id -> 404  (404)
  PASS  A GET B's order by id -> 404  (404)
  PASS  A GET B's delivery by id -> 404  (404)
  PASS  A GET B's payment by id -> 404  (404)
  PASS  A list deliveries for B's order -> HTTP 200  (200)
  PASS  A list deliveries for B's order -> empty  (0)
  PASS  A list payments for B's order -> HTTP 200  (200)
  PASS  A list payments for B's order -> empty  (0)

==> Phase C — customer_c list-count spot check
  PASS  C restaurant count  (1)

==> 22 passed, 0 failed
==> Tenant isolation holds.
```

**Result: PASS** — 22/22 assertions. `customer_a` cannot read `customer_b`'s
restaurants, orders, deliveries or payments by list or by direct id;
`customer_b` and `customer_c` each see only their own rows. Tenant isolation
via per-request `search_path` holds on the live deployment.

---

## Phase 3 re-run — JWT-based, through the mesh (closes #49)

Same script, same assertions, but now driven by real `customer_a`/`customer_b`
JWTs through `http://customer-app.dev.local:30080` instead of direct
port-forwards with a raw `X-Tenant-ID` header — this is the actual trust path
once Istio ingress + JWT authn (Phase 3) is live: Envoy validates the JWT and
injects `X-Tenant-ID`/`X-User-Role` itself; the header a caller sends is never
trusted directly (see the header-spoof-defense assertions in Phase C below).

### A real bug was found and fixed along the way

The first attempt at this re-run got 401 on every authenticated request,
including `customer_b` reading its own data — not a tenant-isolation failure,
a JWT-validation failure. Root cause (confirmed via istiod's own logs,
`kubectl logs -n istio-system deploy/istiod | grep jwks`): **istiod itself**
(not the sidecars) fetches a `RequestAuthentication`'s `jwksUri` to bake a
`local_jwks` snapshot into every workload's Envoy config, and istiod's own
fetch client does not participate in the mesh's mTLS. Since `user-service`
sits under `STRICT` `PeerAuthentication` (`itsm-mtls-strict`), istiod's
plaintext fetch got connection-reset every time, so it silently fell back to
Istio's internal placeholder ("fake JWKS") — a key nothing had ever signed
anything with. Every legitimately-issued JWT failed with 401
`Jwt verification fails` against that fake key, for both `customer-app-jwt-auth`
*and* platform-app's own `itsm-jwt-auth` (same issuer/jwksUri pair — this was
a live, silent bug on platform-app's side too, not just customer-app's).

Fix: switched both `RequestAuthentication` resources from `jwksUri` to a
static inline `jwks` (the real public key, pasted in). Tradeoff, documented
in both manifests: this key does not auto-update if `user-service`'s signing
key is ever rotated — whoever rotates `JWT_PRIVATE_KEY` must update the pinned
key in `customer-app/infra/k8s/istio/request-authentication/{dev,qa}/request-auth.yaml`
and `platform-app/infra/k8s/istio/request-authentication/dev/request-auth.yaml`
by hand. `itsm-qa`'s copy is left on `jwksUri` with a documenting comment,
since that namespace isn't deployed yet and there's no real qa key to pin.

### Captured run

`customer-app-dev`, 2026-09-17, through `http://customer-app.dev.local:30080`
with real JWTs for `owner@customer-a.example` / `owner@customer-b.example`:

```
==> Logging in as owner@customer-a.example and owner@customer-b.example
    got JWT_A (712 chars), JWT_B (712 chars)

==> Phase 0 — mesh rejects missing/invalid tokens
  PASS  no token -> 403  (403)
  PASS  garbage token -> 401  (401)

==> Phase A — customer_b sees its own data (proves the rows exist)
  PASS  B restaurants list -> 200  (200)
  PASS  B restaurant count  (1)
  PASS  B orders list -> 200  (200)
  PASS  B order count  (2)
  PASS  B GET own restaurant by id -> 200  (200)
  PASS  B GET own order by id -> 200  (200)
  PASS  B GET own delivery by id -> 200  (200)
  PASS  B GET own payment by id -> 200  (200)

==> Phase B — customer_a must NOT see customer_b's data
  PASS  A restaurant list is A's own count  (2)
  PASS  A restaurant list excludes B's restaurant
  PASS  A order list is A's own count  (4)
  PASS  A order list excludes B order e385857a…
  PASS  A order list excludes B order b6cefe3f…
  PASS  A GET B's restaurant by id -> 404  (404)
  PASS  A GET B's order by id -> 404  (404)
  PASS  A GET B's delivery by id -> 404  (404)
  PASS  A GET B's payment by id -> 404  (404)
  PASS  A list deliveries for B's order -> HTTP 200  (200)
  PASS  A list deliveries for B's order -> empty  (0)
  PASS  A list payments for B's order -> HTTP 200  (200)
  PASS  A list payments for B's order -> empty  (0)

==> Phase C — header-spoof defense
  PASS  A + spoofed X-Tenant-ID:customer_b -> still 200  (200)
  PASS  A + spoofed X-Tenant-ID:customer_b -> still A's count (2)  (2)

==> 25 passed, 0 failed
==> Tenant isolation holds through the mesh.
```

**Result: PASS** — 25/25 assertions, including the Phase 0 mesh-rejection
checks (403/401) and the Phase C header-spoof-defense checks that only exist
once real JWT validation is in front of the services. A caller cannot forge
`X-Tenant-ID` to read another tenant's data — Envoy derives it from the
validated JWT's `tenant_id` claim, and any client-sent copy of that header is
overwritten, not trusted.

---

## Phase 4 — OPA RBAC (closes #50)

Adds a second authz layer on top of Phase 3's JWT validation: a role
lacking permission is now denied by OPA before the request reaches any
service, not just an invalid/missing token. Full design and the two bugs
found+fixed along the way (`ext_authz` running before `jwt_authn`;
upgrading from unverified to verified JWT decode after an automated
security review) are in
`docs/superpowers/specs/2026-09-17-customer-app-opa-rbac-design.md`.

### Captured run

`customer-app-dev`, 2026-09-17, after applying
`customer-app-opa-rbac` and the corrected `policy-configmap.yaml`
(`io.jwt.decode_verify`, real signature check):

```
=== login as staff (viewer role, temporary test user) ===
=== expect 403 (OPA denies viewer role) ===
403

=== login as owner (admin role) ===
=== expect 200, total 2 (admin unaffected) ===
{
    "restaurants": [...],
    "total": 2
}

=== full smoke test - expect 25/25 ===
==> Phase 0 — mesh rejects missing/invalid tokens
  PASS  no token -> 403  (403)
  PASS  garbage token -> 403 (OPA rejects before jwt_authn can)  (403)

==> Phase A — customer_b sees its own data (proves the rows exist)
  PASS  B restaurants list -> 200  (200)
  PASS  B restaurant count  (1)
  [... 21 more PASS lines, admin-JWT tenant isolation unaffected ...]

==> 25 passed, 0 failed
```

**Result: PASS.** A `role: viewer` JWT is denied (`403`) by OPA before
reaching catalog-service — confirmed via OPA's own decision log
(`"result":false`) — while the existing `role: admin` JWTs for both tenants
are unaffected, and full tenant isolation still holds. The one behavior
change from Phase 3: a garbage/malformed token now gets `403` instead of
`401`, because OPA's `ext_authz` check runs *before* `jwt_authn` in the
filter chain and rejects it first — still correctly denied, just by a
different layer (`tenant-isolation-smoke-test.sh` updated to match).

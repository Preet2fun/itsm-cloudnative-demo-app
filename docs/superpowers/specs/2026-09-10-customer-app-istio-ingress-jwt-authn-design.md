# Customer App — Istio Ingress + JWT Authn Wiring (Phase 3)

**Date:** 2026-09-10
**GitHub:** [#49](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/49)
**Roadmap:** `customer-app/TODO.md` Phase 3
**Status:** design — approved decisions below, pending spec review

Supersedes, on the narrow question of how customer-app authenticates callers,
the "left open" notes in
`2026-08-15-platform-customer-app-split-notes.md` §5/§7a and the placeholder
`authz-allow-intra-namespace` policy shipped in the 2026-08-20 completion pass.

---

## 1. Problem

customer-app's 4 services run in `customer-app-dev` with **no Istio sidecars**
(`istio-injection` label absent; pods `1/1`) and **no ingress path** — nothing
outside the namespace can reach them. They trust `X-Tenant-ID` / `X-User-Role`
request headers as-is (per root `CLAUDE.md` §3), so exposing them requires the
same mesh-level auth platform-app already runs: Envoy validates a JWT and
injects those headers from its claims; services never see the token.

The shared identity engine is live: `user-service` (2/2, `itsm-dev`) issues
RS256 JWTs (`iss: itsm-user-service`) with a `tenant_id` claim = a
`customer_tenants` slug, and serves JWKS at
`/api/v1/.well-known/jwks.json`. The Istio IngressGateway is live on NodePort
`30080`, with platform-app's `itsm-gateway` / `itsm-routing` VirtualService
(`hosts: ["*"]`, catch-all → `frontend`).

## 2. Goals / Non-goals

**Goals**

- customer-app-dev is a meshed namespace (all app pods + redis `2/2`).
- A valid customer-tenant JWT reaches `order-service` (and the other 3) through
  the IngressGateway with `X-Tenant-ID` / `X-User-Role` injected from claims.
- Requests with no / invalid token are rejected at the mesh (`403` / `401`),
  not by the service.
- A client-supplied `X-Tenant-ID` header cannot override the JWT claim.
- dev is applied and verified live; qa manifests exist for parity.
- The Phase 2 tenant-isolation smoke test is rewritten to run through the
  gateway with real JWTs and still passes (22 assertions).

**Non-goals**

- OPA / RBAC by role — Phase 4 (#50), layers on as a `CUSTOM` AuthorizationPolicy.
- A live qa deploy — `customer-app-qa` namespace does not exist.
- Frontend — Phase 5/6.
- Cross-tenant access for platform staff (`tenant_id` claim absent) — stays a
  `400` from the services; deferred platform-app design question (`CLAUDE.md`
  §3, #47).
- Changing platform-app's `itsm-dev` config in any way.

## 3. Decisions (locked in brainstorming 2026-09-10)

| # | Decision | Rationale |
|---|---|---|
| D1 | customer-app's VirtualService **binds cross-namespace to the shared `itsm-dev/itsm-gateway`**; no new Gateway resource. Dedicated host **`customer-app.dev.local`** (`customer-app.qa.local` for qa). | Less YAML; the dedicated host is what actually prevents collision with platform-app's `hosts: ["*"]` + catch-all, so a second Gateway adds nothing. |
| D2 | Add a **`deny-unauthenticated` AuthorizationPolicy** (DENY, `notRequestPrincipals: ["*"]`) for the 4 customer-app API path prefixes, **replacing** `authz-allow-intra-namespace`. | Same shape as platform-app's `deny-unauthenticated-api`; the replaced file's own comment calls for exactly this swap. Closes the tokenless-caller-sets-own-header gap. |
| D3 | Add `proxy.istio.io/config: '{"holdApplicationUntilProxyStarts": true}'` to **all 4** app deployment templates. | delivery/payment's eager Hikari pool connects to external Postgres through Envoy on startup; without the hold it races the proxy. ~1–2s cost, no downside. |
| D4 | **Seed `customer_a` and `customer_b` login users**, and **rewrite `tenant-isolation-smoke-test.sh`** to mint a JWT per tenant and call through the gateway with `Authorization: Bearer` (no raw `X-Tenant-ID`). | `deny-unauthenticated` makes the Phase 2 script's raw-header calls `403` from then on. Rewriting keeps the isolation guarantee verified and makes it a stronger test (auth + isolation together). |

## 4. Design

### 4.1 Mesh bring-up (ordered — mirrors `platform-app/scripts/apply-istio-config.sh`)

1. Label the namespace: `kubectl label ns customer-app-dev istio-injection=enabled`
   (and `kubectl apply -f infra/k8s/namespaces/dev/namespace-customer-app-dev.yaml`,
   which already carries the label, so the manifest and cluster agree).
2. `helm upgrade` with D3's annotation, then
   `kubectl rollout restart deploy -n customer-app-dev` +
   `kubectl rollout restart statefulset/redis -n customer-app-dev`.
   Wait for **every pod `2/2`**. Java services take ~2–3 min each (startupProbe
   window; unchanged from Phase 1).
3. Apply `DestinationRule` (`ISTIO_MUTUAL`, `*.customer-app-dev.svc.cluster.local`
   — already written in Phase 0).
4. Apply `VirtualService`, `RequestAuthentication`, `deny-unauthenticated`
   `AuthorizationPolicy`.
5. Apply `PeerAuthentication` STRICT **last**, gated on an all-pods-`2/2` check
   (the script refuses to proceed otherwise).

`redis-0` joins the mesh (D-implicit): STRICT PeerAuthentication governs every
meshed workload in the namespace, and a non-meshed redis would break
catalog-service's mTLS'd connection to it. Cost: one redis restart (cache-aside
degrades to MISS briefly — non-fatal).

External Postgres egress: platform-app's meshed services reach the same
`172.16.12.226` today with the default `ALLOW_ANY` outbound policy, so no
`ServiceEntry` is needed. If egress fails post-mesh, add one for
`172.16.12.226:5432` (troubleshooting, not baseline).

### 4.2 VirtualService — `infra/k8s/istio/virtual-services/{dev,qa}/virtual-service.yaml`

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: customer-app-routing
  namespace: customer-app-dev            # customer-app-qa in the qa file
spec:
  hosts: ["customer-app.dev.local"]      # customer-app.qa.local in qa
  gateways: ["itsm-dev/itsm-gateway"]    # shared gateway, cross-namespace ref
  http:
    - match: [{ uri: { prefix: /api/v1/restaurants } }]
      route: [{ destination: { host: catalog-service,  port: { number: 80 } } }]
    - match: [{ uri: { prefix: /api/v1/orders } }]
      route: [{ destination: { host: order-service,    port: { number: 80 } } }]
    - match: [{ uri: { prefix: /api/v1/deliveries } }]
      route: [{ destination: { host: delivery-service, port: { number: 80 } } }]
    - match: [{ uri: { prefix: /api/v1/payments } }]
      route: [{ destination: { host: payment-service,  port: { number: 80 } } }]
```

- Short destination hostnames — VS and services share the namespace.
- `/api/v1/restaurants/{id}/menu-items` is covered by the `restaurants` prefix.
- No catch-all: unknown paths → Istio `404`. `/api/v1/health` is intentionally
  not routed externally.
- The dedicated host means platform-app's `hosts: ["*"]` VirtualService never
  matches a `customer-app.dev.local` request (Istio prefers the specific-host
  VS for that host).

### 4.3 RequestAuthentication — `infra/k8s/istio/request-authentication/{dev,qa}/request-auth.yaml`

```yaml
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: customer-app-jwt-auth
  namespace: customer-app-dev
spec:
  jwtRules:
    - issuer: "itsm-user-service"        # == user-service internal/handlers/auth.go: jwtIssuer
      jwksUri: "http://user-service.itsm-dev.svc.cluster.local/api/v1/.well-known/jwks.json"
      outputClaimToHeaders:
        - { header: "x-tenant-id", claim: "tenant_id" }
        - { header: "x-user-role", claim: "role" }
      forwardOriginalToken: true
```

- No `selector` → applies to every workload in the namespace (matches
  platform-app's `itsm-jwt-auth`).
- Invalid token present → Envoy `401` before the service. No token → passes
  RequestAuthentication (the DENY policy in 4.4 handles absence).
- `outputClaimToHeaders` **overwrites** any inbound `x-tenant-id` / `x-user-role`
  the client set — this is the header-spoof defense.
- Platform-staff token: `tenant_id` claim omitted → `X-Tenant-ID` not injected
  → service returns `400 "X-Tenant-ID header is required"`. Intended.
- qa file: identical except `namespace: customer-app-qa`. The `jwksUri` still
  points at `user-service.itsm-dev` — there is one identity engine for all
  environments (`CLAUDE.md` §3). (If an `itsm-qa` user-service is ever stood
  up, revisit.)

### 4.4 AuthorizationPolicy — `infra/k8s/istio/authorization-policies/{dev,qa}/authz-deny-unauthenticated.yaml`

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: customer-app-deny-unauthenticated
  namespace: customer-app-dev
spec:
  action: DENY
  rules:
    - from: [{ source: { notRequestPrincipals: ["*"] } }]
      to:
        - operation:
            paths:
              - /api/v1/restaurants*
              - /api/v1/orders*
              - /api/v1/deliveries*
              - /api/v1/payments*
```

- DENY (not ALLOW) so it never triggers Istio's default-deny; it only ever
  removes access, and composes cleanly with Phase 4's future `CUSTOM` OPA
  policy — same reasoning as platform-app's final `deny-unauthenticated-api`.
- No token → request principal absent → `403`. Health/probe traffic is
  unaffected (Istio rewrites HTTP probes to port 15021).

**Files removed** (superseded; requires the explicit listing per `CLAUDE.md` §13):

- `customer-app/infra/k8s/istio/authorization-policies/dev/authz-allow-intra-namespace.yaml`
- `customer-app/infra/k8s/istio/authorization-policies/qa/authz-allow-intra-namespace.yaml`

Neither is applied on the cluster today (`kubectl get authorizationpolicy -A`
shows only `itsm-dev`), so removal is repo-only.

### 4.5 Seed users — `customer-app/scripts/seed-customer-user.sh`

- Generates a bcrypt **cost-12** hash for `SEED_PASSWORD` (env, required),
  matching user-service `bcryptCost = 12`. Hash generator, first available of:
  `htpasswd -bnBC 12 "" "$pw" | cut -d: -f2` (apache2-utils) →
  `python3 -c 'import bcrypt,sys; print(bcrypt.hashpw(sys.argv[1].encode(), bcrypt.gensalt(12)).decode())' "$pw"`
  → `docker run --rm httpd:2.4 htpasswd -bnBC 12 "" "$pw"`. The script errors
  out with the install hint if none work. Verified end-to-end by the login in
  §4.6 actually succeeding — a wrong cost or format fails `bcrypt.CompareHashAndPassword`.
- Upserts into `public.users` via `psql "$DATABASE_URL"`:

  ```sql
  INSERT INTO public.users (email, password_hash, full_name, role, tenant_id, is_active)
  VALUES (:email, :hash, :name, 'admin', :slug, true)
  ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role, tenant_id = EXCLUDED.tenant_id, is_active = true;
  ```

- Seeds two rows by default: `owner@customer-a.example` (`tenant_id=customer_a`)
  and `owner@customer-b.example` (`tenant_id=customer_b`), both role `admin`.
  `USERS` env overrides the `email:slug` list.
- Idempotent; safe to re-run. No dependency on user-service's `/api/v1/users`
  endpoint (which needs an admin JWT — chicken-and-egg for the first user).

### 4.6 Getting a JWT (dev — MFA code via logs)

user-service's login is a 2-step MFA flow; in dev mode (no email provider)
`MfaSend` logs the code (`auth.go`: `slog.Info("dev-mode: MFA OTP generated", …)`).

```
POST http://<node-ip>:30080/api/v1/auth/login       {email,password}      -> {session_id}
POST http://<node-ip>:30080/api/v1/auth/mfa/send    {session_id}          -> 200
kubectl logs -n itsm-dev deploy/user-service | grep 'dev-mode: MFA OTP' | tail -1   -> code
POST http://<node-ip>:30080/api/v1/auth/mfa/verify  {session_id,code}     -> {token}
```

`/api/v1/auth/*` and `/api/v1/.well-known/*` route to `user-service` via
platform-app's existing `itsm-routing` VS and are not in its DENY list — no
customer-app change needed to reach them.

### 4.7 apply script — `customer-app/scripts/apply-istio-config.sh`

`ENV=dev|qa` (default `dev`). Structural port of
`platform-app/scripts/apply-istio-config.sh`:

```
NS=customer-app-${ENV}
1. kubectl label ns "$NS" istio-injection=enabled --overwrite
   kubectl apply -f infra/k8s/namespaces/${ENV}/namespace-customer-app-${ENV}.yaml
2. echo "restart pods, wait for 2/2, then re-run with APPLY_MESH=1"  (guard)
   — mesh steps below run only when every pod is 2/2:
3. kubectl apply -f infra/k8s/istio/destination-rules/${ENV}/destination-rule.yaml
4. kubectl apply -f infra/k8s/istio/virtual-services/${ENV}/virtual-service.yaml
5. kubectl apply -f infra/k8s/istio/request-authentication/${ENV}/request-auth.yaml
6. kubectl apply -f infra/k8s/istio/authorization-policies/${ENV}/authz-deny-unauthenticated.yaml
7. 2/2 gate check (same grep as platform-app's script) → apply
   infra/k8s/istio/peer-authentication/${ENV}/peer-auth-mtls.yaml
8. print `kubectl get gateway,virtualservice,requestauthentication,authorizationpolicy,peerauthentication -n $NS`
```

The Gateway step is intentionally absent — customer-app reuses
`itsm-dev/itsm-gateway`. Helm (`helm upgrade`) still owns the Deployments; this
script only owns the Istio CRDs.

### 4.8 Rewritten `tenant-isolation-smoke-test.sh`

- New required inputs: `NODE_IP` (default: first node InternalIP via kubectl),
  `SEED_PASSWORD`, `GATEWAY_HOST` (default `customer-app.dev.local`),
  `GATEWAY_PORT` (default `30080`).
- Adds a `login(email, password)` helper: login → mfa/send → read the OTP from
  `kubectl logs -n itsm-dev deploy/user-service --since=30s | grep 'dev-mode: MFA OTP' | grep "email=$email" | tail -1`
  → mfa/verify → echo token. Grepping by `email=` avoids picking up another
  concurrent login's code.
- Mints `JWT_A` (customer_a) and `JWT_B` (customer_b) once at start.
- Every service call becomes
  `curl --resolve ${GATEWAY_HOST}:${GATEWAY_PORT}:${NODE_IP}
   -H "Authorization: Bearer $JWT_x" http://${GATEWAY_HOST}:${GATEWAY_PORT}/api/v1/...`
  — no raw `X-Tenant-ID`.
- Same 22 assertions as Phase 2 (list scoping + cross-tenant direct-id 404s +
  empty-query), plus 3 new mesh-auth assertions:
  - no `Authorization` header → `403`
  - `Authorization: Bearer garbage` → `401`
  - `JWT_A` + spoofed `-H "X-Tenant-ID: customer_b"` → still A's data
- The old port-forward path is removed (the mesh now requires a JWT, so
  direct-to-pod calls without one `403` anyway).
- `customer-app/docs/tenant-isolation-evidence.md` re-captured with the new run.

## 5. Verification (acceptance)

Run on `kubernetes-master` after `apply-istio-config.sh` completes and pods are
`2/2`:

1. `kubectl get pods -n customer-app-dev` → all `2/2 Running`, `RESTARTS` stable.
2. `istioctl analyze -n customer-app-dev` → no errors.
3. `curl --resolve customer-app.dev.local:30080:<ip> http://customer-app.dev.local:30080/api/v1/restaurants`
   (no token) → **403**.
4. Same with `-H "Authorization: Bearer not-a-jwt"` → **401**.
5. Seed users, mint `JWT_A`, then the same call with `-H "Authorization: Bearer $JWT_A"`
   → **200**, body lists customer_a's 2 restaurants.
6. Repeat 5 with an added `-H "X-Tenant-ID: customer_b"` → still customer_a's 2
   restaurants (claim overrides client header).
7. `bash scripts/tenant-isolation-smoke-test.sh` → `25 passed, 0 failed`
   (22 isolation + 3 mesh-auth), evidence doc updated.
8. `kubectl logs -n customer-app-dev deploy/order-service` shows no auth errors;
   a served request's span carries `tenant.id=customer_a`.

## 6. Files

**New**

```
customer-app/infra/k8s/istio/virtual-services/dev/virtual-service.yaml
customer-app/infra/k8s/istio/virtual-services/qa/virtual-service.yaml
customer-app/infra/k8s/istio/request-authentication/dev/request-auth.yaml
customer-app/infra/k8s/istio/request-authentication/qa/request-auth.yaml
customer-app/infra/k8s/istio/authorization-policies/dev/authz-deny-unauthenticated.yaml
customer-app/infra/k8s/istio/authorization-policies/qa/authz-deny-unauthenticated.yaml
customer-app/scripts/apply-istio-config.sh
customer-app/scripts/seed-customer-user.sh
customer-app/docs/phase-03-istio-ingress-guide.md
```

**Changed**

```
customer-app/infra/helm/customer-app/templates/order-service/deployment.yaml     # + proxy.istio.io/config annotation
customer-app/infra/helm/customer-app/templates/catalog-service/deployment.yaml   # "
customer-app/infra/helm/customer-app/templates/delivery-service/deployment.yaml  # "
customer-app/infra/helm/customer-app/templates/payment-service/deployment.yaml   # "
customer-app/infra/helm/customer-app/templates/redis/statefulset.yaml            # allow/confirm sidecar injection
customer-app/scripts/tenant-isolation-smoke-test.sh                              # JWT-based, through the gateway
customer-app/docs/tenant-isolation-evidence.md                                   # re-captured run
customer-app/TODO.md                                                             # Phase 3 checkboxes
```

**Removed** (`CLAUDE.md` §13 — listed for explicit approval)

```
customer-app/infra/k8s/istio/authorization-policies/dev/authz-allow-intra-namespace.yaml
customer-app/infra/k8s/istio/authorization-policies/qa/authz-allow-intra-namespace.yaml
```

## 7. Risks

| Risk | Mitigation |
|---|---|
| First meshed rollout: Java pods race Envoy on Postgres connect | D3 `holdApplicationUntilProxyStarts`; startupProbe is the backstop |
| STRICT mTLS applied before all pods `2/2` breaks the namespace | apply script's `2/2` gate (copied from platform-app's script), STRICT applied last |
| `redis-0` restart loses cache | cache-aside → transient MISS, non-fatal |
| Istio API version drift (`v1beta1` vs `v1` on Istio 1.22) | mirror platform-app's live-and-working `v1beta1`; `istioctl analyze` in verification catches a mismatch |
| External Postgres egress blocked once meshed | platform-app precedent says `ALLOW_ANY`; `ServiceEntry` for `172.16.12.226:5432` is the documented fallback |
| `customer-app.dev.local` unresolvable for a browser later | fine for Phase 3 (curl `--resolve`); the frontend phase picks a real name or a hosts entry |
| MFA-code-via-logs flow brittle in CI | Phase 3 verification is manual on the master; a CI-friendly token path is a later concern |

## 8. Rollback

- `kubectl delete -f` the 4 new Istio manifests (VS, RequestAuth, AuthzPolicy,
  and — to restore pre-Phase-3 reachability from inside the namespace —
  PeerAuthentication + DestinationRule).
- `kubectl label ns customer-app-dev istio-injection-` then
  `kubectl rollout restart` to drop sidecars.
- `helm rollback customer-app` to drop the proxy annotation.
- Seeded `public.users` rows can stay (inert) or be deleted by email.
- Phase 2's original raw-header smoke test is preserved in git history if the
  JWT rewrite needs to be reverted alongside.

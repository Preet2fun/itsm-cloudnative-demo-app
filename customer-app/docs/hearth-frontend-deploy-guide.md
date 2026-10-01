# Customer App — Hearth Frontend Deploy Guide

Containerizes and deploys Hearth's Login + 6-digit MFA verify screens (the
only screens built in the real stack so far) — closes out GitHub issue #45
("Draft + build customer-app's first screen"). Companion to
[`deployment-guide.md`](deployment-guide.md) (Phase 1, the 4 backend
services) and [`phase-03-istio-ingress-guide.md`](phase-03-istio-ingress-guide.md)
(the auth routing this guide extends).

---

## Overview

What this adds, on top of the already-live 4 backend services:

- `services/frontend/` — a Vite/React/TS SPA ("hearth-ui"), built to static
  files and served by `nginx:alpine`, same pattern as platform-app's Synap UI.
- A new Helm-managed `frontend` Deployment/Service/HPA in `customer-app-dev`.
- A routing fix to `infra/k8s/istio/virtual-services/dev/virtual-service.yaml`:
  `customer-app-routing` now also routes `/api/v1/auth/*` and
  `/api/v1/.well-known/*` to platform-app's `user-service` (cross-namespace),
  plus a catch-all to the new `frontend` service. See that file's own comment
  for why — short version: once `customer-app-routing` claims the exact host
  `customer-app.dev.local`, nothing falls through to platform-app's `itsm-routing`
  for that host, even for paths only it used to define, and Hearth's frontend
  needs same-origin auth calls to work in a real browser.

**No AuthorizationPolicy or RequestAuthentication changes needed** —
confirmed by reading `authz-deny-unauthenticated.yaml`: its DENY rule is
scoped only to the 4 existing API path prefixes (restaurants/orders/
deliveries/payments). Auth paths were never in that list, and nothing denies
the frontend's own static paths either.

---

## Prerequisites

- Phase 1 (4 backend services) and Phase 3 (Istio ingress + JWT authn) both
  live and passing — this guide doesn't re-verify those.
- `DATABASE_URL` reachable (root `CLAUDE.md` — verify against that file, not
  a possibly-stale `.env`).
- At least one real login user per tenant you want to test. `customer-app/
  scripts/seed-customer-user.sh` upserts them into the shared `public.users`
  table — safe to re-run, it's an upsert.

---

## Step 1 — Seed login users for every tenant you want to test

To actually verify login across different tenants in a browser (not just
one), seed all three, not just the script's two-tenant default:

```bash
cd customer-app
DATABASE_URL=postgres://itsm:itsm@172.16.12.226:5432/itsm?sslmode=disable \
SEED_PASSWORD='<pick a dev password>' \
USERS="owner@customer-a.example:customer_a owner@customer-b.example:customer_b owner@customer-c.example:customer_c" \
  bash scripts/seed-customer-user.sh
```

Expected: a table printing all 3 emails with `role=admin`, each a different
`tenant_id`, `is_active=true`.

---

## Step 2 — Build and push the frontend image

The existing CI pipeline (`.github/workflows/ci-docker-push.yml`) now
includes `frontend` in its build matrix — pushing these changes to `main`
triggers it automatically and bumps `values.yaml`'s `frontend.image.tag` for
you (same mechanism already proving itself for the other 4 services).

If you want to test locally first, without waiting on CI:

```bash
cd customer-app/services/frontend
docker build -t preet2fun/frontend:v0.1.0 .
docker push preet2fun/frontend:v0.1.0
```

(Tag must match `infra/helm/customer-app/values.yaml`'s `frontend.image.tag`
— `v0.1.0` by default; bump both together if you change it.)

---

## Step 3 — Deploy with Helm

```bash
cd customer-app
helm upgrade --install customer-app infra/helm/customer-app \
  --namespace customer-app-dev \
  --create-namespace \
  -f infra/helm/customer-app/values.yaml
```

(If ArgoCD already manages this release — it does, per
`platform-app/infra/argocd/apps/dev/customer-app.yaml`, `syncPolicy.automated`
— a push to `main` syncs this automatically; manual `helm upgrade` is only
for testing before you push.)

---

## Step 4 — Apply the updated Istio routing

The VirtualService change is **not** managed by ArgoCD (only the Helm chart
is) — apply it directly:

```bash
cd customer-app
ENV=dev bash scripts/apply-istio-config.sh
```

---

## Step 5 — Verify K8s resources

```bash
kubectl get pods -n customer-app-dev -l app=frontend
# Expected: 1 pod, 2/2 READY (app + istio sidecar)

kubectl get hpa -n customer-app-dev frontend-hpa
# Expected: minReplicas=1 maxReplicas=1

kubectl get virtualservice -n customer-app-dev customer-app-routing -o yaml
# Expected: the http[] list now has 6 entries — auth, restaurants, orders,
# deliveries, payments, then the frontend catch-all (no `match:` block)
```

---

## Step 6 — Verify login in a browser, for at least 2 different tenants

This is the actual Done-when for issue #45 and the specific ask for this
piece of work — not just "it builds," but a real login, in a browser,
working for more than one tenant.

1. Find a worker node's IP (`kubectl get nodes -o wide`) and add it to
   `/etc/hosts`:
   ```
   <node-ip>  customer-app.dev.local
   ```
2. Open `http://customer-app.dev.local:30080/` — should land on Hearth's
   login screen (gradient wordmark, email/password form).
3. Log in as `owner@customer-a.example` / `<the SEED_PASSWORD you set>`.
4. The MFA code isn't emailed in dev — it's logged server-side:
   ```bash
   kubectl logs -n itsm-dev deploy/user-service --tail=20 | grep "MFA OTP"
   # Expected: "dev-mode: MFA OTP generated" ... "email":"owner@customer-a.example" "code":"123456"
   ```
5. Enter that 6-digit code on the verify screen. Expected: redirected past
   login (confirms a real JWT was issued and stored).
6. **Log out, or open a private/incognito window, and repeat steps 3–5 as
   `owner@customer-b.example`** (and `owner@customer-c.example` if you want
   all three) — confirming the auth routing fix works for every tenant, not
   just one, and that each login mints a JWT with that tenant's own
   `tenant_id` claim (not a cached/shared session).

Report back what you see at each step — particularly whether step 2 loads
Hearth at all (confirms the frontend catch-all route) and whether step 5
succeeds for a second tenant (confirms the auth routing fix, the actual
point of Step 4).

---

## Rollback

```bash
# Revert just the frontend piece — scale to 0, leave the rest running:
kubectl scale deployment frontend -n customer-app-dev --replicas=0

# Or full teardown of this Helm release (does NOT touch Postgres data):
helm uninstall customer-app -n customer-app-dev
```

Reverting the VirtualService: `git checkout` the previous version of
`infra/k8s/istio/virtual-services/dev/virtual-service.yaml`, then re-run
Step 4.

---

## Troubleshooting

**Browser shows Istio's default 404 at `customer-app.dev.local`** — Step 4
wasn't run, or `apply-istio-config.sh` failed partway. Re-check
`kubectl get virtualservice -n customer-app-dev customer-app-routing -o yaml`
for the 6-route list.

**Login screen loads but submitting shows a network/CORS-looking error** —
almost certainly the auth route didn't take. Confirm with:
```bash
curl -s -o /dev/null -w '%{http_code}\n' --resolve customer-app.dev.local:30080:<node-ip> \
  -X POST http://customer-app.dev.local:30080/api/v1/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"owner@customer-a.example","password":"wrong"}'
# Expected: 401 (bad password, but routed correctly) — NOT 404
```
A `404` here means the VirtualService's auth route isn't live — redo Step 4.

**Second tenant's login works but returns the first tenant's data** — a real
tenant-isolation bug, not a frontend issue; stop and report rather than
continuing past it.

---

## Acceptance checklist

- [ ] `frontend` pod running, 2/2 ready, HPA capped at max=1
- [ ] `http://customer-app.dev.local:30080/` loads Hearth's login screen
- [ ] Login + MFA succeeds for **customer_a**
- [ ] Login + MFA succeeds for **customer_b** (or **customer_c**) in a
      separate session — confirms the auth-routing fix generally, not one
      lucky path
- [ ] Each session's JWT carries that tenant's own `tenant_id` (no
      cross-tenant bleed)
- [ ] Issue #45 closed with a one-line note pointing at this guide

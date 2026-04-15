# Multi-Tenancy Model

## Overview

The ITSM demo app uses a **seven-layer isolation model** — each layer adds a distinct type of tenant boundary. No single layer is sufficient on its own; together they provide defence-in-depth for multi-tenant data and access control.

---

## Tenant Identity

Tenants are identified by a `slug` — a lowercase string used consistently across all isolation layers:

| Slug | Namespace (dev) | Namespace (qa) | DB Schema | Redis prefix | Istio host (dev) |
|---|---|---|---|---|---|
| `tenant-a` | `tenant-a` | `qa-tenant-a` | `tenant_a` | `tenant-a:` | `tenant-a.itsm.local` |
| `tenant-b` | `tenant-b` | `qa-tenant-b` | `tenant_b` | `tenant-b:` | `tenant-b.itsm.local` |
| `tenant-c` | `tenant-c` | `qa-tenant-c` | `tenant_c` | `tenant-c:` | `tenant-c.itsm.local` |

---

## Layer 1 — Network Routing (Istio VirtualService)

Each tenant gets a dedicated subdomain. Istio `VirtualService` matches on the HTTP `Host` (authority) header and routes to the correct tenant namespace.

```yaml
# infra/k8s/istio/virtual-services/dev/tenant-a.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: tenant-a
  namespace: tenant-a
spec:
  hosts:
    - tenant-a.itsm.local
  gateways:
    - istio-system/itsm-gateway
  http:
    - match:
        - uri: { prefix: /api/v1/users }
      route:
        - destination:
            host: user-service.tenant-a.svc.cluster.local
            port: { number: 8080 }
    - match:
        - uri: { prefix: /api/v1/assets }
      route:
        - destination:
            host: asset-service.tenant-a.svc.cluster.local
            port: { number: 8081 }
    # ... (incidents, ai, frontend)
```

**Result:** A request to `tenant-b.itsm.local` can never reach services in the `tenant-a` namespace regardless of JWT content — Istio routes at the network level first.

---

## Layer 2 — Authentication (Istio RequestAuthentication)

Istio validates the JWT signature using the JWKS endpoint served by each tenant's User Service.

```yaml
# infra/k8s/istio/request-authentication/dev/tenant-a.yaml
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-tenant-a
  namespace: tenant-a
spec:
  jwtRules:
    - issuer: "itsm-user-service"
      jwksUri: "http://user-service.tenant-a.svc.cluster.local:8080/api/v1/.well-known/jwks.json"
      outputClaimToHeaders:
        - header: x-tenant-id
          claim: tenant_id
        - header: x-user-role
          claim: role
```

**What this does:**
- Validates JWT signature against the JWKS public key
- Validates `exp`, `iat`, `iss` claims
- Extracts `tenant_id` claim → injects as `X-Tenant-ID` request header
- Extracts `role` claim → injects as `X-User-Role` request header

**What happens on invalid JWT:** Istio returns 401 Unauthorized before the request reaches any service.

---

## Layer 3 — Tenant Authorization (Istio AuthorizationPolicy — ALLOW/DENY)

Even if a valid JWT is present, the tenant must match the subdomain:

```yaml
# infra/k8s/istio/authorization-policies/dev/tenant-a.yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: require-tenant-a-jwt
  namespace: tenant-a
spec:
  action: ALLOW
  rules:
    - when:
        - key: request.auth.claims[tenant_id]
          values: ["tenant-a"]
```

**Result:** A `tenant-b` JWT presented to `tenant-a.itsm.local` returns 403 — even though the JWT is cryptographically valid.

---

## Layer 4 — RBAC (OPA ext_authz — CUSTOM action)

After tenant isolation is enforced, OPA evaluates fine-grained role-based access:

```yaml
# infra/k8s/opa/authz-policy-custom/dev/tenant-a.yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: opa-rbac-tenant-a
  namespace: tenant-a
spec:
  action: CUSTOM
  provider:
    name: opa-ext-authz
  rules:
    - to:
        - operation:
            paths: ["/api/v1/*"]
```

OPA receives the full request attributes (method, path, headers including `X-User-Role`) and evaluates `policies/rego/rbac.rego`.

**RBAC matrix:**

| Role | GET /incidents | POST/PUT /incidents | DELETE /incidents | GET /assets | POST/PUT /assets | /users | /ai/* |
|---|---|---|---|---|---|---|---|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | All | ✅ |
| agent | ✅ | ✅ | ❌ | ✅ | ✅ | GET only | ✅ |
| viewer | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |

---

## Layer 5 — Kubernetes Namespace Isolation

Each tenant runs in its own namespace with:
- **ResourceQuota** — CPU/memory limits prevent one tenant's services from starving others
- **LimitRange** — default container resource limits applied automatically
- **NetworkPolicy** — (Istio PeerAuthentication covers this, but explicit NetworkPolicy can be added)
- **RBAC** — service accounts scoped to their own namespace

---

## Layer 6 — Data Isolation (PostgreSQL Schema-per-Tenant)

A single PostgreSQL instance hosts all tenants. Each tenant has its own schema:

```sql
-- public schema: shared tenant registry
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  ...
);

-- Tenant schema creation (called once per tenant)
CREATE SCHEMA IF NOT EXISTS tenant_a;

-- Each table exists per-schema
CREATE TABLE tenant_a.users (...);
CREATE TABLE tenant_a.assets (...);
CREATE TABLE tenant_a.incidents (...);
```

**Query isolation:** Every DB connection sets `search_path` to the tenant schema:
```sql
SET search_path = tenant_a;
SELECT * FROM incidents;  -- only tenant_a.incidents rows returned
```

This makes cross-tenant data reads structurally impossible without explicit schema qualification.

---

## Layer 7 — Cache Isolation (Redis Key Prefix)

All Redis keys are prefixed with the tenant ID:

```
tenant-a:assets:list:<filter_hash>    → asset list cache for tenant-a
tenant-b:assets:list:<filter_hash>    → completely separate key
tenant-a:chat:session:<session_id>    → AI chat session (Phase 7)
```

Pattern enforced in all service `telemetry/` cache wrappers — raw Redis operations are never used directly in business logic.

---

## JWT Structure

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-a",
  "role": "agent",
  "email": "alice@tenant-a.example.com",
  "iss": "itsm-user-service",
  "iat": 1744617600,
  "exp": 1744621200,
  "jti": "unique-token-id"
}
```

**Claim usage:**
- `tenant_id` → Istio injects as `X-Tenant-ID` → services use for `search_path` and Redis key prefix
- `role` → Istio injects as `X-User-Role` → OPA uses for RBAC decisions; services use for data filtering only
- `sub` → `actor_user_id` in audit trails and incident events

---

## Adding a New Tenant

To add a fourth tenant (`tenant-d`):

1. Add tenant record: `INSERT INTO public.tenants (slug, name) VALUES ('tenant-d', 'Tenant D');`
2. Run `create_tenant_schema('tenant-d')` stored procedure
3. Create K8s namespace: `kubectl apply -f infra/k8s/namespaces/dev/tenant-d.yaml`
4. Apply ResourceQuota + LimitRange
5. Apply Istio RequestAuthentication, AuthorizationPolicy, VirtualService, DestinationRule for tenant-d
6. Apply OPA custom AuthorizationPolicy for tenant-d namespace
7. Add Helm values: `values-tenant-d.yaml`
8. Add ArgoCD Application: `infra/argocd/apps/dev/app-tenant-d.yaml`
9. Add `/etc/hosts` entry

All steps are scripted in `scripts/create-tenants.sh` — extend the loop for the new slug.

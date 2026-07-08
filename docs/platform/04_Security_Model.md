# Security Model

Synap implements a layered, zero-trust security architecture. No service trusts any incoming request without independent verification. This document describes every security control in the platform and how they chain together.

---

## Security Architecture Overview

```mermaid
graph TB
    subgraph "Perimeter"
        TLS[TLS Termination<br/>Istio IngressGateway]
    end
    subgraph "AuthN Layer"
        RA[RequestAuthentication<br/>RS256 JWT via JWKS]
    end
    subgraph "Tenant Isolation Layer"
        AP[AuthorizationPolicy<br/>DENY — wrong tenant_id]
    end
    subgraph "RBAC Layer"
        OPA[OPA ext_authz<br/>role + method + path Rego]
    end
    subgraph "Transport Layer"
        MTLS[PeerAuthentication<br/>STRICT mTLS — all pods]
    end
    subgraph "Data Layer"
        SP[search_path per connection<br/>PostgreSQL schema isolation]
        RK[Prefixed cache keys<br/>Redis isolation]
    end

    TLS --> RA --> AP --> OPA --> MTLS --> SP & RK
```

---

## Authentication Flow

### 1. Standard Login (email + password)

```mermaid
sequenceDiagram
    participant Browser
    participant IG as Istio IngressGateway
    participant US as user-service :8080
    participant PG as PostgreSQL

    Browser->>IG: POST /api/v1/auth/login<br/>{ email, password }
    IG->>IG: Path is public — skip JWT check
    IG->>US: Forward request
    US->>PG: SELECT * FROM users WHERE email = $1
    PG-->>US: User row + bcrypt hash
    US->>US: bcrypt.CompareHashAndPassword()
    alt password matches
        US->>US: Sign RS256 JWT<br/>{ sub, tenant_id, role, email, iss, exp, jti }
        US-->>Browser: 200 { access_token, expires_in }
    else invalid credentials
        US-->>Browser: 401 Unauthorized
    end
```

### 2. MFA — Email OTP Flow (v0.4.0)

When MFA is enabled on a user account, login returns a partial token (`mfa_required: true`). The client must complete the OTP challenge before receiving a full access token.

```mermaid
sequenceDiagram
    participant Browser
    participant US as user-service
    participant Email as Email Provider
    participant PG as PostgreSQL

    Browser->>US: POST /api/v1/auth/login { email, password }
    US->>US: Verify password ✓
    US->>US: Check mfa_enabled flag
    US->>PG: INSERT otp_challenges (user_id, code, expires_at)
    US->>Email: Send OTP email to user
    US-->>Browser: 200 { mfa_required: true, session_token: <short-lived> }

    Browser->>US: POST /api/v1/auth/otp/verify<br/>Authorization: Bearer <session_token><br/>{ otp_code }
    US->>PG: SELECT * FROM otp_challenges WHERE user_id=$1 AND code=$2
    alt OTP valid + not expired
        US->>PG: DELETE otp_challenge (single-use)
        US->>US: Sign full RS256 JWT
        US-->>Browser: 200 { access_token, expires_in }
    else OTP invalid or expired
        US-->>Browser: 401 { error: "invalid_otp" }
    end
```

### 3. Token Refresh

```mermaid
sequenceDiagram
    participant Browser
    participant IG as Istio IngressGateway
    participant US as user-service

    Browser->>IG: POST /api/v1/auth/refresh<br/>Authorization: Bearer <access_token>
    IG->>IG: Validate JWT (exp check — may be near expiry)
    IG->>US: Forward with X-Tenant-ID + X-User-Role
    US->>US: Validate jti not in revocation list
    US->>US: Issue new JWT (new jti, new exp)
    US-->>Browser: 200 { access_token, expires_in }
```

---

## Request Authorization Flow (Full Chain)

Every non-public API call passes through all four security layers in order:

```mermaid
sequenceDiagram
    participant Browser
    participant IG as IngressGateway
    participant RA as RequestAuthentication
    participant AP as AuthorizationPolicy
    participant OPA as OPA ext_authz :9191
    participant SVC as Application Service

    Browser->>IG: GET /api/v1/incidents<br/>Authorization: Bearer <JWT><br/>Host: tenant-a.itsm.local

    IG->>RA: Validate RS256 JWT<br/>against JWKS from user-service
    alt JWT invalid / expired
        RA-->>Browser: 401 Unauthorized
    end

    IG->>AP: Check tenant_id claim == tenant-a?
    alt tenant_id mismatch (e.g. tenant_b token → tenant-a service)
        AP-->>Browser: 403 Forbidden
    end

    IG->>OPA: CheckRequest gRPC<br/>{ role: "agent", method: "GET", path: "/api/v1/incidents" }
    alt OPA denies
        OPA-->>Browser: 403 Forbidden
    end

    IG->>SVC: Forward with injected headers<br/>X-Tenant-ID: tenant_a<br/>X-User-Role: agent<br/>traceparent: 00-...
    SVC-->>Browser: 200 OK
```

---

## Istio Security Resources

### PeerAuthentication — STRICT mTLS

All pod-to-pod communication within the mesh uses mutual TLS. Istio automatically provisions and rotates certificates via Istiod.

```yaml
# Applied to each tenant namespace
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: tenant-a
spec:
  mtls:
    mode: STRICT
```

No plaintext pod traffic is permitted. This protects against:
- Lateral movement if a container is compromised
- Traffic sniffing between services

### RequestAuthentication — RS256 JWKS Validation

```yaml
apiVersion: security.istio.io/v1
kind: RequestAuthentication
metadata:
  name: jwt-auth
  namespace: tenant-a
spec:
  jwtRules:
    - issuer: "itsm-user-service"
      jwksUri: "http://user-service.tenant-a.svc.cluster.local:8080/api/v1/.well-known/jwks.json"
      audiences: ["itsm-synap"]
      forwardOriginalToken: false
```

### AuthorizationPolicy — Tenant DENY

```yaml
# Deny all requests that do not carry a valid JWT with matching tenant_id
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: require-jwt
  namespace: tenant-a
spec:
  action: DENY
  rules:
    - from:
        - source:
            notRequestPrincipals: ["*"]
      to:
        - operation:
            notPaths: ["/health", "/api/v1/.well-known/jwks.json", "/api/v1/auth/login"]
```

### AuthorizationPolicy — OPA ext_authz (CUSTOM)

```yaml
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: opa-authz
  namespace: tenant-a
spec:
  action: CUSTOM
  provider:
    name: opa-ext-authz-grpc
  rules:
    - to:
        - operation:
            paths: ["/api/v1/*"]
```

---

## OPA Rego Policy

OPA evaluates role-based access using a simple allow matrix:

```rego
package itsm.authz

import future.keywords.if
import future.keywords.in

default allow = false

# Admin: full access
allow if {
    input.attributes.request.http.headers["x-user-role"] == "admin"
}

# Agent: read + write, no delete
allow if {
    input.attributes.request.http.headers["x-user-role"] == "agent"
    input.attributes.request.http.method in {"GET", "POST", "PUT"}
}

# Viewer: read-only
allow if {
    input.attributes.request.http.headers["x-user-role"] == "viewer"
    input.attributes.request.http.method == "GET"
}

# Public paths: always allow
allow if {
    input.attributes.request.http.path in {
        "/health",
        "/api/v1/.well-known/jwks.json",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
    }
}
```

---

## JWT Key Management

| Phase | Algorithm | Key Storage | Validation |
|---|---|---|---|
| Phase 3–5 | HS256 (symmetric) | K8s Secret (`JWT_SECRET`) | user-service only |
| Phase 6+ | RS256 (asymmetric) | K8s Secret (private key), JWKS endpoint (public key) | Istio RequestAuthentication |

**RS256 key generation (Phase 6):**
```bash
openssl genrsa -out jwt-private.pem 2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
kubectl create secret generic jwt-keypair \
  --from-file=private.pem=jwt-private.pem \
  --from-file=public.pem=jwt-public.pem \
  -n tenant-a
```

The private key is mounted read-only into `user-service`. The public key is served at `/api/v1/.well-known/jwks.json` in JWK Set format.

---

## Secret Management

| Secret | Type | Scope | Contents |
|---|---|---|---|
| `jwt-keypair` | K8s Secret | Per-namespace | RS256 private + public key PEM |
| `db-credentials` | K8s Secret | Per-namespace | `DATABASE_URL` |
| `redis-credentials` | K8s Secret | Per-namespace | `REDIS_URL` |
| `rabbitmq-credentials` | K8s Secret | Per-namespace | `RABBITMQ_URL` |

All secrets are namespace-scoped. No cross-namespace secret access is permitted.

> Phase 9 will introduce sealed secrets or external secrets operator for GitOps-safe secret management.

---

## Security Roles

| Role | Description | Typical User |
|---|---|---|
| `admin` | Full platform access; can manage users, assets, incidents | IT Manager |
| `agent` | Can create/update assets and incidents; cannot delete or manage users | IT Technician |
| `viewer` | Read-only access to all resources | End-user / Observer |

---

## Threat Model Summary

| Threat | Mitigation |
|---|---|
| Cross-tenant data access | AuthorizationPolicy checks `tenant_id`; schema-per-tenant in PG |
| JWT forgery | RS256 asymmetric signing; private key never leaves user-service |
| Privilege escalation | OPA role matrix enforced at gateway before reaching any service |
| Lateral movement | STRICT mTLS — all pod traffic encrypted + authenticated |
| Replay attack | `jti` (JWT ID) claim; short expiry (15 min access token) |
| Cache poisoning across tenants | Redis key prefix enforced; no unscoped keys permitted |
| Noisy neighbour / DoS | Resource limits + HPA (max=2) per service; rate limiting in Istio |

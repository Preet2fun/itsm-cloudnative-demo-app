# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch | ✅ Active development |
| Tagged releases (`v0.x.x`) | ✅ Best-effort patch support |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security vulnerabilities via [GitHub Private Security Advisory](https://github.com/preet2fun/itsm-cloudnative-demo-app/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected component (service name, version)
- Potential impact
- Whether it crosses tenant boundaries (see Multi-Tenancy below)

You will receive an acknowledgement within **48 hours** and a resolution timeline within **7 days**.

## Security Model

### Multi-Tenancy Isolation
Synap is a multi-tenant system. Tenant isolation is enforced at four independent layers:

| Layer | Mechanism | Where |
|-------|-----------|-------|
| Network | Istio AuthorizationPolicy (DENY unauthenticated; tenant JWT claim must match route) | Mesh |
| Auth | RS256 JWT — `tenant_id` claim injected as `X-Tenant-ID` header by Istio | All requests |
| Data | PostgreSQL schema-per-tenant (`tenant_a`, `tenant_b`, …); `search_path` set per connection | Database |
| Cache | Redis keys prefixed `itsm:{tenant_slug}:*`; never FLUSHDB | Redis |

A vulnerability that allows one tenant to read or modify another tenant's data is treated as **critical**.

### RBAC
OPA ext_authz enforces role-based access control (role + HTTP method + path) for every API request. Roles: `admin`, `agent`, `viewer`.

### JWT
- Algorithm: RS256 (asymmetric); private key never leaves user-service
- JWKS endpoint served by user-service; Istio fetches and caches public keys
- Claims: `sub`, `tenant_id`, `role`, `email`, `exp`, `iat`, `jti`
- Services **never** validate JWTs themselves — they read `X-Tenant-ID` / `X-User-Role` headers injected by Istio

### mTLS
All pod-to-pod communication is encrypted with Istio STRICT PeerAuthentication.

## Out of Scope

- Vulnerabilities in upstream dependencies (Istio, OPA, PostgreSQL) — report to their respective projects
- Demo/development seed data exposure (the seed data is intentionally public and not real)
- Rate limiting bypass in the demo profile (demo Istio profile has relaxed limits by design)

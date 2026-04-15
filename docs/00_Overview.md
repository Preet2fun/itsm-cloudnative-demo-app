# Architecture Overview

## Purpose

The ITSM CloudNative Demo App is a reference implementation of a multi-tenant IT Service Management platform built entirely on cloud-native open-source tooling. It serves three purposes:

1. **Pattern validation** — demonstrate HPA, Istio service mesh, OPA RBAC, OTel three-signal observability, and ArgoCD GitOps on a real local kubeadm cluster
2. **AI feature validation** — provide a live runtime for iterating on AI-powered ITSM features (incident triage, semantic asset search, anomaly detection, helpdesk chatbot)
3. **SaaS blueprint** — every architectural decision is transferable to a production multi-tenant SaaS product

---

## Service Responsibility Matrix

| Service | Language | Responsibilities |
|---|---|---|
| **User Service** | Go | JWT issuance, JWKS endpoint, user CRUD, serves as the identity source of truth |
| **Asset Service** | Python/FastAPI | Asset CRUD (CMDB-lite), Redis caching, asset-incident linkage |
| **Incident Service** | Python/FastAPI | Incident lifecycle, SLA tracking, RabbitMQ event publishing |
| **Notification Service** | Go | RabbitMQ consumer, webhook delivery stubs, event fan-out |
| **AI Service** | Python | Incident triage, semantic asset search, anomaly detection, RAG chatbot |
| **Frontend** | Next.js | Unified UI for all three ITSM modules + AI assistant panel |
| **Istio IngressGateway** | — | Cluster entry point, JWT validation, tenant routing, header injection |
| **OPA** | — | RBAC enforcement via Rego policies — role + method + path |

---

## Request Flow (Detailed)

A request from a browser to `tenant-a.itsm.local/api/v1/incidents` goes through the following sequence:

```
1. Browser sends:
   GET /api/v1/incidents
   Host: tenant-a.itsm.local
   Authorization: Bearer <JWT>

2. Istio IngressGateway receives the request.

3. RequestAuthentication:
   - Fetches JWKS from http://user-service.tenant-a.svc.cluster.local/api/v1/.well-known/jwks.json
   - Validates JWT signature, expiry, issuer
   - Injects headers via outputClaimToHeaders:
       X-Tenant-ID: tenant-a         (from JWT claim: tenant_id)
       X-User-Role: agent            (from JWT claim: role)

4. AuthorizationPolicy (ALLOW/DENY — tenant isolation):
   - Checks: JWT claim tenant_id == "tenant-a" for host tenant-a.itsm.local
   - Mismatch (e.g. tenant-b JWT on tenant-a host) → 403 immediately

5. AuthorizationPolicy (CUSTOM — OPA ext_authz):
   - Envoy sidecar calls OPA gRPC service (opa.opa.svc.cluster.local:9191)
   - OPA evaluates rbac.rego:
       input.method = "GET"
       input.path = "/api/v1/incidents"
       input.role = "agent"
       → allow = true
   - OPA returns allow → request proceeds

6. EnvoyFilter (local rate limit):
   - Checks per-tenant rate limit bucket
   - If exceeded → 429

7. VirtualService routes:
   - host: tenant-a.itsm.local → incident-service.tenant-a.svc.cluster.local

8. Incident Service receives request:
   - Reads X-Tenant-ID header: "tenant-a"
   - Sets PostgreSQL search_path = tenant_a
   - Queries incidents table within tenant_a schema
   - Returns response with X-Request-ID header

9. OTel spans created at each step:
   - Istio sidecar span (ingress → service)
   - FastAPI auto-instrumentation span
   - SQLAlchemy span (DB query)
   - Manual business span: itsm.incident.listed (tenant_id, result_count attrs)
   - All shipped via OTLP to OTel Collector → Prometheus, Loki, Jaeger
```

---

## Multi-Tenancy Architecture

### Isolation Layers

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Network / Routing                             │
│  Istio VirtualService — subdomain per tenant            │
│  tenant-a.itsm.local → namespace tenant-a only          │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Authentication                                │
│  Istio RequestAuthentication — JWT signature validation │
│  JWKS served by User Service per tenant                 │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Tenant Authorization                          │
│  Istio AuthorizationPolicy (ALLOW/DENY)                 │
│  JWT tenant_id claim must match subdomain               │
├─────────────────────────────────────────────────────────┤
│  Layer 4: RBAC                                          │
│  OPA ext_authz (AuthorizationPolicy CUSTOM)             │
│  Rego policy: role + HTTP method + path → allow/deny    │
├─────────────────────────────────────────────────────────┤
│  Layer 5: K8s Isolation                                 │
│  Separate namespace per tenant                          │
│  ResourceQuota + LimitRange per namespace               │
│  Namespace-scoped RBAC (services cannot cross-namespace)│
├─────────────────────────────────────────────────────────┤
│  Layer 6: Data Isolation                                │
│  Single PostgreSQL instance                             │
│  Schema per tenant: tenant_a, tenant_b, tenant_c        │
│  search_path set per connection — no cross-schema reads │
├─────────────────────────────────────────────────────────┤
│  Layer 7: Cache Isolation                               │
│  Redis key prefix: {tenant_id}:{type}:{id}              │
│  No cross-tenant key collisions possible                │
└─────────────────────────────────────────────────────────┘
```

### Tenant Environments

| Env | Namespace pattern | Istio host pattern | ArgoCD values stack |
|---|---|---|---|
| dev | `tenant-a`, `tenant-b`, `tenant-c` | `*.itsm.local` | `values.yaml` + `values-dev.yaml` + `values-tenant-X.yaml` |
| qa | `qa-tenant-a`, `qa-tenant-b`, `qa-tenant-c` | `*.qa.itsm.local` | `values.yaml` + `values-qa.yaml` + `values-tenant-X.yaml` |

---

## Observability Architecture

```
Services (auto + manual OTel SDK instrumentation)
         │
         │  OTLP/gRPC
         ▼
  OTel Collector  (namespace: observability)
         │
         ├──── metrics ──▶  Prometheus  ──▶  Grafana
         ├──── logs    ──▶  Loki        ──▶  Grafana
         └──── traces  ──▶  Jaeger      ──▶  Grafana
                                              │
                                    trace ↔ logs correlation
                                    via trace_id in log labels
```

**Two instrumentation layers per service:**
- **Auto:** HTTP, DB, Redis, RabbitMQ — zero-code spans from SDK libraries
- **Manual (business):** custom spans for business operations (e.g., `itsm.incident.priority_change`), custom metrics (e.g., `itsm_incidents_sla_breached_total`), span events for state transitions

---

## OPA RBAC Architecture

```
Request reaches Envoy sidecar in tenant namespace
         │
         │  ext_authz gRPC call
         ▼
OPA (opa namespace, port 9191)
         │
         │  evaluates policies/rego/rbac.rego
         │  input: { method, path, headers.x-user-role, headers.x-tenant-id }
         │
         ├── admin  → allow all /api/v1/* endpoints
         ├── agent  → allow GET+POST+PUT on /incidents, /assets
         │            allow GET on /users
         │            allow all /ai/*
         ├── viewer → allow GET only on /incidents, /assets
         │            allow all /ai/*
         └── *      → deny by default
```

Policies are version-controlled Rego files in `policies/rego/`, loaded via ConfigMap. Policy updates require only a pod restart — no service redeployments.

---

## GitOps Delivery Model

```
Developer pushes to GitHub (main branch)
         │
         ▼
GitHub Actions CI
  ├── lint (golangci-lint, ruff, eslint, opa test)
  ├── build (docker build per service)
  └── push (Docker Hub: <user>/itsm-<service>:<git-sha>)
         │
         ▼
ArgoCD watches GitHub repo
  ├── detects change in infra/helm/ or values files
  └── syncs Application → kubectl apply to K8s cluster
         │
         ▼
K8s cluster updated — zero manual kubectl commands
```

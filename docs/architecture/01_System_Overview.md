# System Overview

**Synap** is an AI-native, multi-tenant IT Service Management (ITSM) + IT Operations Management (ITOM) platform built as a cloud-native open-source reference implementation. It runs on a kubeadm Kubernetes cluster with Istio service mesh, OPA policy enforcement, and full OpenTelemetry observability.

---

## Deployment Model

### Target Architecture (Phase 6+)

Each tenant runs in its own dedicated Kubernetes namespace. Traffic enters through a shared Istio IngressGateway and is routed to the correct namespace by subdomain.

```
tenant-a.itsm.local  → namespace: tenant-a
tenant-b.itsm.local  → namespace: tenant-b
tenant-c.itsm.local  → namespace: tenant-c
```

### Current State (Phase 5 — single namespace stepping stone)

All services currently run in `itsm-dev`. Phase 6 migrates to the target per-namespace model.

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client"
        B[Browser]
    end

    subgraph "K8s Cluster — istio-system"
        IG[Istio IngressGateway<br/>:80 / :443]
        PILOT[Istiod / Pilot]
    end

    subgraph "K8s Cluster — opa"
        OPA[OPA Ext-Authz<br/>gRPC :9191]
    end

    subgraph "K8s Cluster — tenant-a"
        FE_A[frontend:80<br/>nginx:alpine]
        US_A[user-service:8080<br/>Go / Chi v5]
        AS_A[asset-service:8000<br/>Python / FastAPI]
        IS_A[incident-service:8000<br/>Python / FastAPI]
    end

    subgraph "K8s Cluster — tenant-b"
        FE_B[frontend:80]
        US_B[user-service:8080]
        AS_B[asset-service:8000]
        IS_B[incident-service:8000]
    end

    subgraph "K8s Cluster — tenant-c"
        FE_C[frontend:80]
        US_C[user-service:8080]
        AS_C[asset-service:8000]
        IS_C[incident-service:8000]
    end

    subgraph "K8s Cluster — observability"
        OTC[OTel Collector]
        PROM[Prometheus]
        LOKI[Loki]
        JAEGER[Jaeger]
        GRAFANA[Grafana]
    end

    subgraph "External Services"
        PG[(PostgreSQL 16<br/>172.16.13.168:5432<br/>schema-per-tenant)]
        REDIS[(Redis 7.x<br/>prefix-per-tenant)]
        MQ[RabbitMQ 3.13<br/>W3C traceparent in headers]
    end

    B -->|HTTPS + JWT| IG
    IG -->|OPA ext_authz check| OPA
    OPA -.->|allow/deny| IG
    PILOT -.->|xDS config| IG

    IG -->|tenant-a.itsm.local| FE_A
    IG -->|/api/v1/auth/*| US_A
    IG -->|/api/v1/assets/*| AS_A
    IG -->|/api/v1/incidents/*| IS_A

    IG -->|tenant-b.itsm.local| FE_B
    IG -->|tenant-c.itsm.local| FE_C

    US_A & AS_A & IS_A -->|search_path=tenant_a| PG
    US_B & AS_B & IS_B -->|search_path=tenant_b| PG
    US_C & AS_C & IS_C -->|search_path=tenant_c| PG

    AS_A & IS_A --> REDIS
    IS_A -->|publish events| MQ

    US_A & AS_A & IS_A -->|OTLP gRPC| OTC
    OTC --> PROM & LOKI & JAEGER
    PROM & LOKI & JAEGER --> GRAFANA
```

---

## Request Flow Walk-Through

A typical authenticated API call (e.g., listing incidents for tenant-a) travels through these layers:

```
1. Browser → HTTPS request to tenant-a.itsm.local
             Authorization: Bearer <JWT>

2. Istio IngressGateway
   └─ RequestAuthentication: validates RS256 JWT signature against
      JWKS endpoint on user-service (/api/v1/.well-known/jwks.json)
   └─ AuthorizationPolicy (DENY): rejects request if JWT is invalid
      or tenant_id claim does not match tenant-a namespace
   └─ ext_authz (CUSTOM): calls OPA at gRPC :9191 with
      { role, method, path } → OPA allows/denies based on Rego policy

3. Istio injects headers into the upstream request:
   X-Tenant-ID: tenant_a          (from JWT claim tenant_id)
   X-User-Role: agent             (from JWT claim role)

4. incident-service receives the request
   └─ Reads X-Tenant-ID and X-User-Role headers
   └─ Sets PostgreSQL search_path = tenant_a for this connection
   └─ Executes query (data stays within tenant_a schema)
   └─ Checks Redis cache: itsm:tenant_a:incidents:list:<hash>
   └─ Emits OTel span: itsm.incident.list
      with attributes: tenant.id=tenant_a, user.role=agent

5. Response returns through Istio sidecar (mTLS within cluster)
```

---

## Component Responsibility Matrix

| Component | Namespace | Port | Language | Role |
|---|---|---|---|---|
| **Istio IngressGateway** | istio-system | 80/443 | — | TLS termination, JWT validation, subdomain routing, rate limiting |
| **Istiod** | istio-system | 15010/15012 | — | Control plane; xDS config push to all sidecars |
| **OPA** | opa | 9191 (gRPC) | — | RBAC Rego policy; ext_authz for Istio |
| **frontend** | tenant-{x} | 80 | TypeScript (nginx) | Synap UI; SPA served by nginx:alpine |
| **user-service** | tenant-{x} | 8080 | Go / Chi v5 | AuthN: login, token issue, JWKS; user CRUD |
| **asset-service** | tenant-{x} | 8000 | Python / FastAPI | Asset CRUD, Redis cache |
| **incident-service** | tenant-{x} | 8000 | Python / FastAPI | Incident lifecycle, RabbitMQ events |
| **notification-service** | tenant-{x} | 8080 | Go / Chi v5 | RabbitMQ consumer; notifications (Phase 8) |
| **ai-service** | tenant-{x} | 8000 | Python / FastAPI | AIOps triage, semantic search (Phase 7) |
| **OTel Collector** | observability | 4317 (gRPC) | — | Receives OTLP from all services; fans out |
| **Prometheus** | observability | 9090 | — | Metrics scraping + storage |
| **Loki** | observability | 3100 | — | Log aggregation |
| **Jaeger** | observability | 16686 | — | Distributed tracing UI |
| **Grafana** | observability | 3000 | — | Unified dashboard |
| **ArgoCD** | argocd | 8080 | — | GitOps: syncs Helm releases from git (Phase 9) |
| **PostgreSQL 16** | external | 5432 | — | Schema-per-tenant; runs outside K8s |
| **Redis 7.x** | in-cluster | 6379 | — | Shared cache; prefix-per-tenant key isolation |
| **RabbitMQ 3.13** | in-cluster | 5672 | — | Async event bus; W3C traceparent in AMQP headers |

---

## Infrastructure Constraints

| Resource | Value |
|---|---|
| Cluster nodes | 3 (1 control-plane + 2 workers) |
| Total RAM | 16 GB |
| Usable workload RAM | ~10–11 GB |
| HPA per service | min=1, max=2 replicas |
| HPA CPU threshold | 70% |

---

## Environment Model

All resources accept `ENV=dev` (default) or `ENV=qa`. Switching environments changes only this one variable — no YAML edits required.

| ENV | Namespaces | External DB |
|---|---|---|
| dev | tenant-a, tenant-b, tenant-c | 172.16.13.168:5432/itsm |
| qa | tenant-a-qa, tenant-b-qa, tenant-c-qa | 172.16.13.168:5432/itsm_qa |

---

## Phase Delivery Map

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Repo scaffold, go.mod, pyproject.toml | ✅ Complete |
| 2 | PostgreSQL schema + migrations (schema-per-tenant) | ✅ Complete |
| 3 | User Service — login, JWT issue, JWKS endpoint | ✅ Complete |
| 4 | Asset Service + Incident Service | ✅ Complete |
| 5 | Helm charts + Dockerfiles + K8s manifests (itsm-dev) | ✅ Complete |
| 6 | Istio + OPA; per-namespace tenant model; RS256 JWT | 🔲 In Progress |
| 7 | AI Service — triage, semantic search, pgvector | 🔲 Pending |
| 8 | Full OTel observability — metrics, logs, traces | 🔲 Pending |
| 9 | CI/CD + ArgoCD GitOps | 🔲 Pending |

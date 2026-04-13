Design multi-tenant demo ITSM app for observability & AI use cases demo
Objective
Build a fully containerised, multi-tenant demo application covering Asset Management, User Management, and Incident Management modules. The app serves as a reference implementation and live demo environment to showcase the platform's observability stack and AI capabilities — validating real product use cases in a controlled, repeatable environment. Runs on Kubernetes using Helm for deployment and ArgoCD for GitOps-based change management.

Create containerised demo app with reference to OpenTelemetry demo app

## What to Do

Build a multi-service containerised demo application modelled on the OpenTelemetry demo app architecture. The app covers the ITSM domain (Asset, User, Incident modules) and uses a polyglot service design — Python and Go for backend services — with a message queue, Redis cache, and a database running on a separate node from the frontend and backend services. This forms the foundational runtime that all observability and K8s tasks build on.

**Reference:** [OpenTelemetry Demo App](https://github.com/open-telemetry/opentelemetry-demo) — use as architectural reference for service topology, language distribution, and OTel instrumentation patterns.

## Architecture Notes

- **Languages:** Python (e.g. asset/incident services), Go (e.g. user/API gateway service)
- **Queue:** RabbitMQ — decouple incident event processing
- **Cache:** Redis — session state, asset lookup caching
- **Database:** PostgreSQL — deployed on a separate node/VM, not co-located with frontend/backend
- **Frontend:** Lightweight React or Next.js (or reuse OTel demo frontend pattern)
- **Containerisation:** Each service in its own Docker image; deployed through helm charts using docker hub on local K8s 3 node system

Now for complete observablity for this ITSM app we need to have complete opensource observablity stack on same k8s cluster using belwo things 
Create complete OTel-based observability stack — metrics, traces, logs
What to Do
Stand up a full three-signal observability stack for the demo app using open source tooling. The OTel Collector acts as the central telemetry pipeline — receiving signals from all instrumented services and routing to the appropriate backends. All three signal backends (Prometheus, Loki, Jaeger) are integrated and visualised via Grafana.

Stack Architecture
App Services (OTel SDK instrumented)
        │
        ▼
  OTel Collector  ─── metrics ──▶  Prometheus
        │           ─── logs ────▶  Loki
        │           ─── traces ──▶  Jaeger
        │
        ▼
     Grafana  (unified dashboards for all 3 signals)
Components:

OTel Collector — central pipeline; receives OTLP from all services, exports to backends
Prometheus — metrics scraping and storage; configure service discovery for all pods
Loki — log aggregation; Promtail or OTel log exporter as shipper
Jaeger — distributed trace storage and UI; all-in-one mode for local, production mode for K8s
Grafana — unified dashboards; datasources: Prometheus, Loki, Jaeger (trace correlations)




Application deployed based on Helm chart and GitOps principles with ArgoCD
What to Do
Package all demo app services as Helm charts and implement a GitOps delivery pipeline using ArgoCD. Each tenant gets its own namespace with tenant-scoped Helm values. ArgoCD watches the Git repo — any push to the chart or values files triggers an automatic sync and deployment to the cluster. This demonstrates the full GitOps loop end-to-end.

Architecture
Git Repo (Helm charts + values)
        │
        ▼
    ArgoCD  ──── watches ──── Git branch/path
        │
        ▼
  K8s Cluster
    ├── namespace: tenant-a  ← values-tenant-a.yaml
    ├── namespace: tenant-b  ← values-tenant-b.yaml
    └── namespace: tenant-c  ← values-tenant-c.yaml
Chart structure:

charts/
  demo-app/
    Chart.yaml
    values.yaml              ← base values
    values-tenant-a.yaml     ← tenant override
    values-tenant-b.yaml
    templates/
      deployment.yaml
      service.yaml
      ingress.yaml
      configmap.yaml
ArgoCD App manifest per tenant:

apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-app-tenant-a
spec:
  source:
    repoURL: https://github.com/org/demo-app
    targetRevision: main
    path: charts/demo-app
    helm:
      valueFiles:
        - values-tenant-a.yaml
  destination:
    namespace: tenant-a



Demo app completely cloud-native and K8s compatible — HPA, Istio, PV/PVC

## What to Do

Ensure the demo app is a complete reference implementation of cloud-native K8s patterns. This means going beyond basic pod deployments — the app should demonstrate HPA for horizontal scaling, Istio for service mesh with mTLS, and PV/PVC for stateful workloads (database, cache). Together these cover the core K8s concepts needed to show the platform's infrastructure maturity.

## K8s Concepts to Implement

**HPA (Horizontal Pod Autoscaler)**
- Configure HPA for all stateless services (API, frontend, business logic services)
- Trigger metric: CPU utilisation (70%) or custom OTel-derived metric via KEDA
- Min replicas: 1, Max replicas: 5 per service (tunable)

**Istio Service Mesh**
- Deploy Istio on the demo cluster
- Enable mTLS between all services (PeerAuthentication: STRICT mode)
- Configure VirtualService and DestinationRule for traffic routing
- Use Istio ingress gateway as entry point

**PV / PVC**
- PostgreSQL database: PVC backed by local storage class (or hostPath for local dev)
- Redis cache: PVC for persistence (optional but demonstrates the pattern)
- Define StorageClass, PersistentVolume, PersistentVolumeClaim YAML for each

**Resource Governance**
- Define `resources.requests` and `resources.limits` for every container
- Namespace-level ResourceQuota and LimitRange applied per tenant


Complete documentation folder with OpenTelemetry and demo app technical KB
What to Do
Build a comprehensive /docs folder in the demo app repo covering all technical and deployment knowledge — serving as both an onboarding guide and a reference for anyone running or extending the demo. Special emphasis on OpenTelemetry concepts (not just how to configure it, but how the internals work) and the GitOps/deployment runbook.

Documentation Structure
/docs
  ├── 00_Overview.md               ← Architecture diagram + service map
  ├── 01_OpenTelemetry/
  │   ├── 01_Concepts.md           ← Traces, metrics, logs, context propagation, sampling
  │   ├── 02_OTel_Collector.md     ← Collector architecture, pipelines, receivers/processors/exporters
  │   ├── 03_Instrumentation.md    ← Auto vs manual instrumentation, SDK setup for Python + Go
  │   └── 04_Signal_Backends.md    ← Prometheus, Loki, Jaeger — config and query guides
  ├── 02_App_Architecture/
  │   ├── 01_Service_Design.md     ← Service responsibilities, language choices, communication patterns
  │   ├── 02_Data_Flow.md          ← Request flow through Asset/User/Incident services
  │   └── 03_Multi_Tenancy.md      ← Tenant isolation model, namespace strategy
  ├── 03_Deployment/
  │   ├── 01_Local_Dev.md          ← Docker Compose setup, env vars, running locally
  │   ├── 02_K8s_Deployment.md     ← Helm install guide, cluster prerequisites
  │   └── 03_GitOps_Runbook.md     ← ArgoCD setup, how to deploy a new tenant, rollback procedure
  └── 04_K8s_Concepts/
      ├── 01_HPA.md                ← HPA config for this app, scaling triggers
      ├── 02_Istio.md              ← mTLS setup, traffic routing, debugging
      └── 03_Storage.md            ← PV/PVC setup for Postgres and Redis


           
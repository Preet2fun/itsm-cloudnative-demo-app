# Synap Documentation Index

## Product

| Doc | Description |
|---|---|
| [Vision & Personas](product/01_Vision_and_Personas.md) | Product vision, tagline, personas, success metrics |
| [Feature Map](product/02_Feature_Map.md) | Every feature mapped to sprint, phase, and build status |
| [Hero Flows](product/03_Hero_Flows.md) | The 3 end-to-end flows that define product value |

## Architecture

| Doc | Description |
|---|---|
| [System Overview](architecture/01_System_Overview.md) | Full system diagram, request flow, component matrix |
| [Service Design](architecture/02_Service_Design.md) | Service inventory, API endpoints, ports, resource limits |
| [Multi-Tenancy](architecture/03_Multi_Tenancy.md) | 7-layer isolation model, namespace-per-tenant, PostgreSQL schema isolation |
| [Security Model](architecture/04_Security_Model.md) | Auth flows (login, OTP, token), Istio/OPA chain, RS256 JWT, threat model |
| [Data Model](architecture/05_Data_Model.md) | PostgreSQL ER diagram, table definitions, migration strategy |

## Legacy Architecture Docs (being superseded by `architecture/`)

| Doc | Status |
|---|---|
| [00_Overview.md](00_Overview.md) | High-level orientation; links to new docs |
| [02_App_Architecture/01_Service_Design.md](02_App_Architecture/01_Service_Design.md) | Superseded by `architecture/02_Service_Design.md` |
| [02_App_Architecture/03_Multi_Tenancy.md](02_App_Architecture/03_Multi_Tenancy.md) | Superseded by `architecture/03_Multi_Tenancy.md` |

## Phase Deployment Guides

| Doc | Status |
|---|---|
| [Phase 01 — Repo Scaffold](06_Phase_Deployment_Guides/Phase_01_Repo_Scaffold.md) | ✅ Complete |
| [Phase 02 — Database](06_Phase_Deployment_Guides/Phase_02_Database.md) | ✅ Complete |
| [Phase 03 — User Service](06_Phase_Deployment_Guides/Phase_03_User_Service.md) | ✅ Complete |
| [Phase 04 — Asset & Incident Services](06_Phase_Deployment_Guides/Phase_04_Asset_Incident_Services.md) | ✅ Complete |
| [Phase 05 — Helm + K8s](06_Phase_Deployment_Guides/Phase_05_Frontend_NextJS.md) | ✅ Complete |
| [Phase 06 — Istio + OPA](06_Phase_Deployment_Guides/Phase_06_Istio_OPA.md) | 🔲 In Progress |

## Learning & Reference

| Doc | Description |
|---|---|
| [OpenTelemetry Concepts](01_OpenTelemetry/01_Concepts.md) | OTel signals, SDK setup, collector config |
| [K8s Concepts — HPA](04_K8s_Concepts/01_HPA.md) | Horizontal Pod Autoscaler patterns |
| [K8s Concepts — Istio](04_K8s_Concepts/02_Istio.md) | Service mesh, mTLS, VirtualService |
| [K8s Concepts — OPA](04_K8s_Concepts/04_OPA.md) | Rego policy, ext_authz integration |
| [AI Features](05_AI_Features/01_Incident_Triage.md) | AI triage, semantic search, anomaly detection |

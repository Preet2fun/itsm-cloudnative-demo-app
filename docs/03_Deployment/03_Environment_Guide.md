# Environment Guide: dev / qa

## Overview

The entire deployment stack — Kubernetes namespaces, Helm values, Istio VirtualServices, ArgoCD Applications, and scripts — is controlled by a single variable:

```bash
ENV=dev   # default — active environment
ENV=qa    # future environment — structure ready from day one
```

No manual YAML edits are required to switch environments.

---

## What `ENV` Controls

| Component | dev | qa |
|---|---|---|
| K8s namespaces | `tenant-a`, `tenant-b`, `tenant-c` | `qa-tenant-a`, `qa-tenant-b`, `qa-tenant-c` |
| Istio hosts | `*.itsm.local` | `*.qa.itsm.local` |
| Istio VirtualServices | `infra/k8s/istio/virtual-services/dev/` | `infra/k8s/istio/virtual-services/qa/` |
| Istio RequestAuthentication | `infra/k8s/istio/request-authentication/dev/` | `infra/k8s/istio/request-authentication/qa/` |
| Istio AuthorizationPolicies | `infra/k8s/istio/authorization-policies/dev/` | `infra/k8s/istio/authorization-policies/qa/` |
| OPA CUSTOM policies | `infra/k8s/opa/authz-policy-custom/dev/` | `infra/k8s/opa/authz-policy-custom/qa/` |
| ResourceQuota | `infra/k8s/resource-quota/dev/` | `infra/k8s/resource-quota/qa/` |
| Helm values base | `values.yaml` + `values-dev.yaml` | `values.yaml` + `values-qa.yaml` |
| ArgoCD Applications | `infra/argocd/apps/dev/` | `infra/argocd/apps/qa/` |
| PostgreSQL DB schemas | `tenant_a`, `tenant_b`, `tenant_c` | `qa_tenant_a`, `qa_tenant_b`, `qa_tenant_c` |

---

## Helm Values Layering

ArgoCD applies values in this order for each tenant — later files override earlier ones:

```
dev deployment:
  1. values.yaml           (base defaults — env-agnostic)
  2. values-dev.yaml       (dev env overrides)
  3. values-tenant-a.yaml  (tenant-a specific config)

qa deployment:
  1. values.yaml           (same base)
  2. values-qa.yaml        (qa env overrides)
  3. values-tenant-a.yaml  (same tenant config — env-agnostic)
```

**Example: `values-dev.yaml` vs `values-qa.yaml`**

```yaml
# values-dev.yaml
image:
  tag: latest                   # dev uses latest for fast iteration

hpa:
  maxReplicas: 2                # constrained for 16GB cluster

ingress:
  hosts:
    - "*.itsm.local"

resources:
  userService:
    requests: { cpu: 100m, memory: 128Mi }
    limits:   { cpu: 300m, memory: 256Mi }
```

```yaml
# values-qa.yaml
image:
  tag: ""                       # must be set explicitly for QA (no latest)

hpa:
  maxReplicas: 2

ingress:
  hosts:
    - "*.qa.itsm.local"

namespacePrefix: "qa-"          # all namespaces prefixed with qa-

resources:
  userService:
    requests: { cpu: 150m, memory: 192Mi }
    limits:   { cpu: 400m, memory: 384Mi }
```

---

## Scripts

All scripts accept `ENV` as an environment variable:

```bash
# Full cluster bootstrap for dev
ENV=dev bash scripts/setup-cluster.sh

# Full cluster bootstrap for qa
ENV=qa bash scripts/setup-cluster.sh

# Create tenants (DB schemas + seed data)
# DATABASE_URL must be set — PostgreSQL is external, not in K8s
DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable \
  ENV=dev SEED=true bash scripts/create-tenants.sh

DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable \
  ENV=qa SEED=true bash scripts/create-tenants.sh

# Apply all Istio config for an environment
ENV=dev bash scripts/apply-istio-config.sh
ENV=qa bash scripts/apply-istio-config.sh

# Teardown an environment
ENV=dev bash scripts/cleanup.sh
ENV=qa bash scripts/cleanup.sh
```

**Default:** If `ENV` is not set, all scripts default to `dev`.

**Script internals example (`create-tenants.sh`):**
```bash
# Always set DATABASE_URL before running
DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable \
  ENV=dev SEED=true bash scripts/create-tenants.sh

# DATABASE_URL is parsed by the script — no separate DB_HOST/PORT needed
# TENANTS defaults to "tenant_a tenant_b tenant_c"; override to add new tenants:
DATABASE_URL=... ENV=dev TENANTS="tenant_d" bash scripts/create-tenants.sh
```

---

## ArgoCD Application Structure

```yaml
# infra/argocd/apps/dev/app-tenant-a.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: itsm-tenant-a-dev
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/<user>/itsm-cloudnative-demo-app
    targetRevision: main
    path: infra/helm/itsm-app
    helm:
      valueFiles:
        - values.yaml
        - values-dev.yaml
        - values-tenant-a.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: tenant-a
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```yaml
# infra/argocd/apps/qa/app-qa-tenant-a.yaml
spec:
  source:
    helm:
      valueFiles:
        - values.yaml
        - values-qa.yaml         # ← only this line changes
        - values-tenant-a.yaml
  destination:
    namespace: qa-tenant-a       # ← and this
```

---

## /etc/hosts Setup per Environment

```bash
# Get the Istio IngressGateway node IP (kubeadm NodePort)
INGRESS_IP=$(kubectl get nodes -o jsonpath='{.items[1].status.addresses[?(@.type=="InternalIP")].address}')

# dev entries
sudo bash -c "echo '$INGRESS_IP  tenant-a.itsm.local tenant-b.itsm.local tenant-c.itsm.local' >> /etc/hosts"

# qa entries (add when qa is needed)
sudo bash -c "echo '$INGRESS_IP  qa-tenant-a.itsm.local qa-tenant-b.itsm.local qa-tenant-c.itsm.local' >> /etc/hosts"
```

---

## Promoting dev to qa

The qa environment is structurally identical to dev with different namespaces, hosts, and values. To promote a validated dev deployment to qa:

1. Update `values-qa.yaml` with the same image tag used in dev (specific `git-sha`, not `latest`)
2. `ENV=qa bash scripts/create-tenants.sh` — creates QA namespaces and DB schemas
3. `ENV=qa bash scripts/apply-istio-config.sh` — applies QA Istio config
4. Apply ArgoCD QA apps: `kubectl apply -f infra/argocd/apps/qa/`
5. ArgoCD syncs QA automatically

No code changes needed — the same Helm chart, the same services, different environment layer.

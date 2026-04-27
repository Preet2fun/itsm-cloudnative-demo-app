# Helm Microservice Deployment Guide
### How a microservice goes from source code to running in Kubernetes

This guide uses the **User Service** as a concrete example throughout.
Every other service in this project follows the exact same pattern.

---

## 1. The Big Picture — What Helm Actually Does

Without Helm, deploying a service to Kubernetes means writing raw YAML files
(`Deployment`, `Service`, `HPA`) and running `kubectl apply` for each one.
That works for one environment, one service. It breaks down when you have
dev + qa environments, multiple services, and values that change between deploys
(image tag, replica count, env-specific endpoints).

**Helm is a templating + packaging system for Kubernetes YAML.**

- You write templates once with variables (`{{ .Values.something }}`)
- You supply different values per environment (dev vs qa)
- One command deploys or upgrades everything

The output of `helm install/upgrade` is exactly what `kubectl apply` would produce —
Helm just generates the YAML for you.

---

## 2. What You Need to Deploy Any Microservice

Three things must exist before any service can run in Kubernetes:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CONTAINER IMAGE  (pushed to Docker Hub / ECR / GHCR)        │
│     Built from: source code + Dockerfile                        │
│                                                                  │
│  2. HELM CHART  (lives in the Git repo under infra/helm/)       │
│     Describes: Deployment, Service, HPA, ConfigMap              │
│                                                                  │
│  3. KUBERNETES SECRETS  (created manually once per cluster)     │
│     Holds: DATABASE_URL, JWT_SECRET — never in Git              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Where Everything Lives — Folder Structure

### Industry question: does the Helm chart live inside the service folder or separately?

There are two common patterns:

**Pattern A — Chart inside service folder** (small teams, single-repo per service)
```
user-service/
├── src/
├── Dockerfile
└── helm/
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
```

**Pattern B — Monorepo with a central `infra/helm` folder** (multiple services, one repo)
```
infra/
└── helm/
    └── itsm-app/           ← one umbrella chart for the whole app
        ├── Chart.yaml
        ├── values.yaml
        ├── values-qa.yaml
        └── templates/
            ├── user-service/
            ├── asset-service/
            └── incident-service/
```

**This project uses Pattern B.** One Helm chart (`itsm-app`) covers all services.
Each service gets its own subfolder under `templates/`. This is the standard
approach when all services are in the same Git repository and deployed together.

---

## 4. What to Commit Where

```
┌──────────────────────────────────────────────────────────────────────────┐
│  GIT REPOSITORY  (this repo)                                             │
├──────────────────────────────────────────────────────────────────────────┤
│  services/user-service/                                                  │
│    ├── Dockerfile          ← how to build the image                      │
│    ├── go.mod / go.sum     ← dependencies pinned                         │
│    ├── cmd/main.go         ← application entry point                     │
│    └── internal/...        ← all application code                        │
│                                                                          │
│  infra/helm/itsm-app/                                                    │
│    ├── Chart.yaml          ← chart metadata                              │
│    ├── values.yaml         ← default (dev) config values                 │
│    ├── values-qa.yaml      ← qa overrides                                │
│    └── templates/          ← Kubernetes resource templates               │
│        └── user-service/                                                 │
│            ├── deployment.yaml                                           │
│            ├── service.yaml                                              │
│            └── hpa.yaml                                                  │
│                                                                          │
│  NEVER commit: .env files, real passwords, DATABASE_URL with real creds  │
├──────────────────────────────────────────────────────────────────────────┤
│  DOCKER HUB  (container registry)                                        │
├──────────────────────────────────────────────────────────────────────────┤
│  pratikpatel/user-service:latest                                    │
│  pratikpatel/user-service:1.0.0                                     │
│  pratikpatel/itsm-asset-service:latest                                   │
│  ...                                                                     │
│                                                                          │
│  This is the compiled, runnable artifact. Built from the Dockerfile.     │
│  Kubernetes pulls this image — it never touches your source code.        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Every File in the Helm Chart — Explained

### `infra/helm/itsm-app/Chart.yaml`

The chart's identity card. Kubernetes and Helm use this to identify the chart.

```yaml
apiVersion: v2
name: itsm-app
description: ITSM Cloud-Native Demo App — all application services
type: application
version: 0.1.0      # chart version — bump when you change the chart
appVersion: "0.1.0" # your app version — shown in `helm list` output
```

- `version` = the Helm chart version (change when you modify templates)
- `appVersion` = the application version (informational, shown in `helm list`)
- These are independent — you can update the chart without releasing a new app version

---

### `infra/helm/itsm-app/values.yaml`

The single source of truth for all configurable values.
This is the **dev** environment default. Think of it as the dial board —
every knob that can change between environments lives here.

```yaml
global:
  env: dev
  namespace: itsm-dev
  imageRegistry: ""            # prefix for all image names, e.g. "docker.io/pratikpatel/"
  imageTag: latest             # overridden at deploy time: --set global.imageTag=abc123
  otelCollectorEndpoint: "otel-collector.itsm-dev:4317"

userService:
  enabled: true                # set to false to skip deploying this service
  name: user-service
  image:
    repository: itsm/user-service   # combined with imageRegistry at deploy time
    pullPolicy: IfNotPresent
  port: 8080
  replicas: 1

  secretName: itsm-secrets    # name of the K8s Secret that holds DB URL + JWT secret

  env:                         # non-secret env vars only
    JWT_EXPIRY_HOURS: "24"
    OTEL_SERVICE_NAME: "user-service"

  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 300m
      memory: 256Mi

  hpa:
    minReplicas: 1
    maxReplicas: 2             # never > 2 on this cluster (hardware constraint)
    targetCPUUtilizationPercentage: 70

  readinessProbe:
    path: /api/v1/health
    initialDelaySeconds: 5
    periodSeconds: 10

  livenessProbe:
    path: /api/v1/health
    initialDelaySeconds: 15
    periodSeconds: 20
```

**Rule:** Secrets (passwords, tokens, DSNs) are NEVER stored here.
They live in a Kubernetes Secret created manually before the first deploy.

---

### `infra/helm/itsm-app/values-qa.yaml`

Only the values that differ in QA. Helm merges this on top of `values.yaml`.

```yaml
global:
  env: qa
  namespace: itsm-qa
  otelCollectorEndpoint: "otel-collector.itsm-qa:4317"

userService:
  env:
    JWT_EXPIRY_HOURS: "8"     # shorter sessions in QA
    OTEL_SERVICE_NAME: "user-service"
```

Everything not listed here inherits from `values.yaml`.
This keeps QA overrides minimal and obvious.

---

### `infra/helm/itsm-app/templates/user-service/deployment.yaml`

Tells Kubernetes how to run the container: how many replicas, which image,
what env vars to inject, resource limits, health checks, security settings.

Key sections explained:

```yaml
{{- if .Values.userService.enabled }}   # skip entirely if disabled in values
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.userService.name }}          # user-service
  namespace: {{ .Values.global.namespace }}     # itsm-dev or itsm-qa
  labels:
    app: {{ .Values.userService.name }}
    version: v1                                 # used by Istio traffic rules in Phase 6
    environment: {{ .Values.global.env }}

spec:
  replicas: {{ .Values.userService.replicas }}  # 1 base; HPA overrides this at runtime
  selector:
    matchLabels:
      app: {{ .Values.userService.name }}       # must match template labels below

  template:
    metadata:
      labels:
        app: {{ .Values.userService.name }}
        version: v1
      annotations:
        sidecar.istio.io/inject: "true"         # tells Istio to add its proxy sidecar

    spec:
      containers:
        - name: user-service
          # imageRegistry + repository + tag assembled at deploy time
          # e.g.  docker.io/pratikpatel/user-service:abc123
          image: "{{ .Values.global.imageRegistry }}{{ .Values.userService.image.repository }}:{{ .Values.global.imageTag }}"

          env:
            # Secrets pulled from the K8s Secret object (never hardcoded)
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.userService.secretName }}  # itsm-secrets
                  key: database-url

            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.userService.secretName }}
                  key: jwt-secret

            # Non-secret values come from values.yaml
            - name: ENV
              value: {{ .Values.global.env | quote }}

          readinessProbe:     # K8s won't send traffic until this passes
            httpGet:
              path: /api/v1/health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10

          livenessProbe:      # K8s restarts the pod if this fails repeatedly
            httpGet:
              path: /api/v1/health
              port: http
            initialDelaySeconds: 15
            periodSeconds: 20

          resources:          # CPU/memory guardrails — prevents one pod starving the node
            requests:
              cpu: 100m       # guaranteed minimum
              memory: 128Mi
            limits:
              cpu: 300m       # hard cap
              memory: 256Mi

          securityContext:    # security hardening
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            capabilities:
              drop:
                - ALL
{{- end }}
```

---

### `infra/helm/itsm-app/templates/user-service/service.yaml`

Creates a stable internal DNS name for the pod.
Other services and Istio use this name to route traffic.

```yaml
{{- if .Values.userService.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.userService.name }}         # user-service
  namespace: {{ .Values.global.namespace }}
spec:
  type: ClusterIP          # internal only — Istio IngressGateway is the external entry point
  selector:
    app: {{ .Values.userService.name }}        # routes to pods with this label
  ports:
    - name: http
      port: 80             # what callers use: http://user-service/...
      targetPort: http     # maps to the container's port 8080
{{- end }}
```

After deploy, any pod in `itsm-dev` can reach the user service at:
`http://user-service/api/v1/...`

---

### `infra/helm/itsm-app/templates/user-service/hpa.yaml`

Horizontal Pod Autoscaler — automatically adds/removes replicas based on CPU usage.

```yaml
{{- if .Values.userService.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.userService.name }}-hpa
  namespace: {{ .Values.global.namespace }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.userService.name }}
  minReplicas: 1     # always at least 1 pod running
  maxReplicas: 2     # never more than 2 (cluster hardware limit)
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70   # scale up when avg CPU > 70%
{{- end }}
```

---

## 6. The Dockerfile — What It Does

```dockerfile
# Stage 1: Build — uses the full Go toolchain (large image, ~800 MB)
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download          # cache dependencies as a separate layer
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/user-service ./cmd

# Stage 2: Run — uses a tiny distroless image (~5 MB)
FROM gcr.io/distroless/static:nonroot
COPY --from=builder /bin/user-service /user-service
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/user-service"]
```

**Two-stage build** is industry standard:
- Stage 1 compiles the code — this image is never pushed or run in production
- Stage 2 is the final image — only the compiled binary, no compiler, no shell
- Result: tiny, secure image with minimal attack surface

---

## 7. End-to-End Flow — From Code to Running Pod

```
Developer pushes code to Git
         │
         ▼
  CI pipeline runs
  ┌─────────────────────────────────────────────────┐
  │  1. git checkout                                 │
  │  2. docker build -t pratikpatel/user-service:$GIT_SHA .  │
  │  3. docker push pratikpatel/user-service:$GIT_SHA        │
  └─────────────────────────────────────────────────┘
         │
         ▼
  Helm deploy (CI or manual)
  ┌─────────────────────────────────────────────────┐
  │  helm upgrade --install itsm-app \              │
  │    ./infra/helm/itsm-app \                      │
  │    --set global.imageTag=$GIT_SHA \             │
  │    -n itsm-dev                                  │
  └─────────────────────────────────────────────────┘
         │
         ▼
  Kubernetes receives the rendered YAML
  ┌─────────────────────────────────────────────────┐
  │  Deployment → kubelet pulls image from Docker Hub│
  │  Service    → assigns stable DNS name           │
  │  HPA        → watches CPU, scales if needed     │
  └─────────────────────────────────────────────────┘
         │
         ▼
  Pod is Running
  - DATABASE_URL injected from itsm-secrets
  - JWT_SECRET injected from itsm-secrets
  - Istio sidecar attached (Phase 6)
  - OTel auto-instrumentation active (Phase 8)
```

---

## 8. Deploy Commands Reference

### One-time setup per cluster (before first deploy):

```bash
# 1. Create namespace
kubectl apply -f infra/k8s/namespaces/dev/namespace-itsm-dev.yaml

# 2. Create the secret (replace IP with your postgres machine IP)
kubectl create secret generic itsm-secrets \
  --from-literal=database-url="postgres://itsm:itsm@172.16.13.203:5432/itsm?sslmode=disable" \
  --from-literal=jwt-secret="$(openssl rand -base64 48)" \
  -n itsm-dev
```

### First deploy:

```bash
helm install itsm-app ./infra/helm/itsm-app \
  --set global.imageRegistry="pratikpatel/" \
  --set global.imageTag="latest" \
  -n itsm-dev
```

### Every subsequent deploy (after a new image is pushed):

```bash
helm upgrade itsm-app ./infra/helm/itsm-app \
  --set global.imageRegistry="pratikpatel/" \
  --set global.imageTag="<new-image-tag>" \
  -n itsm-dev
```

### Deploy to QA (layers qa values on top of dev defaults):

```bash
helm upgrade --install itsm-app ./infra/helm/itsm-app \
  -f infra/helm/itsm-app/values.yaml \
  -f infra/helm/itsm-app/values-qa.yaml \
  --set global.imageRegistry="pratikpatel/" \
  --set global.imageTag="<tag>" \
  -n itsm-qa
```

### Verify the deploy:

```bash
helm list -n itsm-dev
kubectl get pods -n itsm-dev
kubectl get hpa -n itsm-dev
kubectl logs -l app=user-service -n itsm-dev
```

### Roll back if something breaks:

```bash
helm rollback itsm-app 1 -n itsm-dev   # 1 = previous revision number
```

---

## 9. Adding a New Service — Checklist

When Phase 4 adds the Asset Service and Incident Service, repeat this pattern:

```
services/asset-service/
├── Dockerfile                          ← new file
├── requirements.txt / pyproject.toml   ← new file
└── app/...                             ← new files

infra/helm/itsm-app/templates/
└── asset-service/                      ← new folder
    ├── deployment.yaml                 ← copy user-service, adjust values key
    ├── service.yaml                    ← copy user-service, adjust values key
    └── hpa.yaml                        ← copy user-service, adjust values key

infra/helm/itsm-app/values.yaml         ← add assetService: block
infra/helm/itsm-app/values-qa.yaml      ← add qa overrides if any

Docker Hub:
  pratikpatel/itsm-asset-service:latest  ← new image to build and push
```

---

## 10. What Never Goes in Git

| Item | Why |
|---|---|
| Real `DATABASE_URL` with password | Secrets belong in K8s Secrets, not source control |
| `JWT_SECRET` value | Same reason |
| `.env` files with real values | Use `.env.example` with placeholder values |
| Docker Hub password | Use CI secrets or `docker login` interactively |
| Built binary / image layers | These are build artifacts, not source |

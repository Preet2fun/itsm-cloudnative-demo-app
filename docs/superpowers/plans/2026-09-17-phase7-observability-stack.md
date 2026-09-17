# Phase 7 — Observability Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> (subagent-driven-development is not used in this repo — see root
> `.claude/CLAUDE.md` §13: never commit/push; that skill's review loop
> depends on commits as checkpoints). Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Deploy OTel Collector + Prometheus + Loki + Jaeger + Grafana into
`itsm-dev`, add the missing manual OTel spans to delivery-service and
payment-service, and verify telemetry from both apps flows end-to-end,
tagged by tenant.

**Architecture:** See the spec for the full rationale. Summary: official
upstream Helm charts for everything except Jaeger (hand-rolled all-in-one —
the official Jaeger chart targets Cassandra/ES backends, wildly oversized for
a single in-memory demo instance); ephemeral storage everywhere; zero config
changes to either app (both already target `otel-collector.itsm-dev:4317`).

**Tech Stack:** Helm 3.15+, the same `itsm-dev` namespace both apps already
share, Istio (already installed).

**Spec:**
`docs/superpowers/specs/2026-09-17-phase7-observability-stack-design.md`

## Global Constraints

- Namespace: **`itsm-dev`** for every new resource in this plan. Zero
  changes to either app's `otelCollectorEndpoint` values.
- Storage: **ephemeral only** — no PVCs, no PersistentVolumeClaims anywhere
  in this plan.
- Resource requests/limits: exactly root `CLAUDE.md` §4's table (repeated in
  each task below) — do not deviate without re-checking capacity.
- **`itsm-dev` enforces STRICT mTLS namespace-wide**
  (`itsm-mtls-strict` PeerAuthentication) and has `istio-injection=enabled`
  on the namespace already. Every new pod in this plan gets a sidecar
  automatically (default injection) — **never add a
  `sidecar.istio.io/inject: "false"` annotation to anything in this plan.**
  This project has already hit two separate STRICT-mTLS-related outages
  from missing/misconfigured mesh participation (the istiod-JWKS-fetch bug,
  the ext_authz-ordering bug) — a Promtail or OTel Collector pod without a
  sidecar would silently fail to reach its meshed peers the same way. If any
  pod in this plan comes up without its sidecar (`1/1` instead of `2/2`,
  `kubectl get pods -n itsm-dev`), stop and investigate before proceeding —
  don't work around it by disabling injection.
- Helm repos needed (add once, reused across tasks):
  ```bash
  helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm repo add grafana https://grafana.github.io/helm-charts
  helm repo update
  ```
- Chart versions are pinned explicitly in every `helm install`/`upgrade`
  below (confirmed current as of 2026-09-17 via Artifact Hub) — don't float
  on `latest`.
- **This plan writes local files only.** Actually applying anything to the
  cluster happens via bash blocks the repo owner runs on `kubernetes-master`
  (`/home/motadata/itsm-cloudnative-demo-app`) and pastes output back —
  established working pattern for this project, since neither `kubectl` nor
  `helm` are reachable from the authoring environment.
- A values key that doesn't match what the live chart actually accepts is
  expected friction, not a plan failure: every deploy step below says to run
  `helm install ... --dry-run --debug` first and adjust against
  `helm show values <repo>/<chart>` if anything is rejected, then re-run for
  real.

---

## Task 1: OTel Collector

**Files:**
- Create: `platform-app/infra/observability/otel-collector/values.yaml`
- Modify: `platform-app/scripts/install-observability-stack.sh` (new file —
  first task to touch it creates it; every later task appends its own
  section)

**Interfaces:**
- Produces: a Service named exactly `otel-collector` in `itsm-dev` on port
  4317 (OTLP gRPC) and 4318 (OTLP HTTP) — this is the DNS name both apps'
  `OTEL_EXPORTER_OTLP_ENDPOINT` already targets. Also produces a Prometheus
  exporter on port 8888, annotated for Prometheus's default annotation-based
  pod auto-discovery.
- Consumes: nothing yet (Task 2 makes Jaeger, which this task's `exporters.otlp`
  targets by DNS name in advance — Jaeger's Service name is fixed in this
  plan, so this task doesn't need to wait for Task 2 to write its config).

- [x] **Step 1: Write the values file**

```yaml
# platform-app/infra/observability/otel-collector/values.yaml
mode: deployment
replicaCount: 1
fullnameOverride: "otel-collector"

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 300m
    memory: 256Mi

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8888"
  prometheus.io/path: "/metrics"

config:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: ${env:MY_POD_IP}:4317
        http:
          endpoint: ${env:MY_POD_IP}:4318
  processors:
    batch: {}
  exporters:
    otlp:
      endpoint: jaeger.itsm-dev.svc.cluster.local:4317
      tls:
        insecure: true
    prometheus:
      endpoint: 0.0.0.0:8888
  service:
    pipelines:
      traces:
        receivers: [otlp]
        processors: [batch]
        exporters: [otlp]
      metrics:
        receivers: [otlp]
        processors: [batch]
        exporters: [prometheus]

ports:
  otlp:
    enabled: true
  otlp-http:
    enabled: true
  metrics:
    enabled: true
    containerPort: 8888
    servicePort: 8888
  jaeger-compact:
    enabled: false
  jaeger-thrift:
    enabled: false
  jaeger-grpc:
    enabled: false
  zipkin:
    enabled: false

service:
  type: ClusterIP
```

- [x] **Step 2: Create the install script and add this component's section**

```bash
# platform-app/scripts/install-observability-stack.sh
#!/usr/bin/env bash
# Deploys the observability stack (OTel Collector, Jaeger, Prometheus, Loki,
# Promtail, Grafana) into itsm-dev, plus the Istio VirtualServices that
# expose their UIs. Idempotent — safe to re-run.
#
# Usage: ENV=dev bash scripts/install-observability-stack.sh
# (ENV=qa is not wired up yet — this stack is dev-only until itsm-qa is live)

set -euo pipefail
ENV="${ENV:-dev}"
NAMESPACE="itsm-${ENV}"
OBS_DIR="infra/observability"

if [[ "${ENV}" != "dev" ]]; then
  echo "ERROR: only ENV=dev is wired up today." >&2
  exit 1
fi

helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts >/dev/null
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts >/dev/null
helm repo add grafana https://grafana.github.io/helm-charts >/dev/null
helm repo update >/dev/null

echo "==> [1/7] OTel Collector"
helm upgrade --install otel-collector open-telemetry/opentelemetry-collector \
  --version 0.173.1 \
  --namespace "${NAMESPACE}" \
  -f "${OBS_DIR}/otel-collector/values.yaml"
```

- [ ] **Step 3: Hand this to the repo owner to run on kubernetes-master, first as a dry run**

```bash
cd /home/motadata/itsm-cloudnative-demo-app/platform-app
helm upgrade --install otel-collector open-telemetry/opentelemetry-collector \
  --version 0.173.1 --namespace itsm-dev \
  -f infra/observability/otel-collector/values.yaml --dry-run --debug \
  | head -80
```
Expected: rendered manifests, no error. If a key is rejected, run
`helm show values open-telemetry/opentelemetry-collector --version 0.173.1`
and fix the values file to match, then retry.

- [ ] **Step 4: Apply for real and verify**

```bash
bash scripts/install-observability-stack.sh
kubectl get pods -n itsm-dev -l app.kubernetes.io/name=opentelemetry-collector -w
```
Expected: pod reaches `2/2 Running` (2, not 1 — confirms the sidecar
attached, per the Global Constraints note).

```bash
kubectl get svc -n itsm-dev otel-collector
```
Expected: a Service named exactly `otel-collector` with ports `4317`,
`4318`, `8888`.

- [ ] **Step 5: Confirm existing services can now actually resolve/reach it**

```bash
kubectl exec -n customer-app-dev deploy/order-service -- \
  wget -qO- --timeout=3 http://otel-collector.itsm-dev:4318 || echo "(a non-200 here is fine - it proves the connection succeeded; a timeout or connection-refused is the failure to worry about)"
```
Expected: some HTTP response (even an error page) — not a timeout, not
connection-refused. A timeout means the STRICT-mTLS sidecar issue from the
Global Constraints note; investigate before continuing.

---

## Task 2: Jaeger (hand-rolled, all-in-one, in-memory)

**Files:**
- Create: `platform-app/infra/observability/jaeger/jaeger.yaml`
- Delete: `platform-app/infra/observability/jaeger/.gitkeep` (redundant once
  real content exists in the directory)
- Modify: `platform-app/scripts/install-observability-stack.sh`

**Interfaces:**
- Consumes: nothing.
- Produces: a Service named `jaeger` in `itsm-dev` — port 4317 (OTLP grpc,
  what Task 1's collector exports to), port 4318 (OTLP http), port 16686
  (query UI, what Grafana's datasource and the exposing VirtualService in
  Task 7 both target).

- [x] **Step 1: Write the manifest**

```yaml
# platform-app/infra/observability/jaeger/jaeger.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  namespace: itsm-dev
  labels:
    app: jaeger
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
        - name: jaeger
          image: jaegertracing/all-in-one:1.62.0
          env:
            - name: SPAN_STORAGE_TYPE
              value: memory
            - name: COLLECTOR_OTLP_ENABLED
              value: "true"
          ports:
            - name: otlp-grpc
              containerPort: 4317
            - name: otlp-http
              containerPort: 4318
            - name: query-http
              containerPort: 16686
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 300m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /
              port: 16686
            initialDelaySeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: jaeger
  namespace: itsm-dev
  labels:
    app: jaeger
spec:
  selector:
    app: jaeger
  ports:
    - name: otlp-grpc
      port: 4317
      targetPort: 4317
    - name: otlp-http
      port: 4318
      targetPort: 4318
    - name: query-http
      port: 16686
      targetPort: 16686
```

- [x] **Step 2: Remove the now-redundant placeholder and add this component's section to the install script**

```bash
rm platform-app/infra/observability/jaeger/.gitkeep
```

Append to `platform-app/scripts/install-observability-stack.sh`, right after
the OTel Collector section:

```bash
echo "==> [2/7] Jaeger"
kubectl apply -f "${OBS_DIR}/jaeger/jaeger.yaml"
```

- [ ] **Step 3: Hand to the repo owner to apply and verify**

```bash
cd /home/motadata/itsm-cloudnative-demo-app/platform-app
kubectl apply -f infra/observability/jaeger/jaeger.yaml
kubectl get pods -n itsm-dev -l app=jaeger -w
```
Expected: `2/2 Running`.

```bash
kubectl port-forward -n itsm-dev svc/jaeger 16686:16686 &
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:16686
kill %1
```
Expected: `200`.

---

## Task 3: Prometheus

**Files:**
- Create: `platform-app/infra/observability/prometheus/values.yaml`
- Delete: `platform-app/infra/observability/prometheus/.gitkeep`
- Modify: `platform-app/scripts/install-observability-stack.sh`

**Interfaces:**
- Consumes: Task 1's OTel Collector exporter at `:8888/metrics`, discovered
  automatically via this chart's default annotation-based pod scraping (the
  `prometheus.io/scrape` annotations Task 1 already added) — no explicit
  scrape-target config needed here.
- Produces: a Service (expected name `prometheus-server`, confirmed live in
  Step 3 below — the chart appends `-server` to the release name for its
  server sub-component regardless of `fullnameOverride`) that Task 6's
  Grafana datasource and Task 7's VirtualService both target.

- [ ] **Step 1: Write the values file**

```yaml
# platform-app/infra/observability/prometheus/values.yaml
fullnameOverride: "prometheus"

alertmanager:
  enabled: false
prometheus-pushgateway:
  enabled: false
prometheus-node-exporter:
  enabled: false
kube-state-metrics:
  enabled: false

server:
  retention: "6h"
  persistentVolume:
    enabled: false
  resources:
    requests:
      cpu: 150m
      memory: 256Mi
    limits:
      cpu: 400m
      memory: 512Mi
```

- [x] **Step 2: Remove the placeholder and add this component's section**

```bash
rm platform-app/infra/observability/prometheus/.gitkeep
```

Append to the install script:

```bash
echo "==> [3/7] Prometheus"
helm upgrade --install prometheus prometheus-community/prometheus \
  --version 29.30.0 \
  --namespace "${NAMESPACE}" \
  -f "${OBS_DIR}/prometheus/values.yaml"
```

- [ ] **Step 3: Hand to the repo owner — dry run first, matching Task 1's pattern**

```bash
cd /home/motadata/itsm-cloudnative-demo-app/platform-app
helm upgrade --install prometheus prometheus-community/prometheus \
  --version 29.30.0 --namespace itsm-dev \
  -f infra/observability/prometheus/values.yaml --dry-run --debug | head -80
```
If any of `alertmanager.enabled` / `prometheus-pushgateway.enabled` /
`prometheus-node-exporter.enabled` / `kube-state-metrics.enabled` is
rejected as an unknown key, run
`helm show values prometheus-community/prometheus --version 29.30.0 | grep -B2 -A2 enabled`
to find the current sub-chart key names and fix the values file.

- [ ] **Step 4: Apply for real and confirm the actual Service name**

```bash
bash scripts/install-observability-stack.sh
kubectl get pods -n itsm-dev -l app.kubernetes.io/name=prometheus -w
kubectl get svc -n itsm-dev | grep -i prometheus
```
Expected: pod `2/2 Running`. **Note the exact Service name printed** — Task
6 needs it for Grafana's datasource URL; this plan assumes `prometheus-server`
but confirm before writing Task 6's values.

- [ ] **Step 5: Confirm the OTel Collector target was actually scraped**

```bash
kubectl port-forward -n itsm-dev svc/prometheus-server 9090:80 &
curl -s 'http://localhost:9090/api/v1/query?query=up{job="kubernetes-pods"}' | python3 -m json.tool
kill %1
```
Expected: at least one result with `"value":[...,"1"]` for the
otel-collector pod. If empty, check the pod's `prometheus.io/*` annotations
landed (`kubectl get pod -n itsm-dev -l app.kubernetes.io/name=opentelemetry-collector -o yaml | grep prometheus.io`).

---

## Task 4: Loki

**Files:**
- Create: `platform-app/infra/observability/loki/values.yaml`
- Delete: `platform-app/infra/observability/loki/.gitkeep`
- Modify: `platform-app/scripts/install-observability-stack.sh`

**Interfaces:**
- Consumes: nothing yet (Task 5's Promtail pushes into it).
- Produces: a Service named `loki` in `itsm-dev`, port 3100 — Task 5's
  Promtail and Task 6's Grafana datasource both target it.

- [ ] **Step 1: Write the values file**

```yaml
# platform-app/infra/observability/loki/values.yaml
fullnameOverride: "loki"
deploymentMode: SingleBinary

loki:
  auth_enabled: false
  commonConfig:
    replication_factor: 1
  storage:
    type: filesystem
  schemaConfig:
    configs:
      - from: "2024-01-01"
        store: tsdb
        object_store: filesystem
        schema: v13
        index:
          prefix: index_
          period: 24h
  limits_config:
    retention_period: 24h

singleBinary:
  replicas: 1
  persistence:
    enabled: false
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 300m
      memory: 256Mi

read:
  replicas: 0
write:
  replicas: 0
backend:
  replicas: 0

gateway:
  enabled: false

test:
  enabled: false

monitoring:
  serviceMonitor:
    enabled: false
  selfMonitoring:
    enabled: false
  lokiCanary:
    enabled: false
```

- [ ] **Step 2: Remove the placeholder and add this component's section**

```bash
rm platform-app/infra/observability/loki/.gitkeep
```

Append to the install script:

```bash
echo "==> [4/7] Loki"
helm upgrade --install loki grafana/loki \
  --version 7.3.0 \
  --namespace "${NAMESPACE}" \
  -f "${OBS_DIR}/loki/values.yaml"
```

- [ ] **Step 3: Hand to the repo owner — dry run first**

```bash
cd /home/motadata/itsm-cloudnative-demo-app/platform-app
helm upgrade --install loki grafana/loki \
  --version 7.3.0 --namespace itsm-dev \
  -f infra/observability/loki/values.yaml --dry-run --debug | head -100
```
This chart's schema has changed across major versions more than most —
if `deploymentMode`, `singleBinary`, or `loki.schemaConfig` are rejected,
run `helm show values grafana/loki --version 7.3.0` and adjust the values
file's key paths to match what 7.3.0 actually expects; the *intent*
(single-binary mode, filesystem storage, no read/write/backend replicas,
short retention) stays the same regardless of exact key names.

- [ ] **Step 4: Apply for real and verify**

```bash
bash scripts/install-observability-stack.sh
kubectl get pods -n itsm-dev -l app.kubernetes.io/name=loki -w
kubectl get svc -n itsm-dev loki
```
Expected: pod `2/2 Running`, Service `loki` on port 3100.

---

## Task 5: Promtail

**Files:**
- Create: `platform-app/infra/observability/promtail/values.yaml`
- Modify: `platform-app/scripts/install-observability-stack.sh`

**Interfaces:**
- Consumes: Task 4's `loki` Service (push target).
- Produces: log lines from `itsm-dev` and `customer-app-dev` pods only,
  landing in Loki. No Service of its own (client-only role).

- [ ] **Step 1: Write the values file**

```yaml
# platform-app/infra/observability/promtail/values.yaml
fullnameOverride: "promtail"

resources:
  requests:
    cpu: 30m
    memory: 64Mi
  limits:
    cpu: 50m
    memory: 128Mi

config:
  clients:
    - url: http://loki.itsm-dev.svc.cluster.local:3100/loki/api/v1/push
  snippets:
    pipelineStages:
      - cri: {}
    extraRelabelConfigs:
      - source_labels: [__meta_kubernetes_namespace]
        regex: "itsm-dev|customer-app-dev"
        action: keep
```

- [x] **Step 2: Add this component's section to the install script**

```bash
echo "==> [5/7] Promtail"
helm upgrade --install promtail grafana/promtail \
  --version 6.17.1 \
  --namespace "${NAMESPACE}" \
  -f "${OBS_DIR}/promtail/values.yaml"
```

- [ ] **Step 3: Hand to the repo owner — dry run first**

```bash
cd /home/motadata/itsm-cloudnative-demo-app/platform-app
helm upgrade --install promtail grafana/promtail \
  --version 6.17.1 --namespace itsm-dev \
  -f infra/observability/promtail/values.yaml --dry-run --debug | head -100
```
If `config.snippets.extraRelabelConfigs` is rejected, run
`helm show values grafana/promtail --version 6.17.1 | grep -B3 -A15 snippets`
and fix the key path — the intent (drop everything except
itsm-dev/customer-app-dev namespaces) stays the same.

- [ ] **Step 4: Apply for real and verify — this is the one most likely to hit the STRICT-mTLS issue from Global Constraints**

```bash
bash scripts/install-observability-stack.sh
kubectl get pods -n itsm-dev -l app.kubernetes.io/name=promtail -o wide
```
Expected: one pod per node, all `2/2 Running` (3 pods total, one per
cluster node — confirms sidecars attached even on a DaemonSet).

```bash
kubectl logs -n itsm-dev -l app.kubernetes.io/name=promtail --tail=50 | grep -i "error\|refused\|reset"
```
Expected: no output (no errors). Any "connection refused" or "context
deadline exceeded" talking to `loki.itsm-dev.svc.cluster.local:3100` means
the STRICT-mTLS sidecar issue — check `kubectl get pods -n itsm-dev -l app.kubernetes.io/name=promtail`
shows `2/2` not `1/1` first.

---

## Task 6: Grafana

**Files:**
- Create: `platform-app/infra/observability/grafana/values.yaml`
- Delete: `platform-app/infra/observability/grafana/.gitkeep`,
  `platform-app/infra/observability/grafana/dashboards/.gitkeep`,
  `platform-app/infra/observability/grafana/provisioning/dashboards/.gitkeep`,
  `platform-app/infra/observability/grafana/provisioning/datasources/.gitkeep`
  (all redundant once this task's values file exists — no dashboards are
  authored per the spec's explicit non-goal, so the `dashboards/` and
  `provisioning/` subdirectories stay empty and can go with their
  placeholders; datasources are provisioned via Helm values, not files in
  this tree)
- Modify: `platform-app/scripts/install-observability-stack.sh`

**Interfaces:**
- Consumes: Task 3's Prometheus Service name (**confirm the exact name from
  Task 3 Step 4's live output before writing this file** — this plan assumes
  `prometheus-server`), Task 4's `loki` Service, Task 2's `jaeger` Service.
- Produces: a Grafana instance with all three datasources pre-wired, no
  manual click-through setup needed.

- [ ] **Step 1: Write the values file** (adjust the Prometheus URL if Task 3
  confirmed a different Service name)

```yaml
# platform-app/infra/observability/grafana/values.yaml
fullnameOverride: "grafana"

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 300m
    memory: 256Mi

persistence:
  enabled: false

adminUser: admin
adminPassword: hearth-demo-admin

datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus-server.itsm-dev.svc.cluster.local
        access: proxy
        isDefault: true
      - name: Loki
        type: loki
        url: http://loki.itsm-dev.svc.cluster.local:3100
        access: proxy
      - name: Jaeger
        type: jaeger
        url: http://jaeger.itsm-dev.svc.cluster.local:16686
        access: proxy
```

`adminPassword` set as a plain literal here matches this repo's existing
practice for dev-only demo credentials (the DB password, the JWT dev
secrets are all plaintext in-repo too) — this is a `itsm-dev` demo
instance behind the same trust boundary as everything else, not a
production credential.

- [x] **Step 2: Remove the now-redundant placeholders and add this component's section**

```bash
rm platform-app/infra/observability/grafana/.gitkeep \
   platform-app/infra/observability/grafana/dashboards/.gitkeep \
   platform-app/infra/observability/grafana/provisioning/dashboards/.gitkeep \
   platform-app/infra/observability/grafana/provisioning/datasources/.gitkeep
```

Append to the install script:

```bash
echo "==> [6/7] Grafana"
helm upgrade --install grafana grafana/grafana \
  --version 10.5.15 \
  --namespace "${NAMESPACE}" \
  -f "${OBS_DIR}/grafana/values.yaml"
```

- [ ] **Step 3: Hand to the repo owner — dry run first**

```bash
cd /home/motadata/itsm-cloudnative-demo-app/platform-app
helm upgrade --install grafana grafana/grafana \
  --version 10.5.15 --namespace itsm-dev \
  -f infra/observability/grafana/values.yaml --dry-run --debug | head -80
```
If `datasources` is rejected, run
`helm show values grafana/grafana --version 10.5.15 | grep -B2 -A20 "^datasources:"`
and fix the structure to match.

- [ ] **Step 4: Apply for real and verify all three datasources connect**

```bash
bash scripts/install-observability-stack.sh
kubectl get pods -n itsm-dev -l app.kubernetes.io/name=grafana -w
kubectl port-forward -n itsm-dev svc/grafana 3000:80 &
curl -s -u admin:hearth-demo-admin http://localhost:3000/api/datasources | python3 -m json.tool
kill %1
```
Expected: `2/2 Running`, and the datasources call returns all 3 (Prometheus,
Loki, Jaeger) with no error.

---

## Task 7: Expose the three UIs through the existing Istio Gateway

**Files:**
- Create: `platform-app/infra/k8s/istio/virtual-services/dev/observability-routing.yaml`
- Modify: `platform-app/scripts/install-observability-stack.sh`

**Interfaces:**
- Consumes: `itsm-dev/itsm-gateway` (already exists — `platform-app/infra/k8s/istio/gateway.yaml`,
  unmodified by this plan) and the `grafana`, `jaeger` (`query-http` port),
  `prometheus-server` Services from Tasks 2/3/6.
- Produces: `grafana.dev.local`, `jaeger.dev.local`, `prometheus.dev.local`
  reachable through NodePort 30080 the same way `customer-app.dev.local` and
  the bare node IP already are.

- [x] **Step 1: Write the VirtualServices**

```yaml
# platform-app/infra/k8s/istio/virtual-services/dev/observability-routing.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: grafana-routing
  namespace: itsm-dev
spec:
  hosts:
    - "grafana.dev.local"
  gateways:
    - itsm-gateway
  http:
    - route:
        - destination:
            host: grafana.itsm-dev.svc.cluster.local
            port:
              number: 80
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: jaeger-routing
  namespace: itsm-dev
spec:
  hosts:
    - "jaeger.dev.local"
  gateways:
    - itsm-gateway
  http:
    - route:
        - destination:
            host: jaeger.itsm-dev.svc.cluster.local
            port:
              number: 16686
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: prometheus-routing
  namespace: itsm-dev
spec:
  hosts:
    - "prometheus.dev.local"
  gateways:
    - itsm-gateway
  http:
    - route:
        - destination:
            host: prometheus-server.itsm-dev.svc.cluster.local
            port:
              number: 80
```
(Adjust the `prometheus-server` host if Task 3 confirmed a different
Service name.)

- [x] **Step 2: Add this to the install script — the last section**

```bash
echo "==> [7/7] Istio routing for observability UIs"
kubectl apply -f infra/k8s/istio/virtual-services/dev/observability-routing.yaml

echo
echo "Done. UIs reachable at (via --resolve or /etc/hosts pointing at any node IP, port 30080):"
echo "  http://grafana.dev.local:30080"
echo "  http://jaeger.dev.local:30080"
echo "  http://prometheus.dev.local:30080"
```

- [ ] **Step 3: Hand to the repo owner to apply and do the full-stack reachability check**

```bash
cd /home/motadata/itsm-cloudnative-demo-app/platform-app
kubectl apply -f infra/k8s/istio/virtual-services/dev/observability-routing.yaml

NODE_IP="$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')"
for host in grafana jaeger prometheus; do
  echo "== ${host}.dev.local =="
  curl -s -o /dev/null -w '%{http_code}\n' --resolve "${host}.dev.local:30080:${NODE_IP}" \
    "http://${host}.dev.local:30080/"
done
```
Expected: `200` for all three (Grafana and Prometheus's `/` redirect chain
should resolve to 200; Jaeger's UI root is 200 directly).

- [ ] **Step 4: Commit checkpoint**
This is a natural stopping point — the stack (#40) is fully deployed and
reachable. **Update `customer-app/TODO.md`'s Phase 7 section and this repo's
board state per the established policy** (local doc edits only; board moves
are the repo owner's call, same as every prior phase) before moving to
instrumentation.

---

## Task 8: Manual spans on delivery-service (closes half of #37/#38)

**Files:**
- Modify: `customer-app/services/delivery-service/pom.xml`
- Modify: `customer-app/services/delivery-service/src/main/java/com/itsmcloudnative/delivery/delivery/DeliveryController.java`

**Interfaces:**
- Consumes: `com.itsmcloudnative.delivery.tenant.TenantContext.get()` →
  `String` (already exists, already populated by `TenantFilter` per request
  — same value order-service/catalog-service already put into their own
  spans).
- Produces: spans `customer.delivery.list`, `customer.delivery.create`,
  `customer.delivery.get`, `customer.delivery.update_status`, each carrying
  a `tenant.id` string attribute — visible in Jaeger once Task 1-2 are live.

- [ ] **Step 1: Add the dependency**

```xml
<!-- customer-app/services/delivery-service/pom.xml, inside <dependencies> -->
<dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-instrumentation-annotations</artifactId>
    <version>2.31.1</version>
</dependency>
```
This only supplies the `@WithSpan` annotation type and `Span`/`Context`
classes at compile time — the actual span creation is done by the OTel
javaagent already attached in the Dockerfile (`-javaagent:/app/otel-javaagent.jar`)
recognizing the annotation via bytecode instrumentation at runtime. No SDK
wiring, no new runtime dependency beyond what the agent already provides.

- [ ] **Step 2: Instrument the controller**

Replace `customer-app/services/delivery-service/src/main/java/com/itsmcloudnative/delivery/delivery/DeliveryController.java`
with:

```java
package com.itsmcloudnative.delivery.delivery;

import com.itsmcloudnative.delivery.tenant.TenantContext;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DeliveryController {

    private final DeliveryRepository repo;

    public DeliveryController(DeliveryRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "delivery-service");
    }

    @WithSpan("customer.delivery.list")
    @GetMapping("/deliveries")
    public List<Delivery> listByOrder(@RequestParam UUID orderId) {
        Span.current().setAttribute("tenant.id", TenantContext.get());
        try {
            return repo.findByOrderId(TenantContext.get(), orderId);
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    @WithSpan("customer.delivery.create")
    @PostMapping("/deliveries")
    public ResponseEntity<Delivery> create(@RequestBody CreateDeliveryRequest req) {
        Span.current().setAttribute("tenant.id", TenantContext.get());
        if (req.orderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "order_id is required");
        }
        try {
            Delivery created = repo.create(TenantContext.get(), req.orderId(), req.riderName());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    @WithSpan("customer.delivery.get")
    @GetMapping("/deliveries/{id}")
    public Delivery getById(@PathVariable UUID id) {
        Span.current().setAttribute("tenant.id", TenantContext.get());
        try {
            return repo.findById(TenantContext.get(), id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "delivery not found"));
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    @WithSpan("customer.delivery.update_status")
    @PutMapping("/deliveries/{id}/status")
    public Delivery updateStatus(@PathVariable UUID id, @RequestBody UpdateStatusRequest req) {
        Span.current().setAttribute("tenant.id", TenantContext.get());
        if (!Delivery.VALID_STATUSES.contains(req.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        try {
            return repo.updateStatus(TenantContext.get(), id, req.status())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "delivery not found"));
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    private ResponseStatusException internalError(SQLException e) {
        return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "internal error", e);
    }

    public record CreateDeliveryRequest(UUID orderId, String riderName) {}

    public record UpdateStatusRequest(String status) {}
}
```

- [ ] **Step 3: Build locally to confirm it compiles**

```bash
cd customer-app/services/delivery-service
./mvnw -q -DskipTests package || mvn -q -DskipTests package
```
Expected: `BUILD SUCCESS`, a jar produced under `target/`.

- [ ] **Step 4: Commit**

```bash
git add customer-app/services/delivery-service/pom.xml \
        customer-app/services/delivery-service/src/main/java/com/itsmcloudnative/delivery/delivery/DeliveryController.java
git commit -m "feat(delivery-service): add manual OTel spans with tenant.id"
```
(Per this repo's standing rule: this commit is for the repo owner to run
themselves, never run by an agent — see root `CLAUDE.md` §13.)

---

## Task 9: Manual spans on payment-service (closes the other half of #37/#38)

**Files:**
- Modify: `customer-app/services/payment-service/pom.xml`
- Modify: `customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/payment/PaymentController.java`

**Interfaces:**
- Consumes: `com.itsmcloudnative.payment.tenant.TenantContext.get()` (same
  pattern as Task 8).
- Produces: spans `customer.payment.list`, `customer.payment.create`,
  `customer.payment.get`, `customer.payment.update_status`, each with
  `tenant.id`.

- [ ] **Step 1: Add the dependency**

```xml
<!-- customer-app/services/payment-service/pom.xml, inside <dependencies> -->
<dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-instrumentation-annotations</artifactId>
    <version>2.31.1</version>
</dependency>
```

- [ ] **Step 2: Instrument the controller**

Replace `customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/payment/PaymentController.java`
with:

```java
package com.itsmcloudnative.payment.payment;

import com.itsmcloudnative.payment.tenant.TenantContext;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {

    private final PaymentRepository repo;

    public PaymentController(PaymentRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "payment-service");
    }

    @WithSpan("customer.payment.list")
    @GetMapping("/payments")
    public List<Payment> listByOrder(@RequestParam UUID orderId) {
        Span.current().setAttribute("tenant.id", TenantContext.get());
        try {
            return repo.findByOrderId(TenantContext.get(), orderId);
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    /**
     * Mock payment processing resolves synchronously on create — there's no
     * real external gateway to await. amount <= 0 resolves to "failed",
     * everything else resolves to "completed". "pending" is a valid status
     * per the payments table's CHECK constraint but is never produced by
     * this service — it's schema headroom, not a reachable state here.
     */
    @WithSpan("customer.payment.create")
    @PostMapping("/payments")
    public ResponseEntity<Payment> create(@RequestBody CreatePaymentRequest req) {
        Span.current().setAttribute("tenant.id", TenantContext.get());
        if (req.orderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "order_id is required");
        }
        if (req.amount() == null || req.amount().scale() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be a valid monetary value");
        }
        String method = (req.paymentMethod() == null || req.paymentMethod().isBlank()) ? "mock" : req.paymentMethod();
        String status = req.amount().compareTo(BigDecimal.ZERO) <= 0 ? "failed" : "completed";
        try {
            Payment created = repo.create(TenantContext.get(), req.orderId(), req.amount(), method, status);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    @WithSpan("customer.payment.get")
    @GetMapping("/payments/{id}")
    public Payment getById(@PathVariable UUID id) {
        Span.current().setAttribute("tenant.id", TenantContext.get());
        try {
            return repo.findById(TenantContext.get(), id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    /**
     * The only transition this mock processor supports post-creation is a
     * refund of a completed payment — payments resolve to completed/failed
     * immediately on create, so there's no "authorize then capture" flow to
     * model, and un-refunding or un-failing a payment isn't realistic.
     */
    @WithSpan("customer.payment.update_status")
    @PutMapping("/payments/{id}/status")
    public Payment updateStatus(@PathVariable UUID id, @RequestBody UpdateStatusRequest req) {
        Span.current().setAttribute("tenant.id", TenantContext.get());
        if (!Payment.VALID_STATUSES.contains(req.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        try {
            Payment existing = repo.findById(TenantContext.get(), id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
            if (!("completed".equals(existing.status()) && "refunded".equals(req.status()))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "invalid status transition: " + existing.status() + " -> " + req.status());
            }
            return repo.updateStatus(TenantContext.get(), id, req.status())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    private ResponseStatusException internalError(SQLException e) {
        return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "internal error", e);
    }

    public record CreatePaymentRequest(UUID orderId, BigDecimal amount, String paymentMethod) {}

    public record UpdateStatusRequest(String status) {}
}
```

- [ ] **Step 3: Build locally to confirm it compiles**

```bash
cd customer-app/services/payment-service
./mvnw -q -DskipTests package || mvn -q -DskipTests package
```
Expected: `BUILD SUCCESS`.

- [ ] **Step 4: Commit**

```bash
git add customer-app/services/payment-service/pom.xml \
        customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/payment/PaymentController.java
git commit -m "feat(payment-service): add manual OTel spans with tenant.id"
```
(Repo owner runs this, per root `CLAUDE.md` §13.)

---

## Task 10: Rebuild and redeploy delivery-service and payment-service

**Files:** none new — this task ships Tasks 8-9's code changes to the
cluster. Image tags bump per this repo's existing convention (delivery/
payment are currently `v0.1.1`).

**Interfaces:**
- Consumes: Tasks 8-9's committed code.
- Produces: `v0.1.2` images for both services running live in
  `customer-app-dev`.

- [ ] **Step 1: Hand the repo owner the build+push+deploy commands**

Confirmed against `customer-app/infra/helm/customer-app/values.yaml`:
registry prefix is `global.imageRegistry: "preet2fun/"`,
`deliveryService.image.tag` / `paymentService.image.tag` are the exact keys
(currently `v0.1.1` each), matching `customer-app/docs/deployment-guide.md`'s
own build+push commands for the original images.

```bash
cd /home/motadata/itsm-cloudnative-demo-app/customer-app
docker build -t preet2fun/delivery-service:v0.1.2 services/delivery-service
docker build -t preet2fun/payment-service:v0.1.2 services/payment-service
docker push preet2fun/delivery-service:v0.1.2
docker push preet2fun/payment-service:v0.1.2
```

Then update the tags in `infra/helm/customer-app/values.yaml` (`deliveryService.image.tag`
and `paymentService.image.tag`, both currently `"v0.1.1"`) to `"v0.1.2"` —
matching this file's own documented practice ("If you bump a tag again in
the future, update `values.yaml` to match before `helm upgrade`, or the
chart will keep referencing the old tag") — then:

```bash
helm upgrade customer-app infra/helm/customer-app -n customer-app-dev \
  -f infra/helm/customer-app/values.yaml

kubectl rollout status deployment/delivery-service -n customer-app-dev
kubectl rollout status deployment/payment-service -n customer-app-dev
```

- [ ] **Step 2: Verify both pods came back healthy**

```bash
kubectl get pods -n customer-app-dev -l app=delivery-service
kubectl get pods -n customer-app-dev -l app=payment-service
```
Expected: both `2/2 Running`, new pod age (not the old 6-day-old pods from
before this rollout).

---

## Task 11: End-to-end verification (closes #39)

**Files:** none — this task is entirely verification against the live
cluster. Update `customer-app/TODO.md` and this repo's memory/docs with the
result as the deliverable.

- [ ] **Step 1: Drive one real request through delivery-service and
  payment-service and confirm spans land in Jaeger**

```bash
# Reuse an existing seeded JWT (see phase-03-istio-ingress-guide.md Step 5
# for how to mint one) or re-run the smoke test, which exercises all 4
# services:
cd /home/motadata/itsm-cloudnative-demo-app/customer-app
SEED_PASSWORD='<the seed password>' bash scripts/tenant-isolation-smoke-test.sh
```

```bash
kubectl port-forward -n itsm-dev svc/jaeger 16686:16686 &
curl -s 'http://localhost:16686/api/traces?service=delivery-service&limit=5' | python3 -m json.tool | head -40
curl -s 'http://localhost:16686/api/traces?service=payment-service&limit=5' | python3 -m json.tool | head -40
kill %1
```
Expected: traces present for both, each span's `tags` including
`tenant.id` set to `customer_a`/`customer_b` (matching the smoke test's own
tenants).

- [ ] **Step 2: Confirm the corresponding metrics reached Prometheus**

```bash
kubectl port-forward -n itsm-dev svc/prometheus-server 9090:80 &
curl -s 'http://localhost:9090/api/v1/query?query=customer_order_create_total' | python3 -m json.tool
kill %1
```
Expected: a non-empty result (the exact metric name here is whatever
order-service actually emits — check
`customer-app/services/order-service/internal/` for its real Prometheus
metric names if `customer_order_create_total` doesn't match; the point is
confirming *some* app-emitted metric is queryable, not this exact name).

- [ ] **Step 3: Confirm log lines reached Loki**

```bash
kubectl port-forward -n itsm-dev svc/loki 3100:3100 &
curl -s -G 'http://localhost:3100/loki/api/v1/query_range' \
  --data-urlencode 'query={namespace="customer-app-dev", app="delivery-service"}' \
  --data-urlencode 'limit=5' | python3 -m json.tool
kill %1
```
Expected: non-empty `result` array. If the label names (`namespace`, `app`)
don't match, check what Promtail actually attached —
`curl -s http://localhost:3100/loki/api/v1/label/app/values` lists real
label values.

- [ ] **Step 4: Confirm platform-app's own telemetry lands in the same
  backend, distinguishable from customer-app's**

```bash
curl -s 'http://localhost:16686/api/traces?service=incident-service&limit=5' | python3 -m json.tool | grep -A2 tenant.id
```
Expected: either no `tenant.id` tag at all (platform staff — absent tenant
claim is the valid, documented state per root `CLAUDE.md` §3) or empty,
never a customer-app tenant slug leaking into a platform-app trace.

- [ ] **Step 5: Update tracking**

Update `customer-app/TODO.md`'s Phase 7 section with this evidence (same
pattern as every prior phase — local, uncommitted, repo owner reviews and
commits). Do not move #40/#37/#38/#39 on the GitHub Project board —
per established policy, that's the repo owner's call each time.

- [ ] **Step 6: Stop here and check in**
Per root `CLAUDE.md` §11's "one roadmap task at a time" — Phase 7 ends here.
Don't start Phase 8, 9, or any of the remaining screen phases without the
repo owner picking the next one.

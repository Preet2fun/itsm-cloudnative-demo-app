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

echo "==> [2/7] Jaeger"
kubectl apply -f "${OBS_DIR}/jaeger/jaeger.yaml"

echo "==> [3/7] Prometheus"
helm upgrade --install prometheus prometheus-community/prometheus \
  --version 29.30.0 \
  --namespace "${NAMESPACE}" \
  -f "${OBS_DIR}/prometheus/values.yaml"

echo "==> [4/7] Loki"
helm upgrade --install loki grafana/loki \
  --version 7.3.0 \
  --namespace "${NAMESPACE}" \
  -f "${OBS_DIR}/loki/values.yaml"

echo "==> [5/7] Promtail"
helm upgrade --install promtail grafana/promtail \
  --version 6.17.1 \
  --namespace "${NAMESPACE}" \
  -f "${OBS_DIR}/promtail/values.yaml"

echo "==> [6/7] Grafana"
helm upgrade --install grafana grafana/grafana \
  --version 10.5.15 \
  --namespace "${NAMESPACE}" \
  -f "${OBS_DIR}/grafana/values.yaml"

echo "==> [7/7] Istio routing for observability UIs"
kubectl apply -f infra/k8s/istio/virtual-services/dev/observability-routing.yaml

echo
echo "Done. UIs reachable at (via --resolve or /etc/hosts pointing at any node IP, port 30080):"
echo "  http://grafana.dev.local:30080"
echo "  http://jaeger.dev.local:30080"
echo "  http://prometheus.dev.local:30080"

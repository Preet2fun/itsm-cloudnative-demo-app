#!/usr/bin/env bash
# Script: setup-cluster.sh
# Creates the K8s namespace and all required Secrets for the given environment.
# Run this AFTER install-istio.sh and BEFORE deploying the Helm chart.
#
# Usage (run from repo root on the K8s master):
#   ENV=dev bash scripts/setup-cluster.sh
#   ENV=qa  bash scripts/setup-cluster.sh
#
# The secret "itsm-secrets" is created with these keys:
#   database-url       — PostgreSQL connection string
#   jwt-private-key    — RSA-2048 PEM (user-service signs JWTs)
#   redis-url          — Redis connection string
#   rabbitmq-url       — RabbitMQ AMQP URL (incident-service)
set -euo pipefail

ENV="${ENV:-dev}"
NS="itsm-${ENV}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Defaults (override via env vars before running) ───────────────────────────
DATABASE_URL="${DATABASE_URL:-postgres://itsm:itsm@172.16.13.168:5432/itsm?sslmode=disable}"
REDIS_URL="${REDIS_URL:-redis://redis.${NS}:6379}"
RABBITMQ_URL="${RABBITMQ_URL:-amqp://itsm:itsm@rabbitmq.${NS}:5672/}"
JWT_KEY_PATH="${JWT_KEY_PATH:-/tmp/jwt-private-${ENV}.pem}"

echo "==> Setting up cluster for ENV=${ENV} (namespace: ${NS})"

# ── Step 1: Create / ensure namespace ─────────────────────────────────────────
echo "    [1/4] Applying namespace..."
kubectl apply -f "${REPO_ROOT}/infra/k8s/namespaces/${ENV}/namespace-itsm-${ENV}.yaml"

# ── Step 2: Generate RSA key if not present ────────────────────────────────────
echo "    [2/4] RSA key for JWT signing..."
if [[ ! -f "${JWT_KEY_PATH}" ]]; then
  echo "    Generating RSA-2048 private key at ${JWT_KEY_PATH}..."
  openssl genrsa -out "${JWT_KEY_PATH}" 2048
  echo "    Key generated. Back this up outside the repo — losing it invalidates all active sessions."
else
  echo "    Using existing key at ${JWT_KEY_PATH}"
fi

openssl rsa -in "${JWT_KEY_PATH}" -noout -check 2>/dev/null \
  && echo "    Key is valid." \
  || { echo "ERROR: Invalid RSA key at ${JWT_KEY_PATH}"; exit 1; }

# ── Step 3: Create / update itsm-secrets ──────────────────────────────────────
echo "    [3/4] Creating itsm-secrets in ${NS}..."

kubectl delete secret itsm-secrets -n "${NS}" --ignore-not-found=true

kubectl create secret generic itsm-secrets \
  -n "${NS}" \
  --from-literal="database-url=${DATABASE_URL}" \
  --from-file="jwt-private-key=${JWT_KEY_PATH}" \
  --from-literal="redis-url=${REDIS_URL}" \
  --from-literal="rabbitmq-url=${RABBITMQ_URL}"

echo "    Secret keys:"
kubectl get secret itsm-secrets -n "${NS}" \
  -o jsonpath='{.data}' \
  | python3 -c "import sys,json; print(list(json.load(sys.stdin).keys()))"

# ── Step 4: Verify Istio sidecar injection label ───────────────────────────────
echo "    [4/4] Verifying Istio sidecar injection label..."
INJECT=$(kubectl get namespace "${NS}" \
  -o jsonpath='{.metadata.labels.istio-injection}' 2>/dev/null || echo "")
if [[ "${INJECT}" == "enabled" ]]; then
  echo "    istio-injection=enabled ✓"
else
  echo "    Patching namespace with istio-injection=enabled..."
  kubectl label namespace "${NS}" istio-injection=enabled --overwrite
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "==> Cluster setup complete for ${NS}."
echo ""
echo "    Next steps:"
echo "    1. Deploy the Helm chart:"
if [[ "${ENV}" == "qa" ]]; then
echo "       helm upgrade --install itsm-app ./infra/helm/itsm-app \\"
echo "         -f infra/helm/itsm-app/values.yaml \\"
echo "         -f infra/helm/itsm-app/values-qa.yaml \\"
echo "         -n ${NS}"
else
echo "       helm upgrade --install itsm-app ./infra/helm/itsm-app \\"
echo "         -f infra/helm/itsm-app/values.yaml \\"
echo "         -n ${NS}"
fi
echo ""
echo "    2. Restart pods to inject Istio sidecars:"
echo "       kubectl rollout restart deployment -n ${NS}"
echo "       kubectl rollout restart statefulset -n ${NS}"
echo ""
echo "    3. Wait for 2/2 READY, then:"
echo "       ENV=${ENV} bash scripts/install-opa.sh"
echo "       ENV=${ENV} bash scripts/apply-istio-config.sh"

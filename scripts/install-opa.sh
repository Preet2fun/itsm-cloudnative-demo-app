#!/usr/bin/env bash
# Script: install-opa.sh
# Deploys OPA with the Envoy ext_authz plugin to the target namespace.
#
# Usage (run from repo root on the K8s master):
#   ENV=dev bash scripts/install-opa.sh
#   ENV=qa  bash scripts/install-opa.sh
#
# What it does:
#   1. Applies the OPA ConfigMap, policy ConfigMap, Deployment, and Service
#      into the target namespace (substituting itsm-dev → itsm-<ENV>).
#   2. Waits for OPA to be Ready.
#   3. Runs a health check against the OPA HTTP API.
set -euo pipefail

ENV="${ENV:-dev}"
NS="itsm-${ENV}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPA_DIR="${REPO_ROOT}/infra/k8s/opa"

echo "==> Deploying OPA to namespace: ${NS}"

# Helper: apply a manifest with namespace substitution if needed
apply_opa() {
  local file="$1"
  if [[ "${NS}" == "itsm-dev" ]]; then
    kubectl apply -f "${file}"
  else
    # Substitute namespace for non-dev environments
    sed "s/namespace: itsm-dev/namespace: ${NS}/g" "${file}" | kubectl apply -f -
  fi
}

# ── Apply manifests ────────────────────────────────────────────────────────────
echo "    Applying OPA config ConfigMap..."
apply_opa "${OPA_DIR}/config-configmap.yaml"

echo "    Applying OPA policy ConfigMap (Rego RBAC rules)..."
apply_opa "${OPA_DIR}/policy-configmap.yaml"

echo "    Applying OPA Deployment..."
apply_opa "${OPA_DIR}/deployment.yaml"

echo "    Applying OPA Service..."
apply_opa "${OPA_DIR}/service.yaml"

# ── Wait for OPA to be Ready ───────────────────────────────────────────────────
echo "==> Waiting for OPA pod to be Ready..."
kubectl rollout status deployment/opa -n "${NS}" --timeout=120s

# ── Health check ──────────────────────────────────────────────────────────────
echo "==> Verifying OPA health..."
OPA_POD=$(kubectl get pod -n "${NS}" -l app=opa \
  -o jsonpath='{.items[0].metadata.name}')

kubectl exec -n "${NS}" "${OPA_POD}" -- \
  wget -qO- http://localhost:8181/health 2>/dev/null \
  && echo "" \
  || echo "WARNING: OPA health endpoint not responding — check pod logs."

echo ""
echo "==> OPA deployment complete in ${NS}."
echo ""
kubectl get pods -n "${NS}" -l app=opa
echo ""
echo "==> Next step: bash scripts/apply-istio-config.sh ${ENV}"

#!/usr/bin/env bash
# Script: apply-istio-config.sh
# Applies all Istio networking + security manifests for the given environment.
# Must be run AFTER: install-istio.sh, setup-cluster.sh, install-opa.sh,
# and after all application pods are Running 2/2 (sidecars injected).
#
# Usage (run from repo root on the K8s master):
#   ENV=dev bash scripts/apply-istio-config.sh
#   ENV=qa  bash scripts/apply-istio-config.sh
#
# Apply order matters:
#   Gateway → VirtualService → RequestAuthentication →
#   DestinationRule → DENY AuthzPolicy → OPA CUSTOM AuthzPolicy → PeerAuthentication
#
# PeerAuthentication (mTLS STRICT) is applied LAST — only safe after
# all pods are confirmed 2/2 READY with Istio sidecars.
set -euo pipefail

ENV="${ENV:-dev}"
NS="itsm-${ENV}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ISTIO_DIR="${REPO_ROOT}/infra/k8s/istio"
OPA_DIR="${REPO_ROOT}/infra/k8s/opa"

echo "==> Applying Istio config for ENV=${ENV} (namespace: ${NS})"

# ── 1. Gateway (shared — always in itsm-dev) ──────────────────────────────────
# The Gateway CRD binds to the IngressGateway in istio-system.
# VirtualServices in both dev and qa reference this gateway.
if [[ "${ENV}" == "dev" ]]; then
  echo "    [1/7] Applying Gateway..."
  kubectl apply -f "${ISTIO_DIR}/gateway.yaml"
else
  echo "    [1/7] Gateway already deployed in itsm-dev (shared gateway) — skipping."
fi

# ── 2. VirtualService ─────────────────────────────────────────────────────────
echo "    [2/7] Applying VirtualService..."
kubectl apply -f "${ISTIO_DIR}/virtual-services/${ENV}/virtual-service.yaml"

# ── 3. RequestAuthentication (JWT validation) ──────────────────────────────────
echo "    [3/7] Applying RequestAuthentication..."
kubectl apply -f "${ISTIO_DIR}/request-authentication/${ENV}/request-auth.yaml"

# ── 4. DestinationRule (mTLS client-side) ─────────────────────────────────────
echo "    [4/7] Applying DestinationRule..."
kubectl apply -f "${ISTIO_DIR}/destination-rules/${ENV}/destination-rule.yaml"

# ── 5. DENY AuthorizationPolicy ───────────────────────────────────────────────
echo "    [5/7] Applying DENY AuthorizationPolicy (unauthenticated API requests)..."
kubectl apply -f "${ISTIO_DIR}/authorization-policies/${ENV}/authz-deny-unauthenticated.yaml"

# ── 6. OPA CUSTOM AuthorizationPolicy ─────────────────────────────────────────
echo "    [6/7] Applying OPA CUSTOM AuthorizationPolicy (RBAC)..."
kubectl apply -f "${OPA_DIR}/authz-policy-custom/${ENV}/authz-opa-custom.yaml"

# ── 7. PeerAuthentication (mTLS STRICT) — applied last ────────────────────────
echo ""
echo "    [7/7] About to apply PeerAuthentication STRICT mTLS..."
echo ""
echo "    WARNING: This requires ALL pods in ${NS} to be READY 2/2."
echo "    If any pods are 1/2, sidecars are missing — applying STRICT will break them."
echo ""

# Check all pods are 2/2
NOT_READY=$(kubectl get pods -n "${NS}" \
  -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.status.containerStatuses[*].ready}{"\n"}{end}' \
  2>/dev/null \
  | grep -v "^opa" \
  | grep -v "true true" \
  | grep -v "^$" || true)

if [[ -n "${NOT_READY}" ]]; then
  echo "    ERROR: Some pods are not 2/2 READY. Fix these before applying mTLS STRICT:"
  echo "${NOT_READY}"
  echo ""
  echo "    Hint: kubectl rollout restart deployment -n ${NS}"
  echo "    Then wait for 2/2 and re-run this script."
  exit 1
fi

kubectl apply -f "${ISTIO_DIR}/peer-authentication/${ENV}/peer-auth-mtls.yaml"
echo "    mTLS STRICT applied."

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "==> Istio config applied for ${NS}."
echo ""
echo "    Active policies:"
kubectl get gateway,virtualservice,requestauthentication,authorizationpolicy,peerauthentication \
  -n "${NS}" 2>/dev/null
echo ""
echo "==> Verify with: istioctl analyze -n ${NS}"

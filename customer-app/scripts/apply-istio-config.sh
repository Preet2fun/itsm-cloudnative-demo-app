#!/usr/bin/env bash
# Script: apply-istio-config.sh
# Description: Applies customer-app's Istio networking + security manifests
#              for the given environment, in the order that's safe under
#              STRICT mTLS. Structural port of
#              platform-app/scripts/apply-istio-config.sh. Does NOT touch the
#              shared itsm-gateway (customer-app reuses it) and does NOT
#              restart Deployments/StatefulSets itself - run `helm upgrade`
#              and `kubectl rollout restart` first, and wait for every pod to
#              reach 2/2, before running this script.
#
# Usage:
#   ENV=dev bash scripts/apply-istio-config.sh
#   ENV=qa  bash scripts/apply-istio-config.sh
#
# Safety: refuses to apply PeerAuthentication STRICT mTLS unless every pod in
# the namespace is already 2/2 READY (sidecars present) - applying STRICT
# before that breaks inter-service communication.

set -euo pipefail

ENV="${ENV:-dev}"
if [[ "${ENV}" != "dev" && "${ENV}" != "qa" ]]; then
  echo "ERROR: ENV must be 'dev' or 'qa', got '${ENV}'." >&2
  exit 1
fi

NS="customer-app-${ENV}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ISTIO_DIR="${REPO_ROOT}/infra/k8s/istio"

echo "==> Applying customer-app Istio config for ENV=${ENV} (namespace: ${NS})"

if ! kubectl get namespace "${NS}" &>/dev/null; then
  echo "ERROR: namespace ${NS} does not exist yet." >&2
  exit 1
fi

INJECTION_LABEL="$(kubectl get namespace "${NS}" -o jsonpath='{.metadata.labels.istio-injection}' 2>/dev/null || true)"
if [[ "${INJECTION_LABEL}" != "enabled" ]]; then
  echo "ERROR: namespace ${NS} is missing the istio-injection=enabled label." >&2
  echo "  kubectl label ns ${NS} istio-injection=enabled" >&2
  echo "  then restart every workload and re-run this script once all pods are 2/2." >&2
  exit 1
fi

NOT_READY=$(kubectl get pods -n "${NS}" \
  -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.status.containerStatuses[*].ready}{"\n"}{end}' \
  2>/dev/null \
  | grep -v "true true" \
  | grep -v "^$" || true)

if [[ -n "${NOT_READY}" ]]; then
  echo "ERROR: some pods in ${NS} are not 2/2 READY yet - Istio sidecars are" >&2
  echo "  missing on at least one pod. Fix these before applying mesh config:" >&2
  echo "${NOT_READY}" >&2
  echo "" >&2
  echo "  Hint: kubectl rollout restart deployment,statefulset -n ${NS}" >&2
  echo "  Then wait for 2/2 and re-run this script." >&2
  exit 1
fi

echo "    [1/5] Applying DestinationRule..."
kubectl apply -f "${ISTIO_DIR}/destination-rules/${ENV}/destination-rule.yaml"

echo "    [2/5] Applying VirtualService..."
kubectl apply -f "${ISTIO_DIR}/virtual-services/${ENV}/virtual-service.yaml"

echo "    [3/5] Applying RequestAuthentication..."
kubectl apply -f "${ISTIO_DIR}/request-authentication/${ENV}/request-auth.yaml"

echo "    [4/5] Applying deny-unauthenticated AuthorizationPolicy..."
kubectl apply -f "${ISTIO_DIR}/authorization-policies/${ENV}/authz-deny-unauthenticated.yaml"

echo "    [5/5] All pods 2/2 confirmed - applying PeerAuthentication STRICT mTLS..."
kubectl apply -f "${ISTIO_DIR}/peer-authentication/${ENV}/peer-auth-mtls.yaml"

echo ""
echo "==> Istio config applied for ${NS}."
echo ""
echo "    Active policies:"
kubectl get virtualservice,requestauthentication,authorizationpolicy,peerauthentication,destinationrule \
  -n "${NS}" 2>/dev/null

echo ""
echo "==> Verify with: istioctl analyze -n ${NS}"

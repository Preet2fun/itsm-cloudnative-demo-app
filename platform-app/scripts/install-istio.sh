#!/usr/bin/env bash
# Script: install-istio.sh
# Downloads istioctl and installs Istio onto the kubeadm cluster using the
# operator config at infra/istio/istio-operator.yaml.
#
# Usage (run from repo root on the K8s master):
#   bash scripts/install-istio.sh
#
# Optional env vars:
#   ISTIO_VERSION  — default 1.22.0
#   TARGET_ARCH    — default x86_64
set -euo pipefail

ISTIO_VERSION="${ISTIO_VERSION:-1.22.0}"
TARGET_ARCH="${TARGET_ARCH:-x86_64}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Installing Istio ${ISTIO_VERSION} (arch: ${TARGET_ARCH})"

# ── Step 1: Download istioctl ──────────────────────────────────────────────────
if command -v istioctl &>/dev/null; then
  echo "    istioctl already on PATH: $(istioctl version --remote=false 2>&1 | head -1)"
else
  echo "    Downloading istioctl..."
  curl -fsSL https://istio.io/downloadIstio \
    | ISTIO_VERSION="${ISTIO_VERSION}" TARGET_ARCH="${TARGET_ARCH}" sh -
  export PATH="${PWD}/istio-${ISTIO_VERSION}/bin:${PATH}"
  echo "    istioctl downloaded: $(istioctl version --remote=false 2>&1 | head -1)"
fi

# ── Step 2: Pre-flight checks ──────────────────────────────────────────────────
echo "==> Running pre-flight checks..."
istioctl x precheck

# ── Step 3: Install Istio control plane ───────────────────────────────────────
echo "==> Applying IstioOperator config..."
istioctl install -f "${REPO_ROOT}/infra/istio/istio-operator.yaml" -y

# ── Step 4: Wait for control plane ────────────────────────────────────────────
echo "==> Waiting for Istio pods to be Ready (up to 3 minutes)..."
kubectl wait --for=condition=Ready pod \
  -l app=istiod \
  -n istio-system \
  --timeout=180s

kubectl wait --for=condition=Ready pod \
  -l app=istio-ingressgateway \
  -n istio-system \
  --timeout=180s

# ── Step 5: Print summary ─────────────────────────────────────────────────────
echo ""
echo "==> Istio installation complete."
echo ""
kubectl get pods -n istio-system
echo ""
echo "==> IngressGateway NodePort (HTTP):"
kubectl get svc istio-ingressgateway -n istio-system \
  -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}'
echo ""
echo ""
echo "==> Next step: bash scripts/setup-cluster.sh [dev|qa]"

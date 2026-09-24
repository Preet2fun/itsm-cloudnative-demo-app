#!/usr/bin/env bash
# Installs ArgoCD (core mode — no Dex/notifications, ApplicationSet
# scaled to zero) into the `argocd` namespace. Idempotent — safe to
# re-run.
#
# Usage: bash scripts/install-argocd.sh

set -euo pipefail

helm repo add argo https://argoproj.github.io/argo-helm >/dev/null
helm repo update >/dev/null

echo "==> Installing ArgoCD 10.9.2 (core mode)"
helm upgrade --install argocd argo/argo-cd \
  --version 10.9.2 \
  --namespace argocd \
  --create-namespace \
  -f infra/argocd/install/values.yaml

echo
echo "Done. Check pod status with:"
echo "  kubectl get pods -n argocd"
echo "Get the initial admin password with:"
echo "  kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d; echo"

# Customer App CI/CD + GitOps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> (subagent-driven-development is not used in this repo — see root
> `.claude/CLAUDE.md` §13: never commit/push; that skill's review loop
> depends on commits as checkpoints). Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Install ArgoCD (core mode) on the cluster, replace the stub
`ci-docker-push.yml` with a real per-service build+push+tag-bump pipeline
triggered on merges to `main`, and wire up one ArgoCD `Application` so
`customer-app-dev` deploys itself automatically from then on — closing
GitHub issue #51.

**Architecture:** ArgoCD (official `argo/argo-cd` Helm chart, core
components only — no Dex/notifications/ApplicationSet) watches
`customer-app/infra/helm/customer-app/` on `main`. A rewritten GitHub
Actions workflow builds+pushes all 4 customer-app service images on every
push to `main`, then commits the new image tags into that chart's
`values.yaml`, which ArgoCD picks up and auto-syncs.

**Tech Stack:** Helm 3.15+, `argo/argo-cd` chart 10.9.2 (ArgoCD app v3.5.3),
GitHub Actions, `yq` for YAML edits, the existing `itsm-dev`/`customer-app-dev`
namespaces (already live).

**Spec:**
`docs/superpowers/specs/2026-09-24-customer-app-cicd-gitops-design.md`

## Global Constraints

- **Dev only.** No `customer-app-qa` namespace, no qa `Application`, no qa
  CI trigger. `platform-app/infra/argocd/apps/qa/.gitkeep` stays untouched.
- ArgoCD core mode: `dex.enabled: false`, `notifications.enabled: false`,
  `applicationSet.replicas: 0` (this chart version has no
  `applicationSet.enabled` toggle — confirmed live 2026-09-24). `redis`
  stays at its default `enabled: true`.
- Chart version pinned: **10.9.2** (repo `argo`, `https://argoproj.github.io/argo-helm`).
- Image tag scheme: git short SHA, `sha-<8 chars>` — no semantic versioning,
  no ArgoCD Image Updater.
- CI updates `customer-app/infra/helm/customer-app/values.yaml` directly and
  pushes to `main` itself — confirmed live 2026-09-24 that `main` has no
  branch protection blocking this.
- **No agent-run `git commit`/`git push`, ever** — root `CLAUDE.md` §13.
  Every commit in this plan is a step for the repo owner to run themselves,
  or (for the CI pipeline's own bot commit) something that happens inside
  GitHub Actions, never something this agent executes directly.
- Resource requests/limits for every new ArgoCD component are explicit —
  this chart sets no defaults (`resources: {}` everywhere).
- All cluster commands (`helm`, `kubectl`) are handed to the user to run on
  `kubernetes-master` and paste back — the agent has no direct cluster
  access this session, only HTTP reachability to the app NodePort.

---

## Task 1: Install ArgoCD (core mode)

**Files:**
- Create: `platform-app/infra/argocd/install/values.yaml`
- Modify: `platform-app/scripts/install-argocd.sh` (replace the 6-line stub)

**Interfaces:**
- Produces: a running ArgoCD in namespace `argocd`, and the *confirmed*
  `apiVersion` for the `Application` CRD, which Task 2 consumes.

- [ ] **Step 1: Write the values file**

Create `platform-app/infra/argocd/install/values.yaml`:

```yaml
# ArgoCD core install — server + repo-server + application-controller +
# redis only. dex/notifications off (no SSO, no external alerting needed
# for a solo-dev demo). applicationSet has no `enabled` toggle in this
# chart version (confirmed live 2026-09-24 via
# `helm show values argo/argo-cd --version 10.9.2`) — replicas: 0 is the
# only way to disable it; the Deployment/Service objects still get
# created but run no pods.

dex:
  enabled: false

notifications:
  enabled: false

applicationSet:
  replicas: 0

redis:
  enabled: true
  resources:
    requests:
      cpu: 50m
      memory: 64Mi
    limits:
      cpu: 100m
      memory: 128Mi

server:
  resources:
    requests:
      cpu: 64m
      memory: 64Mi
    limits:
      cpu: 200m
      memory: 128Mi

repoServer:
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 300m
      memory: 256Mi

controller:
  # 128Mi/256Mi was too tight — confirmed live 2026-09-25 the controller
  # got OOMKilled (exit 137) mid-sync and entered CrashLoopBackOff. Not
  # really about this one Application's ~14 resources: the controller
  # caches ALL live cluster resources across every namespace for
  # watch-based reconciliation, and this cluster carries a lot of CRDs
  # (Istio, Calico, cert-manager, Rancher) plus 40+ pods — a much bigger
  # working set than the Application-scoped sizing assumed.
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 300m
      memory: 512Mi
```

- [ ] **Step 2: Write the real install script**

Replace `platform-app/scripts/install-argocd.sh` entirely with:

```bash
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
```

- [ ] **Step 3: Hand the repo owner the install + verification commands**

Give the user this to run on `kubernetes-master`:

```bash
cd /home/motadata/itsm-cloudnative-demo-app/platform-app
bash scripts/install-argocd.sh
sleep 20
kubectl get pods -n argocd
kubectl get pod -n argocd -l app.kubernetes.io/name=argocd-server \
  -o jsonpath='{.items[0].spec.containers[0].resources}'; echo
```
Expected: `argocd-server`, `argocd-repo-server`, `argocd-application-controller`,
`argocd-redis` all `Running`/`1/1` (no `argocd-dex-server`,
`argocd-notifications-controller`, or running `argocd-applicationset-controller`
pod — confirms the disable flags actually took effect, not a silent no-op
like the earlier `lokiCanary` bug). The `jsonpath` command's output must show
non-empty `requests`/`limits` matching Step 1's values — if it comes back
`{}`, the `server.resources` key path is wrong for this chart version and
needs re-checking against `helm show values argo/argo-cd --version 10.9.2`
before continuing.

- [ ] **Step 4: Confirm the Application CRD's real apiVersion**

```bash
kubectl api-resources | grep argoproj
```
Expected: a line naming `applications` with `APIVERSION` column —
record this exact value for Task 2 (expected `argoproj.io/v1alpha1`, stable
across ArgoCD versions for years, but confirm rather than assume per root
`CLAUDE.md` §2/§13).

- [ ] **Step 5: Commit**

```bash
git add platform-app/infra/argocd/install/values.yaml \
        platform-app/scripts/install-argocd.sh
git commit -m "infra(argocd): install ArgoCD core mode into the cluster"
```
(Per this repo's standing rule: this commit is for the repo owner to run
themselves, never run by an agent — see root `CLAUDE.md` §13.)

---

## Task 2: ArgoCD Application for customer-app-dev

**Files:**
- Create: `platform-app/infra/argocd/apps/dev/customer-app.yaml`

**Interfaces:**
- Consumes: Task 1's confirmed `Application` CRD `apiVersion`.
- Produces: a live, auto-syncing ArgoCD `Application` named `customer-app`
  in namespace `argocd`, deploying `customer-app/infra/helm/customer-app/`
  from `main` into `customer-app-dev`.

- [ ] **Step 1: Write the Application manifest**

Create `platform-app/infra/argocd/apps/dev/customer-app.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: customer-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Preet2fun/itsm-cloudnative-demo-app.git
    targetRevision: main
    path: customer-app/infra/helm/customer-app
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: customer-app-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

If Task 1 Step 4 found a different `apiVersion` than `argoproj.io/v1alpha1`,
update the `apiVersion:` line above to match before applying.

- [ ] **Step 2: Hand the repo owner the apply + verification commands**

```bash
cd /home/motadata/itsm-cloudnative-demo-app/platform-app
kubectl apply -f infra/argocd/apps/dev/customer-app.yaml
sleep 10
kubectl get application customer-app -n argocd
kubectl get application customer-app -n argocd -o jsonpath='{.status.sync.status} {.status.health.status}'; echo
```
Expected: `SYNCED` and `Healthy`. If `Unknown`/`OutOfSync`, get the reason:
```bash
kubectl describe application customer-app -n argocd | tail -30
```

- [ ] **Step 3: Confirm it deployed the currently-live state correctly**

```bash
kubectl get pods -n customer-app-dev
```
Expected: the same pods already running from this session's earlier manual
`helm upgrade` (order/catalog/delivery/payment-service, redis) — ArgoCD
adopting an existing Helm release's resources without disrupting them.
If ArgoCD instead shows conflicts or tries to delete/recreate everything,
STOP and report back before continuing — that indicates the manual
`helm upgrade` release and ArgoCD's own tracking have diverged in a way
this plan didn't anticipate.

- [ ] **Step 4: Commit**

```bash
git add platform-app/infra/argocd/apps/dev/customer-app.yaml
git commit -m "infra(argocd): add customer-app-dev Application"
```
(Repo owner runs this, per root `CLAUDE.md` §13.)

---

## Task 3: Real ci-docker-push.yml

**Files:**
- Modify: `.github/workflows/ci-docker-push.yml` (replace the stub entirely)

**Interfaces:**
- Consumes: `secrets.DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` (not yet
  configured — Step 1 below).
- Produces: on every push to `main` touching `customer-app/services/**`,
  4 new `preet2fun/<service>:sha-<8 chars>` images on Docker Hub, and a
  bot commit bumping all 4 `*.image.tag` fields in
  `customer-app/infra/helm/customer-app/values.yaml` — which Task 2's
  `Application` auto-syncs.

- [ ] **Step 1: Confirm/add the DockerHub secrets**

`gh secret list` returned empty earlier this session — these are not yet
configured. Tell the user to check and, if missing, add them themselves
(never paste credentials into chat):
```bash
gh secret list
# if DOCKERHUB_USERNAME / DOCKERHUB_TOKEN are not listed:
gh secret set DOCKERHUB_USERNAME
gh secret set DOCKERHUB_TOKEN
```
(`gh secret set` without a value prompts interactively, so the token never
appears in shell history or this conversation.) Do not proceed to Step 5's
live test until this is confirmed done.

- [ ] **Step 2: Replace the workflow file**

Replace `.github/workflows/ci-docker-push.yml` entirely with:

```yaml
# ci-docker-push.yml
# Builds and pushes Docker images for all 4 customer-app services on every
# push to main, tagged by short git SHA, then commits the new tags into
# the Helm chart's values.yaml so ArgoCD (platform-app/infra/argocd/apps/dev/customer-app.yaml)
# picks them up and auto-syncs.
# Requires repo secrets DOCKERHUB_USERNAME / DOCKERHUB_TOKEN.

name: CI Docker Push

on:
  push:
    branches: [main]
    paths:
      - "customer-app/services/**"

permissions:
  contents: write

jobs:
  build-and-push:
    name: Build and push ${{ matrix.service }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [order-service, catalog-service, delivery-service, payment-service]
    steps:
      - uses: actions/checkout@v4
      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Compute short SHA
        id: tag
        run: echo "sha_short=sha-${GITHUB_SHA::8}" >> "$GITHUB_OUTPUT"
      - name: Build and push
        run: |
          docker build \
            -t preet2fun/${{ matrix.service }}:${{ steps.tag.outputs.sha_short }} \
            customer-app/services/${{ matrix.service }}/
          docker push preet2fun/${{ matrix.service }}:${{ steps.tag.outputs.sha_short }}

  update-image-tags:
    name: Bump image tags in values.yaml
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main
      - name: Install yq
        env:
          YQ_VERSION: v4.44.3
          YQ_SHA256: a2c097180dd884a8d50c956ee16a9cec070f30a7947cf4ebf87d5f36213e9ed7
        run: |
          wget -qO /tmp/yq "https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_amd64"
          echo "${YQ_SHA256}  /tmp/yq" | sha256sum -c -
          sudo install -m 0755 /tmp/yq /usr/local/bin/yq
      - name: Compute short SHA
        id: tag
        run: echo "sha_short=sha-${GITHUB_SHA::8}" >> "$GITHUB_OUTPUT"
      - name: Bump image tags
        run: |
          TAG="${{ steps.tag.outputs.sha_short }}"
          FILE=customer-app/infra/helm/customer-app/values.yaml
          yq -i ".orderService.image.tag = \"$TAG\"" "$FILE"
          yq -i ".catalogService.image.tag = \"$TAG\"" "$FILE"
          yq -i ".deliveryService.image.tag = \"$TAG\"" "$FILE"
          yq -i ".paymentService.image.tag = \"$TAG\"" "$FILE"
      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add customer-app/infra/helm/customer-app/values.yaml
          git commit -m "chore(customer-app): bump image tags to ${{ steps.tag.outputs.sha_short }} [skip ci]"
          git push
```

`[skip ci]` in the bot's own commit message is native GitHub Actions
behavior (also recognized as `[ci skip]`) — it prevents this commit from
re-triggering `ci-build.yml` (which has no path filter and would otherwise
rebuild all 8 platform-app + customer-app images pointlessly) or looping
`ci-docker-push.yml` itself.

- [ ] **Step 3: Verify the YAML is well-formed**

```bash
cd /home/motadata/itsm-cloudnative-demo-app
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-docker-push.yml'))" && echo "valid YAML"
```
Expected: `valid YAML`.

- [ ] **Step 4: Commit the workflow file**

```bash
git add .github/workflows/ci-docker-push.yml
git commit -m "ci(customer-app): real build+push+tag-bump pipeline on merge to main"
```
(Repo owner runs this, per root `CLAUDE.md` §13.)

- [ ] **Step 5: Push to main and watch it run**

This is the first real trigger of the new pipeline — needs an actual push
to `main` touching `customer-app/services/**`. If there's no pending
change to push yet, this step merges naturally into Task 4's live
verification (which makes exactly this kind of change). Skip re-triggering
it here in isolation; proceed to Task 4.

---

## Task 4: End-to-end verification (closes #51)

**Files:** none — this task is entirely verification against the live
pipeline. Update `customer-app/TODO.md` with the result as the deliverable.

- [ ] **Step 1: Make one real change and push it**

Pick any trivial, safe change to one customer-app service (e.g. a comment
addition) and have the repo owner commit + push it to `main`:
```bash
cd /home/motadata/itsm-cloudnative-demo-app
# (repo owner makes and commits a small real change to, e.g.,
#  customer-app/services/order-service/, then:)
git push origin main
```

- [ ] **Step 2: Watch the CI pipeline run**

```bash
gh run list --workflow=ci-docker-push.yml --limit=3
gh run watch
```
Expected: `build-and-push` (4 matrix jobs) then `update-image-tags` both
succeed.

- [ ] **Step 3: Confirm the images actually landed on Docker Hub**

```bash
gh run view --log | grep -A2 "docker push"
```
Expected: 4 successful push confirmations, one per service.

- [ ] **Step 4: Confirm values.yaml was bumped and ArgoCD synced**

On `kubernetes-master`:
```bash
cd /home/motadata/itsm-cloudnative-demo-app && git pull
grep -A1 "repository: order-service" customer-app/infra/helm/customer-app/values.yaml
kubectl get application customer-app -n argocd -o jsonpath='{.status.sync.status} {.status.health.status}'; echo
kubectl get pods -n customer-app-dev -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'
```
Expected: the new `sha-<8 chars>` tag visible in both `values.yaml` and the
actually-running pods' image references — proving the full loop (push →
build → push → tag-bump commit → ArgoCD sync → new pod) worked live, not
just that each stage ran in isolation.

- [ ] **Step 5: Update tracking**

Update `customer-app/TODO.md`'s Phase 8 section with this evidence (same
pattern as every prior phase — local, uncommitted, repo owner reviews and
commits). Do not move `#51` on the GitHub Project board — per established
policy, that's the repo owner's call each time.

- [ ] **Step 6: Stop here and check in**
Per root `CLAUDE.md` §11's "one roadmap task at a time" — Phase 8 ends
here. Don't start Phase 9, Phase 10, or any customer-app screen work
without the repo owner picking the next one.

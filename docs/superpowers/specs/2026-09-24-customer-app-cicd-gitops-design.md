# Customer App CI/CD + GitOps — Design

**GitHub:** [#51](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/51)
**Date:** 2026-09-24

## 1. Problem

`customer-app/TODO.md`'s Phase 8 asks for automated build+push+deploy on
merge to `main`. Investigation before this spec found the prerequisites
don't actually exist yet, for either app:

- `ci-build.yml` already builds (validates, doesn't push) Docker images for
  all 4 customer-app services on every push/PR — this part is done, out of
  scope here.
- `ci-docker-push.yml` is a stub. It triggers on a `v*`/`*/v*` git tag push
  and only echoes the tag — no `docker build`/`docker push` ever runs. Its
  own comments defer the real implementation to platform-app's "Phase 9"
  (a different, platform-app-scoped roadmap numbering — not to be confused
  with customer-app's Phase 8/9). No tag has ever been pushed in this
  repo's history (`git tag -l` is empty), so this path has never actually
  executed.
- `platform-app/infra/argocd/` contains only placeholder `.gitkeep` files.
  `platform-app/scripts/install-argocd.sh` is a 6-line stub. ArgoCD is not
  installed on the cluster — confirmed live 2026-09-24 (no `argocd`
  namespace, no ArgoCD pods). This matches `INFRA-INVENTORY.md`'s "Not
  deployed: ... ArgoCD" note, not root `CLAUDE.md`'s tech-stack table
  (which is stale on this point).

So this is real greenfield GitOps infrastructure for the whole repo, not a
customer-app-scoped extension of something already working.

**Scope for this spec: dev only.** `customer-app-qa` namespace does not
exist yet and there is no plan to stand it up right now. The chart's
`values-qa.yaml` overlay already exists and is left untouched; the ArgoCD
`apps/qa/` directory keeps its placeholder `.gitkeep` rather than getting a
real Application manifest. Nothing in this design deploys to qa.

## 2. Decisions (already made, carried from brainstorming)

- **Dev trigger:** push to `main` (continuous deploy), not git tags.
- **Image tag:** git SHA (`sha-<short-sha>`), not semantic version — no
  extra version-bump tooling needed.
- **Promotion model:** N/A for this phase (dev only).
- **Tag propagation:** the CI job itself edits
  `customer-app/infra/helm/customer-app/values.yaml` (bumping all 4
  `*.image.tag` fields) and commits+pushes that change back to `main` —
  no ArgoCD Image Updater component. Confirmed live 2026-09-24: `main` has
  no branch protection rule, so a direct push from the CI job's
  `GITHUB_TOKEN` will succeed.
- **ArgoCD install method:** official `argo/argo-cd` Helm chart (matches
  this repo's established pattern for every other infra component —
  Istio, the observability stack — rather than the raw `install.yaml`
  manifest), pinned to the real current version confirmed live 2026-09-24:
  **10.9.2** (ArgoCD app v3.5.3).
- **ArgoCD footprint:** "core" install — `dex` and `notifications` off
  (both have real, confirmed `enabled: false` top-level keys in this chart
  version), `applicationSet` scaled to zero replicas (confirmed live this
  chart version has **no** `applicationSet.enabled` toggle — the only way
  to disable it is `applicationSet.replicas: 0`, which still creates the
  Deployment/Service objects but runs no pods). `redis` stays enabled
  (chart-internal cache, required for core operation, `redis.enabled` is a
  real key defaulting `true`).

## 3. Capacity

Fresh reading, 2026-09-24 (`kubectl top nodes` / `free -mh` on
`kubernetes-master`): all three nodes sitting at ~56% memory used, ~1.5–
1.7Gi available each — tighter than `INFRA-INVENTORY.md`'s original
~5GiB-on-the-workers estimate (unsurprising: the full observability stack
went in since that snapshot). ArgoCD core-mode sized lean below; this adds
real load on top of an already-flagged capacity risk (root `CLAUDE.md`
§4 / `INFRA-INVENTORY.md` §1) — not a blocker on its own, but strengthens
the case for doing Phase 9 (capacity resolution) soon after this.

| Component | CPU req | CPU lim | Mem req | Mem lim |
|---|---|---|---|---|
| argocd-server | 64m | 200m | 64Mi | 128Mi |
| argocd-repo-server | 100m | 300m | 128Mi | 256Mi |
| argocd-application-controller | 100m | 300m | 128Mi | 256Mi |
| argocd-redis | 50m | 100m | 64Mi | 128Mi |
| **Total (applicationset: 0 replicas, no cost)** | **~314m** | **~900m** | **~384Mi** | **~768Mi** |

This chart sets no default resources on any component (`resources: {}`
everywhere) — all four rows above are explicit overrides, not chart
defaults, consistent with this repo's pattern of never deploying anything
without explicit requests/limits.

## 4. Components

### 4.1 ArgoCD install

- New namespace: `argocd`.
- `platform-app/infra/argocd/install/values.yaml` (new file, replaces the
  `.gitkeep`) — chart version 10.9.2, the resource table above, and:
  ```yaml
  dex:
    enabled: false
  notifications:
    enabled: false
  applicationSet:
    replicas: 0
  ```
- `platform-app/scripts/install-argocd.sh` — real implementation replacing
  the stub, matching `install-observability-stack.sh`'s pattern: `helm
  repo add`/`update`, `helm upgrade --install argocd argo/argo-cd --version
  10.9.2 -n argocd --create-namespace -f values.yaml`.
- **Open item, resolved at execution time, not guessed now:** the
  `Application` CRD's exact `apiVersion` (expected `argoproj.io/v1alpha1`,
  stable across ArgoCD versions for years, but root `CLAUDE.md` §2/§13
  forbid writing K8s `apiVersion` values from memory) — cannot be verified
  against the live cluster before ArgoCD itself is installed. The
  implementation plan checks it live via `kubectl api-resources | grep
  argoproj` immediately after install, before writing the `Application`
  manifest.

### 4.2 CI: real `ci-docker-push.yml`

Replaces the stub. Trigger: `push: branches: [main]`. Two jobs:

1. `build-and-push` — real GitHub Actions `strategy.matrix.service` over
   the 4 customer-app services (a true matrix, unlike `ci-build.yml`'s 4
   hand-duplicated jobs — cleaner for 4 near-identical steps, and matches
   the "per-service matrix" language customer-app/TODO.md itself uses).
   Each: checkout, Docker Hub login (reusing the existing
   `secrets.DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` references already in
   the stub — **not yet configured as repo secrets, confirmed via `gh
   secret list` returning empty; the user adds these themselves before
   this pipeline can push anything real**), build+push
   `preet2fun/<service>:sha-<short-sha>`.
2. `update-image-tags` (`needs: build-and-push`, runs once after all 4
   succeed — not per-matrix-job, to avoid 4 racing commits) — checkout,
   `yq` (or `sed`) bump of all 4 `*.image.tag` fields in
   `customer-app/infra/helm/customer-app/values.yaml` to the same SHA tag,
   commit as a bot identity, push to `main`. Needs
   `permissions: contents: write` in the workflow.

### 4.3 ArgoCD Application (dev only)

`platform-app/infra/argocd/apps/dev/customer-app.yaml` — points at
`customer-app/infra/helm/customer-app/` on `main`, `values.yaml` only (no
qa overlay), `syncPolicy.automated: {prune: true, selfHeal: true}` so a
commit from 4.2's `update-image-tags` job auto-syncs without manual
intervention. Destination namespace `customer-app-dev` (already exists,
confirmed live this session).

`platform-app/infra/argocd/apps/qa/.gitkeep` stays as-is — no manifest
added, no qa Application created, per the dev-only scope in §1.

## 5. Verification

Live, end-to-end, on the real cluster:

1. Make one real code change to a customer-app service, push to `main`.
2. Watch `build-and-push` build+push a real `sha-<short-sha>` image.
3. Watch `update-image-tags` bump `values.yaml` and push.
4. Watch ArgoCD (UI or `kubectl get application customer-app -n argocd -o
   yaml`) pick up the new commit and sync.
5. Confirm the running pod's image tag matches the new SHA
   (`kubectl get pods -n customer-app-dev -o jsonpath='{...image}'`).
6. Update `customer-app/TODO.md`'s Phase 8 section with this evidence, same
   pattern as every prior phase.

## 6. Explicitly out of scope

- `customer-app-qa` namespace creation, qa ArgoCD Application, qa CI
  triggers — no plan for these right now, per explicit instruction.
- ArgoCD Image Updater, notifications, SSO/Dex, ApplicationSet-based
  templating — none needed for a single dev Application.
- Rewriting `ci-docker-push.yml`'s trigger away from `push: branches:
  [main]` toward tag-based release gating — deferred; nothing in this
  repo's history has ever used the tag convention, and the user's own
  wording in customer-app/TODO.md matches merge-to-main.
- Touching platform-app's own CI/CD (`ci-build.yml`'s existing platform-app
  jobs, or extending `ci-docker-push.yml` to cover platform-app services)
  — ArgoCD and the workflow file are shared infra, but wiring
  platform-app's own services into this pipeline is platform-app's own
  roadmap item, not customer-app's #51.

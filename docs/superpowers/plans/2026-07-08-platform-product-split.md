# Platform / Product Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formalize the repo's Platform vs Product taxonomy: add a `Track` field to the GitHub Project, retag/split issues accordingly, consolidate the duplicated doc trees into `docs/platform/` + `docs/product/`, and update CLAUDE.md so it reflects the new structure.

**Architecture:** No code/infra changes. Three surfaces change: (1) GitHub Project #1 custom field + issue metadata via `gh` CLI, (2) repo `docs/` file tree via `git mv`/`rm` plus fixing every cross-reference to moved paths, (3) `.claude/CLAUDE.md` phase/sprint tables and doc-path rule.

**Tech Stack:** `gh` CLI 2.95+ (Projects v2 GraphQL-backed commands), bash, git.

## Global Constraints

- Full design/rationale: `docs/superpowers/specs/2026-07-08-platform-product-split-design.md` — read it if a task's reasoning is unclear.
- Repo root for all commands: `/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app`
- GitHub owner: `Preet2fun`, repo: `Preet2fun/itsm-cloudnative-demo-app`, Project number: `1`, Project ID: `PVT_kwHOAROfoc4BbAcI`
- `gh project`/`gh issue` mutations (Task 1-4) are pre-authorized by the user's approval of the design spec — run them directly, no extra confirmation needed per task.
- Local git commits/pushes are NOT run automatically in this plan — per standing project convention, stage changes and hand the exact `git add`/`commit`/`push` commands to the user to run themselves. Do not run `git commit` or `git push`.
- `scripts/populate-roadmap.sh` and `scripts/setup-github-project.sh` Track-automation logic is explicitly OUT of scope for this plan (deferred by user decision) — do not modify Track-setting logic in these scripts. The one stale doc-path string fix in `populate-roadmap.sh` (Task 5) IS in scope since it's a mechanical consequence of the file move, not Track automation.
- macOS (BSD sed) is the local shell — use `sed -i ''` (with the empty string arg), not GNU `sed -i` syntax.
- Scratchpad directory for all temporary files in this plan: `/private/tmp/claude-501/-Users-pratikpatel-Documents-study-Final-Study-Cloud-Architecture-ITSM-CloudNative-Demo-App-itsm-cloudnative-demo-app/4f855208-7f7e-467a-97b3-a6684f2b088e/scratchpad` (referred to below as `$SCRATCH`) — never use bare `/tmp/`.
- Tasks 1-4 may run as separate subagents with no shared shell state. Task 1 persists the field/option IDs to `$SCRATCH/track-field-ids.env`; every later task that needs them sources that file first (shown explicitly in each task's steps) rather than assuming a shell variable survived from another task.

---

### Task 1: Create the `Track` custom field on the GitHub Project

**Files:** none (GitHub API only)

**Interfaces:**
- Produces: a `Track` SINGLE_SELECT field on Project `PVT_kwHOAROfoc4BbAcI` with options `Platform` and `Product`; their field-id/option-ids persisted to `$SCRATCH/track-field-ids.env` for Tasks 2-4 to source.

- [ ] **Step 1: Create the field**

```bash
gh project field-create 1 --owner Preet2fun --name "Track" --data-type "SINGLE_SELECT" --single-select-options "Platform,Product"
```

- [ ] **Step 2: Verify, capture field-id/option-ids, and persist them for later tasks**

```bash
SCRATCH="/private/tmp/claude-501/-Users-pratikpatel-Documents-study-Final-Study-Cloud-Architecture-ITSM-CloudNative-Demo-App-itsm-cloudnative-demo-app/4f855208-7f7e-467a-97b3-a6684f2b088e/scratchpad"
mkdir -p "$SCRATCH"

gh project field-list 1 --owner Preet2fun --format json | python3 -c "
import json,sys
d = json.load(sys.stdin)
for f in d['fields']:
    if f['name'] == 'Track':
        print(f'export TRACK_FIELD_ID={f[\"id\"]}')
        for o in f['options']:
            key = 'PLATFORM_OPTION_ID' if o['name'] == 'Platform' else 'PRODUCT_OPTION_ID'
            print(f'export {key}={o[\"id\"]}')
" > "$SCRATCH/track-field-ids.env"

cat "$SCRATCH/track-field-ids.env"
```

Expected output: three `export ...` lines — `export TRACK_FIELD_ID=...`, `export PLATFORM_OPTION_ID=...`, `export PRODUCT_OPTION_ID=...` — and the same three lines written to `$SCRATCH/track-field-ids.env`. Using `export` (not plain assignment) matters: later tasks `source` this file and then invoke `python3` as a subprocess, which only sees these values via `os.environ` if they were exported. Every later task sources this file with `source "$SCRATCH/track-field-ids.env"` rather than assuming a shell variable survived from this task.

---

### Task 2: Tag all existing issues with their Track

**Files:** none (GitHub API only)

**Interfaces:**
- Consumes: `$SCRATCH/track-field-ids.env` from Task 1 (`TRACK_FIELD_ID`, `PLATFORM_OPTION_ID`, `PRODUCT_OPTION_ID`).
- Produces: every issue in the table below has `Track` set on the Project board.

Mapping (excludes #14 and #21 — handled by Tasks 3 and 4):

| Issue | Track |
|---|---|
| #2 Phase 1 Repo Scaffold | Platform |
| #3 Phase 2 Database Layer | Platform |
| #4 Phase 3 User Service | Platform |
| #6 Phase 5 Helm/K8s/Dockerfiles | Platform |
| #8 Phase 6 Istio+OPA | Platform |
| #19 Phase 8 Observability | Platform |
| #20 Phase 9 CI/CD+GitOps | Platform |
| #22 OSS/Community | Platform |
| #5 Phase 4 Asset+Incident Services | Product |
| #7 Sprint 0 UI Foundation | Product |
| #9 Sprint 1 Authentication | Product |
| #10 Sprint 2 App Shell | Product |
| #11 Sprint 3 Asset Module | Product |
| #12 Sprint 4 Incident Module | Product |
| #13 Sprint 5 Ops Dashboard | Product |
| #15 Sprint 6 AIOps Console | Product |
| #16 Sprint 7 End-user Portal | Product |
| #17 Sprints 8-10 CMDB/Monitoring/Admin | Product |
| #18 Sprint 11 Real API wiring | Product |

- [ ] **Step 1: Fetch project item IDs for every issue**

```bash
SCRATCH="/private/tmp/claude-501/-Users-pratikpatel-Documents-study-Final-Study-Cloud-Architecture-ITSM-CloudNative-Demo-App-itsm-cloudnative-demo-app/4f855208-7f7e-467a-97b3-a6684f2b088e/scratchpad"
gh project item-list 1 --owner Preet2fun --format json --limit 100 > "$SCRATCH/project-items.json"
python3 -c "
import json
d = json.load(open('$SCRATCH/project-items.json'))
for item in d['items']:
    c = item.get('content', {})
    if 'number' in c:
        print(c['number'], item['id'])
" | sort -n
```

Expected: one line per issue, `<issue-number> <PVTI_... item-id>`. Confirm all 21 issue numbers (#2-#22) appear.

- [ ] **Step 2: Set Track on every issue in the mapping table**

```bash
export SCRATCH="/private/tmp/claude-501/-Users-pratikpatel-Documents-study-Final-Study-Cloud-Architecture-ITSM-CloudNative-Demo-App-itsm-cloudnative-demo-app/4f855208-7f7e-467a-97b3-a6684f2b088e/scratchpad"
source "$SCRATCH/track-field-ids.env"

cat > "$SCRATCH/track-map.py" <<'PYEOF'
import json, os, subprocess

PROJECT_ID = "PVT_kwHOAROfoc4BbAcI"
TRACK_FIELD_ID = os.environ["TRACK_FIELD_ID"]
PLATFORM_OPTION_ID = os.environ["PLATFORM_OPTION_ID"]
PRODUCT_OPTION_ID = os.environ["PRODUCT_OPTION_ID"]
SCRATCH = os.environ["SCRATCH"]

TRACK_MAP = {
    2: "Platform", 3: "Platform", 4: "Platform", 6: "Platform", 8: "Platform",
    19: "Platform", 20: "Platform", 22: "Platform",
    5: "Product", 7: "Product", 9: "Product", 10: "Product", 11: "Product",
    12: "Product", 13: "Product", 15: "Product", 16: "Product", 17: "Product",
    18: "Product",
}

items = json.load(open(f"{SCRATCH}/project-items.json"))['items']
number_to_item_id = {i['content']['number']: i['id'] for i in items if 'number' in i.get('content', {})}

for issue_number, track in TRACK_MAP.items():
    item_id = number_to_item_id[issue_number]
    option_id = PLATFORM_OPTION_ID if track == "Platform" else PRODUCT_OPTION_ID
    print(f"Setting #{issue_number} -> {track}")
    subprocess.run([
        "gh", "project", "item-edit",
        "--id", item_id,
        "--project-id", PROJECT_ID,
        "--field-id", TRACK_FIELD_ID,
        "--single-select-option-id", option_id,
    ], check=True)
PYEOF
python3 "$SCRATCH/track-map.py"
```

- [ ] **Step 3: Verify**

```bash
gh project item-list 1 --owner Preet2fun --format json --limit 100 | python3 -c "
import json, sys
d = json.load(sys.stdin)
for item in sorted(d['items'], key=lambda i: i.get('content', {}).get('number', 0)):
    c = item.get('content', {})
    if 'number' in c:
        track = item.get('track', item.get('Track', 'MISSING'))
        print(c['number'], c.get('title', '')[:50], track)
"
```

Expected: all 18 mapped issues show their correct Track value (field name in JSON output may be `track` or `Track` depending on `gh` version — inspect the raw JSON with `python3 -m json.tool` first if the field isn't found under either key).

---

### Task 3: Split issue #14 into "AI Platform" and "AI Product Features"

**Files:** none (GitHub API only)

**Interfaces:**
- Consumes: `$TRACK_FIELD_ID`, `$PLATFORM_OPTION_ID`, `$PRODUCT_OPTION_ID` from Task 1.
- Produces: two new open issues, both added to Project #1 and tagged with Track; original #14 closed with a comment linking to both.

- [ ] **Step 1: Create the "AI Platform" issue**

```bash
gh issue create -R Preet2fun/itsm-cloudnative-demo-app \
  --title "[Platform] AI Platform — vector DB + LLM provider + MCP infra" \
  --label "roadmap,later,infra,ai" \
  --body "$(cat <<'EOF'
## Summary
Platform-track AI infrastructure — the reusable substrate that AI *features*
(tracked separately in \"[Product] AI Product Features\") build on top of.

## Deliverables
- [ ] pgvector extension enabled on the tenant schemas that need it
- [ ] Vector DB / embedding storage design (which tables, which schema)
- [ ] LLM provider integration layer (provider TBD — abstraction so the
      provider can be swapped)
- [ ] Embedding pipeline (what gets embedded, when, how it's kept in sync)
- [ ] MCP server infra (tools exposed to the AI layer)

## Multi-tenant
Embeddings and vector search must respect schema-per-tenant isolation —
no cross-tenant vector search leakage.

## Split from
This issue's Product-facing counterpart is "[Product] AI Product Features"
(created alongside this issue). Originally both were bundled in #14, which
is now closed as superseded.

## Ref
docs/superpowers/specs/2026-07-08-platform-product-split-design.md
EOF
)"
```

Note the returned issue number/URL — needed for the next steps and for closing #14.

- [ ] **Step 2: Create the "AI Product Features" issue**

```bash
gh issue create -R Preet2fun/itsm-cloudnative-demo-app \
  --title "[Product] AI Product Features — triage, runbook, KB auto-draft, semantic search" \
  --label "roadmap,later,ai,ui" \
  --body "$(cat <<'EOF'
## Summary
Product-track AI features that consume the Platform AI infrastructure
(tracked separately in "[Platform] AI Platform"). This issue is an umbrella
that cross-links the sprints where each feature's UI/UX actually lives,
rather than duplicating their checklists.

## Deliverables
- [ ] Incident triage — priority suggestion (surfaces in Sprint 4 Incident Module)
- [ ] Resolution runbook generation (surfaces in Sprint 4 Incident Module)
- [ ] AIOps alert correlation logic (surfaces in Sprint 6 AIOps Event Console)
- [ ] Auto-draft KB article generation (surfaces in Sprint 9 Monitoring+KB+Admin)
- [ ] Semantic search UX over pgvector (surfaces in Sprint 8 CMDB+Service Map)
- [ ] Global Copilot business logic (surfaces in Sprint 10 Global Copilot)

## Cross-links
- Sprint 4: #12
- Sprint 6: #15
- Sprint 7: #16
- Sprints 8-10: #17
- Sprint 9 KB: #17
- Sprint 10 Copilot: tracked under Sprints 8-10 (#17) until its own sprint issue exists

## Depends on
"[Platform] AI Platform" (created alongside this issue) must be far enough
along to provide vector search + LLM access before these features can be
implemented end-to-end.

## Split from
Originally bundled in #14, which is now closed as superseded.

## Ref
docs/superpowers/specs/2026-07-08-platform-product-split-design.md
EOF
)"
```

- [ ] **Step 3: Add both new issues to the Project and set their Track**

```bash
SCRATCH="/private/tmp/claude-501/-Users-pratikpatel-Documents-study-Final-Study-Cloud-Architecture-ITSM-CloudNative-Demo-App-itsm-cloudnative-demo-app/4f855208-7f7e-467a-97b3-a6684f2b088e/scratchpad"
source "$SCRATCH/track-field-ids.env"

# Replace <AI_PLATFORM_NUM> and <AI_PRODUCT_NUM> with the numbers from Steps 1-2
gh project item-add 1 --owner Preet2fun --url https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/<AI_PLATFORM_NUM>
gh project item-add 1 --owner Preet2fun --url https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/<AI_PRODUCT_NUM>

gh project item-list 1 --owner Preet2fun --format json --limit 100 > "$SCRATCH/project-items-2.json"
python3 -c "
import json
d = json.load(open('$SCRATCH/project-items-2.json'))
for item in d['items']:
    c = item.get('content', {})
    if c.get('number') in (<AI_PLATFORM_NUM>, <AI_PRODUCT_NUM>):
        print(c['number'], item['id'])
"
# Use the two printed item-ids below
gh project item-edit --id <AI_PLATFORM_ITEM_ID> --project-id PVT_kwHOAROfoc4BbAcI --field-id "$TRACK_FIELD_ID" --single-select-option-id "$PLATFORM_OPTION_ID"
gh project item-edit --id <AI_PRODUCT_ITEM_ID> --project-id PVT_kwHOAROfoc4BbAcI --field-id "$TRACK_FIELD_ID" --single-select-option-id "$PRODUCT_OPTION_ID"
```

- [ ] **Step 4: Close #14 with a comment linking to both new issues**

```bash
gh issue comment 14 -R Preet2fun/itsm-cloudnative-demo-app --body "Superseded — split into Platform and Product tracks per docs/superpowers/specs/2026-07-08-platform-product-split-design.md: #<AI_PLATFORM_NUM> (AI Platform) and #<AI_PRODUCT_NUM> (AI Product Features)."
gh issue close 14 -R Preet2fun/itsm-cloudnative-demo-app
```

- [ ] **Step 5: Verify**

```bash
gh issue view 14 -R Preet2fun/itsm-cloudnative-demo-app --json state,comments -q '.state'
# Expected: CLOSED
gh issue list -R Preet2fun/itsm-cloudnative-demo-app --search "AI Platform" --json number,title,state
gh issue list -R Preet2fun/itsm-cloudnative-demo-app --search "AI Product Features" --json number,title,state
```

---

### Task 4: Split issue #21 into a Platform data-layer issue + retitled Product issue

**Files:** none (GitHub API only)

**Interfaces:**
- Consumes: `$TRACK_FIELD_ID`, `$PLATFORM_OPTION_ID`, `$PRODUCT_OPTION_ID` from Task 1.
- Produces: one new Platform issue; #21 retitled/retagged to Product-only scope.

- [ ] **Step 1: Read #21's current body (so nothing gets lost in the split)**

```bash
gh issue view 21 -R Preet2fun/itsm-cloudnative-demo-app --json body -q '.body'
```

- [ ] **Step 2: Create the new Platform issue**

```bash
gh issue create -R Preet2fun/itsm-cloudnative-demo-app \
  --title "[Platform] Multi-Tenant Data Layer Enhancements" \
  --label "roadmap,later,multi-tenant,infra" \
  --body "$(cat <<'EOF'
## Summary
Platform-track backend/data-layer work for multi-tenancy: schema-per-tenant
scaling and tenant provisioning automation. Split from #21, whose remaining
scope (tenant management UI + per-tenant settings) stays Product-tracked.

## Deliverables
- [ ] Schema-per-tenant scaling review (connection pooling, migration
      execution across N tenant schemas, `search_path` performance)
- [ ] Tenant provisioning automation (script/API to create a new tenant
      schema + registry row, replacing any manual SQL steps)

## Split from
#21 — original issue retitled to keep only its Product-facing UI scope.

## Ref
docs/superpowers/specs/2026-07-08-platform-product-split-design.md
EOF
)"
```

Note the returned issue number (referred to below as `<TENANT_PLATFORM_NUM>`).

- [ ] **Step 3: Retitle and re-scope #21 to Product-only**

```bash
gh issue edit 21 -R Preet2fun/itsm-cloudnative-demo-app \
  --title "[Product] Tenant Management UI + Per-Tenant Settings"

gh issue comment 21 -R Preet2fun/itsm-cloudnative-demo-app --body "Re-scoped to Product-track UI only per docs/superpowers/specs/2026-07-08-platform-product-split-design.md. Backend/data-layer scope (schema scaling, tenant provisioning automation) moved to #<TENANT_PLATFORM_NUM> (Platform track)."
```

- [ ] **Step 4: Add the new issue to the Project and set Track on both**

```bash
SCRATCH="/private/tmp/claude-501/-Users-pratikpatel-Documents-study-Final-Study-Cloud-Architecture-ITSM-CloudNative-Demo-App-itsm-cloudnative-demo-app/4f855208-7f7e-467a-97b3-a6684f2b088e/scratchpad"
source "$SCRATCH/track-field-ids.env"

gh project item-add 1 --owner Preet2fun --url https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/<TENANT_PLATFORM_NUM>

gh project item-list 1 --owner Preet2fun --format json --limit 100 > "$SCRATCH/project-items-3.json"
python3 -c "
import json
d = json.load(open('$SCRATCH/project-items-3.json'))
for item in d['items']:
    c = item.get('content', {})
    if c.get('number') in (21, <TENANT_PLATFORM_NUM>):
        print(c['number'], item['id'])
"
gh project item-edit --id <TENANT_PLATFORM_ITEM_ID> --project-id PVT_kwHOAROfoc4BbAcI --field-id "$TRACK_FIELD_ID" --single-select-option-id "$PLATFORM_OPTION_ID"
gh project item-edit --id <ISSUE_21_ITEM_ID> --project-id PVT_kwHOAROfoc4BbAcI --field-id "$TRACK_FIELD_ID" --single-select-option-id "$PRODUCT_OPTION_ID"
```

- [ ] **Step 5: Verify**

```bash
gh issue view 21 -R Preet2fun/itsm-cloudnative-demo-app --json title,state -q '.title'
# Expected: [Product] Tenant Management UI + Per-Tenant Settings
gh issue list -R Preet2fun/itsm-cloudnative-demo-app --search "Multi-Tenant Data Layer Enhancements" --json number,title,state
```

---

### Task 5: Consolidate docs into `docs/platform/` and `docs/product/`

**Files:**
- Create: `docs/platform/` tree (see Step 1)
- Create: `docs/product/ai-features/`, `docs/product/deployment-guides/`
- Modify: `README.md`, `CONTRIBUTING.md`, `SYSTEM_PROMPT.md`, `docs/CHANGELOG.md`, `docs/00_Overview.md`, `services/asset-service/README.md`, `services/ai-service/README.md`, `services/incident-service/README.md`, `services/user-service/README.md`, `services/notification-service/README.md`, `scripts/populate-roadmap.sh`
- Delete: `docs/architecture/`, `docs/02_App_Architecture/`, `docs/01_OpenTelemetry/`, `docs/04_K8s_Concepts/`, `docs/03_Deployment/`, `docs/05_AI_Features/`, `docs/06_Phase_Deployment_Guides/`, `docs/Helm_Microservice_Deployment_Guide.md` (all moved, not duplicated)

**Interfaces:** none (docs only, no code interfaces)

- [ ] **Step 1: Create target directories**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
mkdir -p docs/platform/observability docs/platform/k8s-concepts docs/platform/deployment docs/platform/deployment-guides
mkdir -p docs/product/ai-features docs/product/deployment-guides
```

- [ ] **Step 2: Move the winning versions of duplicated files (docs/architecture/ beats docs/02_App_Architecture/ — it has more content: 261 vs 184 lines for Service Design, 269 vs 237 for Multi-Tenancy)**

```bash
git mv docs/architecture/01_System_Overview.md docs/platform/01_System_Overview.md
git mv docs/architecture/02_Service_Design.md docs/platform/02_Service_Design.md
git mv docs/architecture/03_Multi_Tenancy.md docs/platform/03_Multi_Tenancy.md
git mv docs/architecture/04_Security_Model.md docs/platform/04_Security_Model.md
git mv docs/architecture/05_Data_Model.md docs/platform/05_Data_Model.md

# Unique content with no docs/architecture/ counterpart — renumbered to continue the platform sequence
git mv docs/02_App_Architecture/02_Data_Flow.md docs/platform/06_Data_Flow.md
git mv docs/02_App_Architecture/04_AI_Architecture.md docs/platform/07_AI_Platform_Architecture.md

# Delete the smaller superseded duplicates
git rm docs/02_App_Architecture/01_Service_Design.md
git rm docs/02_App_Architecture/03_Multi_Tenancy.md

rmdir docs/architecture docs/02_App_Architecture
```

- [ ] **Step 3: Move observability, k8s-concepts, deployment, and AI-feature stub folders (contents unchanged, folder renamed)**

```bash
git mv docs/01_OpenTelemetry/01_Concepts.md docs/platform/observability/01_Concepts.md
git mv docs/01_OpenTelemetry/02_OTel_Collector.md docs/platform/observability/02_OTel_Collector.md
git mv docs/01_OpenTelemetry/03_Instrumentation.md docs/platform/observability/03_Instrumentation.md
git mv docs/01_OpenTelemetry/04_Signal_Backends.md docs/platform/observability/04_Signal_Backends.md
rm -f docs/01_OpenTelemetry/.gitkeep
rmdir docs/01_OpenTelemetry

git mv docs/04_K8s_Concepts/01_HPA.md docs/platform/k8s-concepts/01_HPA.md
git mv docs/04_K8s_Concepts/02_Istio.md docs/platform/k8s-concepts/02_Istio.md
git mv docs/04_K8s_Concepts/03_Storage.md docs/platform/k8s-concepts/03_Storage.md
git mv docs/04_K8s_Concepts/04_OPA.md docs/platform/k8s-concepts/04_OPA.md
rmdir docs/04_K8s_Concepts

git mv docs/03_Deployment/01_K8s_Deployment.md docs/platform/deployment/01_K8s_Deployment.md
git mv docs/03_Deployment/02_GitOps_Runbook.md docs/platform/deployment/02_GitOps_Runbook.md
git mv docs/03_Deployment/03_Environment_Guide.md docs/platform/deployment/03_Environment_Guide.md
rmdir docs/03_Deployment

git mv docs/Helm_Microservice_Deployment_Guide.md docs/platform/Helm_Microservice_Deployment_Guide.md

git mv docs/05_AI_Features/01_Incident_Triage.md docs/product/ai-features/01_Incident_Triage.md
git mv docs/05_AI_Features/02_Anomaly_Detection.md docs/product/ai-features/02_Anomaly_Detection.md
git mv docs/05_AI_Features/03_Intelligent_Search.md docs/product/ai-features/03_Intelligent_Search.md
git mv docs/05_AI_Features/04_AI_Chatbot.md docs/product/ai-features/04_AI_Chatbot.md
rm -f docs/05_AI_Features/.gitkeep
rmdir docs/05_AI_Features
```

- [ ] **Step 4: Move the Phase 1-6 deployment guides (Platform track) and add a Product deployment-guides placeholder**

```bash
git mv "docs/06_Phase_Deployment_Guides/Phase_01_Repo_Scaffold.md" docs/platform/deployment-guides/Phase_01_Repo_Scaffold.md
git mv "docs/06_Phase_Deployment_Guides/Phase_02_Database.md" docs/platform/deployment-guides/Phase_02_Database.md
git mv "docs/06_Phase_Deployment_Guides/Phase_03_User_Service.md" docs/platform/deployment-guides/Phase_03_User_Service.md
git mv "docs/06_Phase_Deployment_Guides/Phase_04_Asset_Incident_Services.md" docs/platform/deployment-guides/Phase_04_Asset_Incident_Services.md
git mv "docs/06_Phase_Deployment_Guides/Phase_05_Frontend_NextJS.md" docs/platform/deployment-guides/Phase_05_Frontend_NextJS.md
git mv "docs/06_Phase_Deployment_Guides/Phase_06_Istio_OPA.md" docs/platform/deployment-guides/Phase_06_Istio_OPA.md
git mv "docs/06_Phase_Deployment_Guides/README.md" docs/platform/deployment-guides/README.md
rmdir docs/06_Phase_Deployment_Guides
```

```bash
cat > docs/product/deployment-guides/README.md <<'EOF'
# Product Sprint Deployment Guides

Deployment guides for Product-track sprints that require a K8s deployment
step (frontend image builds, Helm value changes for `frontend`/`asset-service`/
`incident-service`) go here, named `Sprint_0X_<Name>.md`.

See `docs/platform/deployment-guides/` for Platform-track phase guides.
EOF
```

- [ ] **Step 5: Fix cross-references in files outside docs/ that link to the moved paths**

```bash
FILES_TO_FIX="README.md CONTRIBUTING.md SYSTEM_PROMPT.md docs/CHANGELOG.md services/asset-service/README.md services/ai-service/README.md services/incident-service/README.md services/user-service/README.md services/notification-service/README.md scripts/populate-roadmap.sh"

for f in $FILES_TO_FIX; do
  sed -i '' \
    -e 's#docs/architecture/#docs/platform/#g' \
    -e 's#docs/01_OpenTelemetry/#docs/platform/observability/#g' \
    -e 's#docs/04_K8s_Concepts/#docs/platform/k8s-concepts/#g' \
    -e 's#docs/03_Deployment/#docs/platform/deployment/#g' \
    -e 's#docs/05_AI_Features/#docs/product/ai-features/#g' \
    -e 's#docs/06_Phase_Deployment_Guides/#docs/platform/deployment-guides/#g' \
    -e 's#docs/02_App_Architecture/01_Service_Design\.md#docs/platform/02_Service_Design.md#g' \
    -e 's#docs/02_App_Architecture/03_Multi_Tenancy\.md#docs/platform/03_Multi_Tenancy.md#g' \
    -e 's#docs/02_App_Architecture/02_Data_Flow\.md#docs/platform/06_Data_Flow.md#g' \
    -e 's#docs/02_App_Architecture/04_AI_Architecture\.md#docs/platform/07_AI_Platform_Architecture.md#g' \
    "$f"
done
```

- [ ] **Step 6: Fix `docs/00_Overview.md`, which uses relative (non-`docs/`-prefixed) links**

```bash
sed -i '' 's#architecture/#platform/#g' docs/00_Overview.md
```

- [ ] **Step 7: Verify no stale references remain and the new tree is complete**

```bash
grep -rn "docs/architecture/\|docs/02_App_Architecture/\|docs/01_OpenTelemetry/\|docs/04_K8s_Concepts/\|docs/03_Deployment/\|docs/05_AI_Features/\|docs/06_Phase_Deployment_Guides/" \
  README.md CONTRIBUTING.md SYSTEM_PROMPT.md docs/CHANGELOG.md docs/00_Overview.md \
  services/*/README.md scripts/populate-roadmap.sh 2>&1
# Expected: no output (empty)

find docs/architecture docs/02_App_Architecture docs/01_OpenTelemetry docs/04_K8s_Concepts docs/03_Deployment docs/05_AI_Features docs/06_Phase_Deployment_Guides 2>&1
# Expected: "No such file or directory" for all seven — confirms old folders are gone

find docs/platform docs/product -type f | sort
# Expected: 23 files under docs/platform/ (7 top-level numbered + 4 observability + 4 k8s-concepts + 3 deployment + 1 Helm guide + 6 deployment-guides incl. README) and 8 under docs/product/ (3 existing + 4 ai-features + 1 deployment-guides README)
```

- [ ] **Step 8: Stage changes and hand off to the user for commit (do NOT commit yourself)**

```bash
git add -A docs/ README.md CONTRIBUTING.md SYSTEM_PROMPT.md services/*/README.md scripts/populate-roadmap.sh
git status --short
```

Show the user the `git status --short` output and this commit command for them to run:
```bash
git commit -m "docs: consolidate doc tree into docs/platform/ + docs/product/, fix cross-references"
git push
```

---

### Task 6: Update CLAUDE.md with Track column, P-Phase renumbering, and new doc paths

**Files:**
- Modify: `.claude/CLAUDE.md`

**Interfaces:** none

- [ ] **Step 1: Replace the "Backend & Infrastructure Phases" table with a Platform Track table**

Find this block in `.claude/CLAUDE.md`:
```markdown
#### Backend & Infrastructure Phases
| Phase | Status |
|---|---|
| Phase 1 — Repo Scaffold | ✅ Complete |
| Phase 2 — Database Layer | ✅ Complete |
| Phase 3 — User Service (Go) | ✅ Complete |
| Phase 4 — Asset & Incident Services (Python) | ✅ Complete |
| Phase 5 — Helm Charts + K8s Manifests + Dockerfiles | ✅ Complete |
| Phase 6 — Istio + OPA | ✅ Complete |
| Phase 7 — AI Features | 🔲 Pending |
| Phase 8 — Observability | 🔲 Pending |
| Phase 9 — CI/CD & GitOps | 🔲 Pending — includes Helm chart split (see note below) |
```

Replace with:
```markdown
#### Platform Track (P-Phase N)
Infra any product could reuse: K8s/Helm delivery, service mesh, authz, observability, CI/CD, the Identity Engine, AI infra, notification delivery. Full taxonomy: `docs/superpowers/specs/2026-07-08-platform-product-split-design.md`.
| Phase | Status |
|---|---|
| P-Phase 1 — Repo Scaffold | ✅ Complete |
| P-Phase 2 — Database Layer | ✅ Complete |
| P-Phase 3 — Identity Engine (User Service backend: JWT/JWKS/tenant registry) | ✅ Complete |
| P-Phase 4 — Helm Charts + K8s Manifests + Dockerfiles | ✅ Complete |
| P-Phase 5 — Istio + OPA | ✅ Complete — dev-cluster validation in progress as of 2026-07-08, see `docs/platform/deployment-guides/Phase_06_Istio_OPA.md` |
| P-Phase 6 — Observability | 🔲 Pending |
| P-Phase 7 — CI/CD & GitOps | 🔲 Pending — includes Helm chart split (see note below) |
| P-Phase 8 — AI Platform (vector DB, LLM provider integration, MCP servers) | 🔲 Pending |
| P-Phase 9 — Multi-Tenant Data Layer Enhancements (schema scaling, tenant provisioning automation) | 🔲 Pending |
```

- [ ] **Step 2: Replace the "Synap UI Sprints" table with a Product Track table**

Find this block:
```markdown
#### Synap UI Sprints (Vite + React 18 + TypeScript)
Frontend is built from the design prototype in `design_handoff_synap/reference/`. Each sprint = one screen, pixel-matched to the prototype.
| Sprint | Screen | Status |
|---|---|---|
| Sprint 0 | Foundation — scaffold + tokens + primitives | 🔲 Not Started |
| Sprint 1 | Login — email/password + SSO + MFA | 🔲 Not Started |
| Sprint 2 | App Shell — sidebar + topbar + routing + theme | 🔲 Not Started |
| Sprint 3 | Asset Module — list + detail + CRUD | 🔲 Not Started |
| Sprint 4 | Incident Module — list + detail + lifecycle | 🔲 Not Started |
| Sprint 5 | Ops Dashboard | 🔲 Not Started |
| Sprint 6 | AIOps Event Console | 🔲 Not Started |
| Sprint 7 | End-user Portal | 🔲 Not Started |
| Sprint 8 | CMDB + Service Map + Cloud | 🔲 Not Started |
| Sprint 9 | Monitoring + KB + Analytics + Admin | 🔲 Not Started |
| Sprint 10 | Global Copilot + ⌘K palette | 🔲 Not Started |
| Sprint 11 | Real API wiring | 🔲 Not Started |
```

Replace with:
```markdown
#### Product Track (Sprint N)
Synap-specific business logic + UX: Asset/Incident Service business logic, the entire frontend (all sprints, including Login), and AI *features* consuming Platform's AI infra. Built from the design prototype in `design_handoff_synap/reference/`; each sprint = one screen, pixel-matched to the prototype.
| Sprint | Screen | Status |
|---|---|---|
| Sprint 0 | Foundation — scaffold + tokens + primitives | ✅ Complete |
| Sprint 1 | Login — email/password + SSO + MFA (UI only; backend = P-Phase 3) | 🔲 Not Started |
| Sprint 2 | App Shell — sidebar + topbar + routing + theme | 🔲 Not Started |
| Sprint 3 | Asset Module — list + detail + CRUD (+ Asset Service backend business logic) | 🔲 Not Started |
| Sprint 4 | Incident Module — list + detail + lifecycle (+ Incident Service backend business logic) | 🔲 Not Started |
| Sprint 5 | Ops Dashboard | 🔲 Not Started |
| Sprint 6 | AIOps Event Console | 🔲 Not Started |
| Sprint 7 | End-user Portal | 🔲 Not Started |
| Sprint 8 | CMDB + Service Map + Cloud | 🔲 Not Started |
| Sprint 9 | Monitoring + KB + Analytics + Admin (+ tenant management UI) | 🔲 Not Started |
| Sprint 10 | Global Copilot + ⌘K palette | 🔲 Not Started |
| Sprint 11 | Real API wiring | 🔲 Not Started |
| — | AI Product Features (triage, runbook, KB auto-draft, semantic search UX) — cross-links Sprints 4/6/7/9/10 | 🔲 Not Started |
```

- [ ] **Step 3: Update the deployment guide rule (section 9) for the new doc paths**

Find:
```markdown
## 9. Deployment Guide Reminder

After every phase, a step-by-step deployment guide must be written or updated in:
```
docs/06_Phase_Deployment_Guides/Phase_0X_<Name>.md
```

The guide must include: prerequisites, ordered steps, expected output, verification
queries/commands, rollback instructions, troubleshooting, and an acceptance checklist.
```

Replace with:
```markdown
## 9. Deployment Guide Reminder

After every Platform phase, a step-by-step deployment guide must be written or updated in:
```
docs/platform/deployment-guides/Phase_0X_<Name>.md
```

After every Product sprint that requires a K8s deployment step, a guide must be written or updated in:
```
docs/product/deployment-guides/Sprint_0X_<Name>.md
```

Both guide types must include: prerequisites, ordered steps, expected output,
verification queries/commands, rollback instructions, troubleshooting, and an
acceptance checklist.
```

- [ ] **Step 4: Verify the edits**

```bash
grep -n "P-Phase\|Product Track\|Platform Track\|docs/platform/deployment-guides\|docs/product/deployment-guides" "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/.claude/CLAUDE.md"
```

Expected: matches for both new table headers, all 9 `P-Phase` rows, and both new deployment-guide path patterns.

- [ ] **Step 5: Stage and hand off to the user for commit**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add .claude/CLAUDE.md
git status --short
```

Show the user the diff and this commit command for them to run:
```bash
git commit -m "docs: update CLAUDE.md for Platform/Product track split"
git push
```

#!/usr/bin/env bash
# populate-roadmap.sh
# Creates all GitHub issues from ROADMAP.md and populates the Synap Roadmap
# project board with correct Stage (Now / Next / Later / Done) values.
#
# Prerequisites:
#   - gh CLI authenticated: gh auth login
#   - jq installed: brew install jq
#   - The "Synap Roadmap" GitHub project already exists (run setup-github-project.sh first)
#
# Usage:
#   bash scripts/populate-roadmap.sh

set -euo pipefail

OWNER="preet2fun"
REPO="preet2fun/itsm-cloudnative-demo-app"
PROJECT_TITLE="Synap Roadmap"

# ── Helpers ──────────────────────────────────────────────────────────────────

log()  { echo "  $*"; }
step() { echo; echo "▶ $*"; }

# ── Step 1: Find project number ───────────────────────────────────────────────

step "Finding project: $PROJECT_TITLE"
PROJECT_NUMBER=$(gh project list --owner "$OWNER" --format json \
  | jq -r --arg title "$PROJECT_TITLE" '.projects[] | select(.title==$title) | .number')

if [ -z "$PROJECT_NUMBER" ]; then
  echo "ERROR: Project '$PROJECT_TITLE' not found. Run setup-github-project.sh first."
  exit 1
fi
log "Project number: $PROJECT_NUMBER"

# ── Step 2: Get project node ID and field/option IDs ─────────────────────────

step "Fetching project field metadata"
FIELDS_JSON=$(gh api graphql -f query="
query {
  user(login: \"$OWNER\") {
    projectV2(number: $PROJECT_NUMBER) {
      id
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options { id name }
          }
        }
      }
    }
  }
}")

PROJECT_NODE_ID=$(echo "$FIELDS_JSON" | jq -r '.data.user.projectV2.id')
log "Project node ID: $PROJECT_NODE_ID"

STAGE_FIELD_ID=$(echo "$FIELDS_JSON" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Stage") | .id')
TYPE_FIELD_ID=$(echo "$FIELDS_JSON"  | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Type")  | .id')
LAYER_FIELD_ID=$(echo "$FIELDS_JSON" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Layer") | .id')

OPT_NOW=$(echo "$FIELDS_JSON"   | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Stage") | .options[] | select(.name=="Now")   | .id')
OPT_NEXT=$(echo "$FIELDS_JSON"  | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Stage") | .options[] | select(.name=="Next")  | .id')
OPT_LATER=$(echo "$FIELDS_JSON" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Stage") | .options[] | select(.name=="Later") | .id')
OPT_DONE=$(echo "$FIELDS_JSON"  | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Stage") | .options[] | select(.name=="Done")  | .id')

OPT_TYPE_PHASE=$(echo "$FIELDS_JSON"  | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Type") | .options[] | select(.name=="Phase")  | .id')
OPT_TYPE_SPRINT=$(echo "$FIELDS_JSON" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Type") | .options[] | select(.name=="Sprint") | .id')
OPT_TYPE_CHORE=$(echo "$FIELDS_JSON"  | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Type") | .options[] | select(.name=="Chore")  | .id')

OPT_LAYER_ALL=$(echo "$FIELDS_JSON" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Layer") | .options[] | select(.name=="All") | .id')
OPT_LAYER_UI=$(echo "$FIELDS_JSON"  | jq -r '.data.user.projectV2.fields.nodes[] | select(.name=="Layer") | .options[] | select(.name=="UI")  | .id')

log "Stage field ID: $STAGE_FIELD_ID  (Now=$OPT_NOW Next=$OPT_NEXT Later=$OPT_LATER Done=$OPT_DONE)"

# ── Step 3: Create labels ─────────────────────────────────────────────────────

step "Creating labels"
create_label() {
  local name="$1" color="$2" desc="$3"
  gh label create "$name" --color "$color" --description "$desc" --repo "$REPO" --force 2>/dev/null || true
  log "label: $name"
}

create_label "phase"       "0075ca" "Infrastructure / backend phase"
create_label "sprint"      "7057ff" "UI sprint"
create_label "roadmap"     "e4e669" "Roadmap item"
create_label "now"         "d93f0b" "Active — in current cycle"
create_label "next"        "fbca04" "Committed — upcoming milestone"
create_label "later"       "0e8a16" "Explored — future"
create_label "done"        "cfd3d7" "Completed"
create_label "multi-tenant" "1d76db" "Affects multi-tenant architecture"
create_label "ai"          "8b5cf6" "AI / ML feature"
create_label "security"    "e11d48" "Security / auth / RBAC"
create_label "ui"          "06b6d4" "Frontend / UI"
create_label "infra"       "64748b" "Infrastructure / K8s / Helm"
create_label "observability" "059669" "Observability / OTel / monitoring"

# ── Step 4: Issue creation helper ────────────────────────────────────────────

add_to_project_with_stage() {
  local issue_number="$1"
  local stage_option_id="$2"
  local type_option_id="${3:-}"
  local layer_option_id="${4:-}"

  # Get the issue node ID
  local ISSUE_NODE_ID
  ISSUE_NODE_ID=$(gh api "repos/$REPO/issues/$issue_number" --jq '.node_id')

  # Add issue to project via GraphQL mutation (reliable across all gh versions)
  local ITEM_ID
  ITEM_ID=$(gh api graphql -f query="
    mutation {
      addProjectV2ItemById(input: {
        projectId: \"$PROJECT_NODE_ID\"
        contentId: \"$ISSUE_NODE_ID\"
      }) {
        item { id }
      }
    }
  " --jq '.data.addProjectV2ItemById.item.id')

  if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" = "null" ]; then
    log "WARNING: could not add issue #$issue_number to project — skipping field updates"
    return
  fi

  # Set Stage
  gh api graphql -f query="
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: \"$PROJECT_NODE_ID\"
        itemId: \"$ITEM_ID\"
        fieldId: \"$STAGE_FIELD_ID\"
        value: { singleSelectOptionId: \"$stage_option_id\" }
      }) { projectV2Item { id } }
    }
  " > /dev/null

  # Set Type if provided
  if [ -n "$type_option_id" ]; then
    gh api graphql -f query="
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: \"$PROJECT_NODE_ID\"
          itemId: \"$ITEM_ID\"
          fieldId: \"$TYPE_FIELD_ID\"
          value: { singleSelectOptionId: \"$type_option_id\" }
        }) { projectV2Item { id } }
      }
    " > /dev/null
  fi

  # Set Layer if provided
  if [ -n "$layer_option_id" ]; then
    gh api graphql -f query="
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: \"$PROJECT_NODE_ID\"
          itemId: \"$ITEM_ID\"
          fieldId: \"$LAYER_FIELD_ID\"
          value: { singleSelectOptionId: \"$layer_option_id\" }
        }) { projectV2Item { id } }
      }
    " > /dev/null
  fi
}

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"   # comma-separated, e.g. "phase,done,roadmap"
  local closed="${4:-false}"

  # Build --label flags from comma-separated list
  local label_flags=()
  IFS=',' read -ra label_arr <<< "$labels"
  for lbl in "${label_arr[@]}"; do
    label_flags+=(--label "$lbl")
  done

  # gh issue create returns the issue URL (not JSON)
  local url
  url=$(gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    "${label_flags[@]}")

  # Extract the issue number from the URL (last path segment)
  local num
  num=$(echo "$url" | grep -oE '[0-9]+$')

  if [ "$closed" = "true" ]; then
    gh issue close "$num" --repo "$REPO" --comment "Completed — see CHANGELOG.md for details." > /dev/null
  fi

  echo "$num"
}

# ── Step 5: Create DONE issues (completed phases/sprints) ────────────────────

step "Creating DONE items (completed phases + Sprint 0)"

N=$(create_issue \
  "[Phase 1] v0.1.0 — Repo scaffold + docs foundation" \
  "## Summary
Repository structure, documentation foundation, and MCP server configuration.

## Deliverables
- Complete repo directory structure
- \`README.md\`, \`CONTRIBUTING.md\`, \`.gitignore\`, \`.env.example\`
- Architecture docs: service design, multi-tenancy, deployment guide
- Database schema diagram
- CI workflow stubs
- MCP server configuration

## Version
\`v0.1.0\` · Apr 2026" \
  "phase,done,roadmap" "true")
add_to_project_with_stage "$N" "$OPT_DONE" "$OPT_TYPE_PHASE" "$OPT_LAYER_ALL"
log "Created #$N: Phase 1"

N=$(create_issue \
  "[Phase 2] v0.2.0 — Database layer + migrations + seed data" \
  "## Summary
PostgreSQL schema-per-tenant design, golang-migrate migrations, and seed data for all three tenants.

## Deliverables
- Migrations 000001–000005 (schema, tenant functions, indexes, triggers, AI stubs)
- Seed data for tenant_a, tenant_b, tenant_c
- Schema-per-tenant isolation: \`search_path\` set per-connection from \`X-Tenant-ID\` header

## Multi-tenant
PostgreSQL schema isolation is the data-layer foundation for all subsequent services.

## Version
\`v0.2.0\` · Apr 2026" \
  "phase,done,roadmap,multi-tenant" "true")
add_to_project_with_stage "$N" "$OPT_DONE" "$OPT_TYPE_PHASE" "$OPT_LAYER_ALL"
log "Created #$N: Phase 2"

N=$(create_issue \
  "[Phase 3] v0.3.0 — User Service (Go, Chi v5, JWT HS256)" \
  "## Summary
User management and authentication service — Go 1.22, Chi v5, HS256 JWT.

## Deliverables
- \`POST /api/v1/auth/login\` — credential validation, JWT issuance
- \`POST /api/v1/auth/refresh\` — token refresh
- \`GET /api/v1/.well-known/jwks.json\` — JWKS endpoint (HS256; migrated to RS256 in Phase 6)
- \`GET /api/v1/users\`, \`GET /api/v1/users/:id\` — tenant-scoped user list/detail
- Multi-tenant JWT claims: \`tenant_id\`, \`role\`, \`email\`, \`sub\`, \`jti\`
- OTel instrumentation: \`itsm.user.login\`, \`itsm.user.list\`

## Version
\`v0.3.0\` (platform) · \`user-service v0.2.0\` · Apr 2026" \
  "phase,done,roadmap,security,multi-tenant" "true")
add_to_project_with_stage "$N" "$OPT_DONE" "$OPT_TYPE_PHASE" "$OPT_LAYER_ALL"
log "Created #$N: Phase 3"

N=$(create_issue \
  "[Phase 4] v0.4.0 — Asset + Incident Services (Python, FastAPI)" \
  "## Summary
Asset management and incident management services — Python 3.12, FastAPI, SQLAlchemy 2.x async.

## Deliverables
- Asset CRUD endpoints with Redis cache (\`itsm:{tenant_slug}:assets:*\`)
- Incident CRUD endpoints with lifecycle (create → assign → resolve)
- RabbitMQ event publishing: \`incident.created\`, \`incident.resolved\`
- W3C TraceContext in AMQP headers
- OTel instrumentation on all endpoints
- Custom Prometheus metrics: \`itsm_incidents_created_total\`, \`itsm_assets_active_count\`

## Version
\`v0.4.0\` (platform) · \`asset-service v0.2.0\` · \`incident-service v0.2.0\` · May 2026" \
  "phase,done,roadmap,multi-tenant" "true")
add_to_project_with_stage "$N" "$OPT_DONE" "$OPT_TYPE_PHASE" "$OPT_LAYER_ALL"
log "Created #$N: Phase 4"

N=$(create_issue \
  "[Phase 5] v0.5.0 — Helm charts + K8s manifests + Dockerfiles" \
  "## Summary
All application services containerised and deployed to the 3-node kubeadm cluster via Helm.

## Deliverables
- Helm chart \`itsm-app v0.2.0\` covering all services
- HPA (min=1, max=2) for all stateless services
- Resource limits matching 10–11 GB usable workload RAM
- \`values.yaml\` (dev) + \`values-qa.yaml\` (qa)
- Dockerfiles for user-service, asset-service, incident-service, frontend
- All pods Running: frontend, user-service, asset-service, incident-service, redis, rabbitmq

## Version
\`v0.5.0\` (platform) · \`helm-chart v0.2.0\` · May 2026" \
  "phase,done,roadmap,infra" "true")
add_to_project_with_stage "$N" "$OPT_DONE" "$OPT_TYPE_PHASE" "$OPT_LAYER_ALL"
log "Created #$N: Phase 5"

N=$(create_issue \
  "[Sprint 0] UI foundation — Vite + React 18 + design system" \
  "## Summary
Frontend scaffold and complete design system — Synap UI Sprint 0 complete.

## Deliverables
- Vite + React 18 + TypeScript scaffold
- OKLCH design token CSS layer (light + dark, from \`design_handoff_synap/reference/styles.css\`)
- Google Fonts: Space Grotesk, Hanken Grotesk, JetBrains Mono
- Primitive components: Icon (60 paths), Button, IconButton, Badge, SevBadge, Card,
  CardHeader, Avatar, HealthDot, Sparkline, StatCard, Segmented, AiOrb, AiChip, Empty, CountUp
- \`useTheme\` hook with localStorage persistence
- \`/dev/components\` preview route — all primitives in light + dark
- nginx:alpine Dockerfile for K8s deployment

## Version
\`frontend v0.1.0\` · Jun 2026" \
  "sprint,done,roadmap,ui" "true")
add_to_project_with_stage "$N" "$OPT_DONE" "$OPT_TYPE_SPRINT" "$OPT_LAYER_UI"
log "Created #$N: Sprint 0"

# ── Step 6: Create NOW issues ─────────────────────────────────────────────────

step "Creating NOW items"

N=$(create_issue \
  "[Phase 6] Istio + OPA — multi-tenant zero-trust networking" \
  "## Summary
Platform security foundation — required before any UI sprint can be validated end-to-end on K8s.

## Why Now
Without Phase 6, the Istio IngressGateway does not exist, meaning:
- No authenticated API access from the browser through K8s
- No JWT validation at the mesh level
- No tenant isolation enforcement at the network layer
- No mTLS between pods

All subsequent sprints need this to pass E2E acceptance tests.

## Deliverables
- [ ] RS256 JWT migration: user-service loads RSA private key from \`JWT_PRIVATE_KEY\` env var
- [ ] JWKS endpoint updated to serve RSA public key (\`kty: RSA\`) for Istio
- [ ] Istio install (demo profile, NodePort 30080)
- [ ] Istio Gateway + VirtualService (path-based routing to all services)
- [ ] RequestAuthentication: JWT validation + inject \`X-Tenant-ID\` + \`X-User-Role\` headers
- [ ] DENY AuthorizationPolicy: blocks unauthenticated requests to API paths
- [ ] OPA deployment with Envoy plugin (gRPC 9191)
- [ ] Rego RBAC policy: role + HTTP method + path
- [ ] CUSTOM AuthorizationPolicy → OPA ext_authz
- [ ] PeerAuthentication STRICT (mTLS between all pods)
- [ ] E2E acceptance test: all 10 checks passing

## Multi-tenant
Istio AuthorizationPolicy enforces that JWT \`tenant_id\` claim matches the request route.
OPA Rego policy scopes RBAC decisions per tenant via the \`X-Tenant-ID\` header.

## Exit criteria
\`http://172.16.15.206:30080\` — login works, unauthenticated API returns 403,
viewer blocked from POST, mTLS confirmed STRICT.

## Version bump
\`user-service v0.2.0\` → \`v0.3.0\`, \`helm-chart v0.2.0\` → \`v0.3.0\`, platform \`v0.5.0\` → \`v0.6.0\`

## Deployment guide
\`docs/platform/deployment-guides/Phase_06_Istio_OPA.md\`" \
  "phase,now,roadmap,security,multi-tenant,infra" "false")
add_to_project_with_stage "$N" "$OPT_NOW" "$OPT_TYPE_PHASE" "$OPT_LAYER_ALL"
log "Created #$N: Phase 6"

# ── Step 7: Create NEXT issues ────────────────────────────────────────────────

step "Creating NEXT items"

N=$(create_issue \
  "[Sprint 1] Authentication — email + password + email OTP MFA" \
  "## Summary
Login screen with email/password + 6-digit email OTP second factor.
The first full SDLC cycle: UI → Backend → Infra → K8s Deploy → E2E test.

## Gate
Phase 6 must be complete and validated before Sprint 1 E2E test runs on K8s.

## SDLC layers

### UI (frontend v0.2.0)
- [ ] Split-screen login: brand panel (synapse mark + 96%/41m/64% stats) + form panel
- [ ] Email + password form with validation
- [ ] 6-digit email OTP entry step
- [ ] Forgot password page (stub, same visual language)
- [ ] React Router: \`/login\` → \`/login/mfa\` → \`/forgot-password\`
- [ ] JWT stored in \`localStorage\` after OTP verify success
- [ ] Redirect to \`/\` (app shell) on success

### Backend (user-service v0.4.0)
- [ ] \`POST /api/v1/auth/mfa/send\` — generate 6-digit OTP, store in Redis (5 min TTL), send email
- [ ] \`POST /api/v1/auth/mfa/verify\` — validate OTP, issue RS256 JWT on success
- [ ] Login response updated: returns \`{mfa_required: true, session_id: \"...\"}\` when creds OK
- [ ] SMTP email sender (dev mode: log OTP to stdout if \`SMTP_HOST\` unset)
- [ ] Redis OTP key: \`itsm:{tenant_slug}:otp:{session_id}\`

### Infra
- [ ] Build + push \`preet2fun/user-service:v0.4.0\`
- [ ] Build + push \`preet2fun/frontend:v0.2.0\`
- [ ] Update \`values.yaml\` image tags
- [ ] \`helm upgrade\` on cluster

### E2E test
- [ ] Login with \`alice.admin@globaltech.io\` (tenant_a) → OTP received → enter code → dashboard loads
- [ ] Login with \`bob.agent@startupco.io\` (tenant_b) → separate session, separate JWT
- [ ] Wrong OTP → 401 returned
- [ ] Expired OTP (6+ min) → 401 returned

## Multi-tenant
OTP Redis key is scoped to tenant slug. JWT carries \`tenant_id\` claim.
Tested with two different tenants in the same E2E run.

## Ref
\`design_handoff_synap/reference/auth.jsx\`" \
  "sprint,next,roadmap,security,multi-tenant,ui" "false")
add_to_project_with_stage "$N" "$OPT_NEXT" "$OPT_TYPE_SPRINT" "$OPT_LAYER_ALL"
log "Created #$N: Sprint 1"

N=$(create_issue \
  "[Sprint 2] App Shell — sidebar + topbar + routing + theme" \
  "## Summary
Persistent application shell: sidebar navigation, topbar, theme toggle, persona switch, routing.

## SDLC layers

### UI (frontend v0.3.0)
- [ ] Left sidebar: Synap mark, workspace switcher, grouped nav (Operate / Self-Service / Inventory / Insights), AI footer card
- [ ] Topbar: page title, ⌘K trigger, Ask Synap button, theme toggle, notification bell, persona switch, avatar menu
- [ ] React Router — all nav routes wired with placeholder pages
- [ ] Light/dark theme persisted to localStorage
- [ ] Persona switch: Agent console ↔ Employee portal (Zustand)
- [ ] Per-route error boundary

### Backend (user-service)
- [ ] \`GET /api/v1/users/me\` — return profile from JWT claims (\`tenant_id\`, \`role\`, \`email\`)

### Infra + Deploy + E2E
- [ ] Build + push \`preet2fun/frontend:v0.3.0\`
- [ ] Helm upgrade + verify shell loads at \`http://172.16.15.206:30080\`
- [ ] Theme toggle works in both light + dark
- [ ] All nav items route correctly
- [ ] Sidebar shows correct persona after switch

## Ref
\`design_handoff_synap/reference/shell.jsx\`" \
  "sprint,next,roadmap,ui" "false")
add_to_project_with_stage "$N" "$OPT_NEXT" "$OPT_TYPE_SPRINT" "$OPT_LAYER_UI"
log "Created #$N: Sprint 2"

N=$(create_issue \
  "[Sprint 3] Asset Module — list + detail + CRUD" \
  "## Summary
Asset management screen: searchable/filterable list table, asset detail panel, create/edit/delete.

## Key requirements
- Multi-tenant: assets scoped to \`X-Tenant-ID\`; tenant_a cannot see tenant_b assets
- List with filters: type, status, owner, health
- Detail panel: CI relationships, owner, telemetry sparklines
- RBAC: viewers read-only, agents/admins can create + edit

## Ref
\`design_handoff_synap/reference/inventory.jsx\` → \`Assets\` view" \
  "sprint,next,roadmap,multi-tenant,ui" "false")
add_to_project_with_stage "$N" "$OPT_NEXT" "$OPT_TYPE_SPRINT" "$OPT_LAYER_ALL"
log "Created #$N: Sprint 3"

N=$(create_issue \
  "[Sprint 4] Incident Module — list + detail + lifecycle (Hero Flow #2)" \
  "## Summary
Incident management: list table, detail with AI resolution runbook (mocked), live telemetry, AI timeline.
This is Hero Flow #2 — the core ITSM demo flow.

## Hero flow
Agent opens incident → sees AI runbook + live asset telemetry inline → 'Approve & run' →
resolves in minutes → AI auto-drafts KB article.

## Key requirements
- Multi-tenant incident scoping
- Priority badges (critical/high/medium/low) with correct OKLCH colours
- AI runbook section with approve + run stepper (mocked, \`// TODO: real API\`)
- Live telemetry sparklines for affected asset
- RBAC: viewers cannot create/update incidents (OPA enforces via HTTP method)

## Ref
\`design_handoff_synap/reference/incidents.jsx\`" \
  "sprint,next,roadmap,multi-tenant,ui,ai" "false")
add_to_project_with_stage "$N" "$OPT_NEXT" "$OPT_TYPE_SPRINT" "$OPT_LAYER_ALL"
log "Created #$N: Sprint 4"

N=$(create_issue \
  "[Sprint 5] Ops Dashboard — KPIs + service health + AI activity feed" \
  "## Summary
Operations home screen: KPI stat cards (CountUp animated), hero active-incident card,
service health grid, AI activity feed, predictive alert banner.

## Ref
\`design_handoff_synap/reference/dashboard.jsx\`" \
  "sprint,next,roadmap,multi-tenant,ui" "false")
add_to_project_with_stage "$N" "$OPT_NEXT" "$OPT_TYPE_SPRINT" "$OPT_LAYER_UI"
log "Created #$N: Sprint 5"

N=$(create_issue \
  "[Phase 7] AI Features — triage + runbook + KB auto-draft + semantic search" \
  "## Summary
AI service implementation: incident triage, resolution runbook generation, KB article auto-draft, pgvector semantic search.

## Deliverables
- AI service (FastAPI, pgvector)
- \`POST /api/v1/ai/triage\` — classify incident priority + suggest resolution path
- \`POST /api/v1/ai/runbook\` — generate step-by-step resolution runbook
- \`POST /api/v1/ai/kb/draft\` — auto-draft KB article from resolved incident
- \`POST /api/v1/ai/search\` — semantic search over CIs and incidents
- Replace \`// TODO: real API\` seams in Sprint 4 (incidents) and Sprint 6 (AIOps)

## Multi-tenant
All AI calls scoped to \`X-Tenant-ID\` — vectors partitioned per tenant in pgvector." \
  "phase,next,roadmap,ai,multi-tenant" "false")
add_to_project_with_stage "$N" "$OPT_NEXT" "$OPT_TYPE_PHASE" "$OPT_LAYER_ALL"
log "Created #$N: Phase 7"

# ── Step 8: Create LATER issues ───────────────────────────────────────────────

step "Creating LATER items"

N=$(create_issue \
  "[Sprint 6] AIOps Event Console — alert correlation (Hero Flow #3)" \
  "## Summary
Alert storm correlation hero flow: 47 events → 'Correlate with Synap' → collapses to
1 incident with animated topology viz. The platform's biggest 'wow' moment.

## Hero flow
Alert storm (47 events) → 'Correlate with Synap' → animated dots converge → 1 incident
with root cause → remediation runbook → human approves → auto-remediate → draft KB.

## Key animations
- Correlation dots scattered → converge to centre node (0.9s cubic-bezier, staggered 18ms)
- Event rows slide out + fade as absorbed
- Stepper: numbered → check states with typing indicator

## Ref
\`design_handoff_synap/reference/aiops.jsx\`" \
  "sprint,later,roadmap,ai,ui" "false")
add_to_project_with_stage "$N" "$OPT_LATER" "$OPT_TYPE_SPRINT" "$OPT_LAYER_ALL"
log "Created #$N: Sprint 6"

N=$(create_issue \
  "[Sprint 7] End-user Portal — zero-ticket self-service (Hero Flow #1)" \
  "## Summary
Employee self-service portal: chat → AI device diagnostics → 'Apply fix automatically' → resolved in ~40s.
No ticket created. Deflects L1 entirely.

## Hero flow
Employee describes issue → AI reads device diagnostics → proposes fix → 'Apply fix' → resolved.

## Ref
\`design_handoff_synap/reference/portal.jsx\`" \
  "sprint,later,roadmap,ai,ui" "false")
add_to_project_with_stage "$N" "$OPT_LATER" "$OPT_TYPE_SPRINT" "$OPT_LAYER_ALL"
log "Created #$N: Sprint 7"

N=$(create_issue \
  "[Sprints 8–10] CMDB, Service Map, Cloud, Monitoring, KB, Analytics, Admin" \
  "## Summary
Remaining UI screens covering inventory, monitoring, knowledge base, analytics, and admin.

## Sprint 8 — Inventory
- CMDB: auto-discovered CIs table with health + AI discovery banner
- Service Map: SVG dependency topology, click node → impact/blast-radius panel
- Cloud Inventory: multi-cloud assets with cost + health
- Assets: managed-asset table linked to owners/CMDB

## Sprint 9 — Modules
- Monitoring: golden-signals charts + predictive-alert banner
- Knowledge Base: article grid + reader + AI-drafted articles
- Analytics: natural-language → report/chart generator
- Admin: integrations, users + roles, AI governance toggles

## Sprint 10 — Copilot + ⌘K
- Global 'Ask Synap' side panel (right drawer)
- ⌘K command palette with AI suggestions + navigation
- Zustand global state: copilotOpen, paletteOpen

## Ref
\`design_handoff_synap/reference/inventory.jsx\`, \`modules.jsx\`, \`copilot.jsx\`" \
  "sprint,later,roadmap,ai,ui" "false")
add_to_project_with_stage "$N" "$OPT_LATER" "$OPT_TYPE_SPRINT" "$OPT_LAYER_UI"
log "Created #$N: Sprints 8-10"

N=$(create_issue \
  "[Sprint 11] Real API wiring — replace mock data layer with TanStack Query" \
  "## Summary
Replace all mock data (\`src/lib/data/\`) with real TanStack Query hooks backed by backend endpoints.
Wire all \`// TODO: real API\` seams.

## Deliverables
- TanStack Query + Zustand installed
- Per-resource typed hooks: \`useIncidents\`, \`useAssets\`, \`useUsers\`, etc.
- All \`setTimeout\` fakes replaced with real streaming API calls
- Auth: JWT from localStorage attached to every request via Axios interceptor
- Error states and loading states tested across all screens" \
  "sprint,later,roadmap,multi-tenant" "false")
add_to_project_with_stage "$N" "$OPT_LATER" "$OPT_TYPE_SPRINT" "$OPT_LAYER_ALL"
log "Created #$N: Sprint 11"

N=$(create_issue \
  "[Phase 8] Observability Stack — OTel Collector + Prometheus + Loki + Jaeger + Grafana" \
  "## Summary
Full observability stack: metrics, logs, and traces wired and visualised.

## Deliverables
- OTel Collector deployment (Helm, \`infra/observability/otel-collector/\`)
- Prometheus scrape config + Grafana dashboards (per-tenant metric labels)
- Loki log aggregation (structured logs from all services)
- Jaeger all-in-one deployment (distributed tracing)
- Grafana: service health, incident SLA, per-tenant usage, AI performance dashboards

## Multi-tenant
All dashboards filtered by \`tenant.id\` label/attribute." \
  "phase,later,roadmap,observability,multi-tenant,infra" "false")
add_to_project_with_stage "$N" "$OPT_LATER" "$OPT_TYPE_PHASE" "$OPT_LAYER_ALL"
log "Created #$N: Phase 8"

N=$(create_issue \
  "[Phase 9] CI/CD + GitOps — GitHub Actions + ArgoCD" \
  "## Summary
Automated build, test, push, and deploy pipeline.

## Deliverables
- GitHub Actions: build + lint + test on every PR, docker push on version tags
- ArgoCD Application for dev + qa environments
- Automated image tag promotion: dev merge → rebuild → update dev ArgoCD app
- Manual promotion gate: dev → qa requires approval
- Helm chart published to ArtifactHub (open source milestone)" \
  "phase,later,roadmap,infra" "false")
add_to_project_with_stage "$N" "$OPT_LATER" "$OPT_TYPE_PHASE" "$OPT_LAYER_ALL"
log "Created #$N: Phase 9"

N=$(create_issue \
  "Multi-tenancy enhancements — tenant management UI + per-tenant settings" \
  "## Summary
First-class tenant management features beyond the current schema-per-tenant isolation foundation.

## Deliverables
- Tenant management UI in Admin screen: onboard / offboard tenants
- Per-tenant settings: accent hue theming, logo, display name
- Tenant usage metrics dashboard (Prometheus per-tenant labels)
- Tenant onboarding API: \`POST /api/v1/admin/tenants\`
- Tenant admin role: cross-tenant read-only visibility for super-admins
- Per-tenant rate limiting via Istio EnvoyFilter" \
  "later,roadmap,multi-tenant,ui" "false")
add_to_project_with_stage "$N" "$OPT_LATER" "$OPT_TYPE_CHORE" "$OPT_LAYER_ALL"
log "Created #$N: Multi-tenancy enhancements"

N=$(create_issue \
  "Open source + community — ArtifactHub, contributor guide, plugin API" \
  "## Summary
Everything needed to make Synap a thriving open-source project.

## Deliverables
- Helm chart published to ArtifactHub
- GitHub Discussions enabled
- Contributor quick-start guide (dev environment in < 30 min)
- 3 example tenant seed data sets (SaaS, FinTech, Healthcare)
- Plugin API for custom integrations (webhook + extension points)
- Demo video / architecture walkthrough recording" \
  "later,roadmap" "false")
add_to_project_with_stage "$N" "$OPT_LATER" "$OPT_TYPE_CHORE" "$OPT_LAYER_ALL"
log "Created #$N: Open source + community"

# ── Done ──────────────────────────────────────────────────────────────────────

step "All done!"
echo
echo "  Project board: https://github.com/orgs/$OWNER/projects or"
echo "  https://github.com/users/$OWNER/projects"
echo
echo "  Next steps:"
echo "  1. Open the board and switch to Board layout (group by Stage)"
echo "  2. The board should show 6 Done, 1 Now, 6 Next, 6 Later items"
echo "  3. Phase 6 (Now) is the first item to work on"

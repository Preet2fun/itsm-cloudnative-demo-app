# Fusion AI Platform Revamp — Design

Status: proposed, pending user review
Scope: product vision, features, UI direction, and AI Platform architecture
only. Platform/infrastructure (K8s cluster, Istio, OPA, external PostgreSQL,
Helm delivery model, hardware budget) is unchanged — see §3. This document
defines what an implementation plan would build; it makes no code, Helm, or
K8s manifest changes itself.

## 1. Motivation

The current roadmap (`ROADMAP.md`, Sprints 1–11) builds Synap as a
conventional ITSM/ITOM UI with AI bolted on as mocked assist features per
screen. That undersells what's actually differentiated and buildable here.

The revamped vision: fuse **observability** (metrics/logs/traces),
**ITSM/ServiceOps** (change requests, incidents), and **security** (eBPF
runtime signals) into one agentic reasoning system that determines, for a
given trigger, whether it's fundamentally an observability incident, a
security incident, or caused by an ITSM change — and drives resolution
accordingly. An **operational graph** is the reasoning substrate everything
else sits on. Building the AI Platform this rests on is the top priority;
future agentic use cases are meant to be built on top of it, not around it.

## 2. Vision

> Given any signal — a metric breach, a security finding, a change event, an
> end-user report — Synap correlates it against live topology and historical
> memory to answer three questions an on-call engineer currently answers by
> hand: **what is this, what caused it, and what happened last time.**

This is deliberately narrower than a general ITSM AI product. Cross-checked
against Gartner's Sept-2025 ITSM-AI market taxonomy (25 use cases across 8
domains — service desk, knowledge, incident, problem, change, routing, case
management, autonomous ops): **none of those 8 domains include a security
dimension**, and Gartner's own assessment is that *"few solutions currently
deliver true agentic capabilities... most offerings remain primarily
assistive."* Both facts point at the same whitespace this design targets:
real multi-step autonomous investigation (not another assistive layer) that
spans a domain (security) the existing market doesn't fuse in at all. Gartner
separately rates Root Cause Analysis as a "P3 — Strategic Horizon" capability
requiring CMDB + monitoring integration to work — confirming this is
frontier-difficulty work, not a quick add.

Inspiration for specific mechanisms (internal reference only — never
surfaced in product-facing copy):

- **EdgeDelta** ("Observability 3.0") — a telemetry *pipeline* concept:
  edge+cloud transform/enrich/route across logs/metrics/traces/events as one
  multi-signal stream, feeding always-on AI agents that continuously analyze
  rather than wait for reactive alerts.
- **Nofire** — a live, *time-versioned* production graph fusing
  infra+cloud+CI/CD+observability into one graph of services, dependencies,
  and owners. Agent actions are gated against this graph at runtime.
  Incident memory attaches root cause + fix to graph nodes so the same
  failure pattern is caught next time a similar change happens.
- **Zep** — agent memory as a *temporal knowledge graph*: entities/facts/
  episodes each with a validity window, automatic fact invalidation on
  contradiction (old fact kept as history, never deleted), every fact
  traceable back to its source episode (provenance).

## 3. What stays the same (explicit non-goals of this revamp)

- Kubeadm K8s cluster, 3 nodes, 16GB total RAM, HPA min=1/max=2 for all
  stateless services, CPU threshold 70% — unchanged, and the binding
  constraint on everything proposed below.
- Istio service mesh handles all authn/routing; OPA does RBAC via Rego;
  services never re-validate JWTs or do their own authz — unchanged.
- PostgreSQL 16 external/standalone, schema-per-tenant, single
  `DATABASE_URL` — unchanged. New tables described here are added to the
  existing per-tenant migration path, not a new database.
- No dedicated API Gateway service, no Docker Compose — unchanged.
- Umbrella Helm chart stays the delivery model; the per-service chart split
  stays deferred to P-Phase 7 (see §11 for the one adjustment: pulling the
  `itsm-microservice` *library chart* forward).
- Existing Platform-track phases (P-Phase 1–5, done) are untouched.

## 4. Ground-truth corrections found during this design pass

Verified directly against the repo, not assumed:

- **Asset Service and Incident Service are not empty schemas.** Both have
  working FastAPI CRUD today — Incident Service has 10 endpoints (incl.
  assign/resolve/events + RabbitMQ publishing), Asset Service has 7
  endpoints + Redis cache. More reusable than the original plan assumed.
- **The observability stack is not deployed.** `infra/observability/{prometheus,loki,jaeger,grafana,otel-collector}/`
  are empty placeholders; P-Phase 6 is still pending. This is the fusion
  pipeline's primary signal source, so it becomes a hard dependency inside
  Phase 1 of the revised roadmap (§12), not something that happens later.
- **`ai-service` and `notification-service` are empty stubs** — no
  Dockerfile, no Helm template, no Istio route, no OPA rule for either.
  Building the AI Platform starts with making `ai-service` a real deployable
  service.
- **An embedded git repository was found inside this repo**:
  `agentic-ai-hub/agentic-ai-hub` is tracked as a gitlink (mode `160000`, no
  `.gitmodules`) pointing at `github.com/Preet2fun/agentic-ai-hub.git`,
  swept into the most recent commit. A fresh clone of this repo would see
  that folder as empty. It contains genuinely relevant prior research (a
  generic agentic-AI reference-architecture note + a Gartner ITSM-AI market
  analysis) that informed §2 and §15 of this document. **Decision:**
  convert to a proper git submodule. Not executed as part of this design
  pass — tracked as a follow-up hygiene task (§16).

## 5. Architecture decision: "Signal Spine" (Approach A)

Three approaches were evaluated, differing in **where correlation happens**:
write-time, read-time, or stream-time.

| | A. Signal Spine (chosen) | B. Live Federation | C. Always-On Teammates |
|---|---|---|---|
| What it is | One normalized event contract (`SynapSignal`, §6.2) all three domains collapse into; a small ingestion service normalizes → enriches → dedupes → routes; the agent reasons over pre-gathered evidence | No pipeline — the alert lands directly on the agent, which queries live sources at reasoning time | Continuous domain-specialist agents (SRE/Security/Change) scoring streams before a threshold even fires |
| New deployments | 2 (`signal-service` + worker) | 0 | 4+ |
| Incremental RAM | ~1.28Gi (with the hybrid graph store, §6.1) | ~0 | ~2Gi+ |
| Synthetic-RCA eval | Both Axis 1 (efficiency) and Axis 2 (adversarial) work | Axis 2 only — no pre-gathered evidence set means no efficiency axis at all | Both work |
| "N alerts → 1" noise reduction | Real (pipeline dedupe) | Fictional (frontend grouping only) | Real |
| Incident replay | Yes | No | Yes |
| Blast radius if wrong | Medium — wrong data shape, re-normalizable from `raw_ref` | Low | High — stream semantics leak into every component |

**Chosen: A**, with B as the explicit fallback if the RAM budget proves
tighter than modeled once P-Phase 6 actually lands, and C as a Phase 5+
evolution — a subscriber added onto A's event bus later, not a rewrite.

## 6. Graph store decision: hybrid Memgraph + Postgres

The "two separate graphs" decision (topology vs. memory) opens a hybrid that
a single-store choice wouldn't: the two graphs have opposite storage
profiles, so they don't need the same engine.

| | Topology graph | Memory graph |
|---|---|---|
| Nature | Current-state, bounded, refreshed every 60s | Append-only, unbounded, grows forever |
| Store | **Memgraph** (new, in-cluster, ~256Mi/512Mi) | **Plain PostgreSQL** (existing external DB, no extension) |
| Why this fits | Small + bounded is exactly what an in-memory graph store is good at — fast native Cypher, multi-hop traversal | Unbounded append-only growth is exactly what Postgres is built for; an in-memory store here is the one workload most likely to OOM at a 512Mi cap |
| Query language | Native Cypher/Bolt | Plain SQL + recursive CTE for the rarer multi-hop memory query |

Alternatives considered and ruled out: **Neo4j** (Community Edition
realistically wants 1–2GB+ heap, doesn't fit); **Postgres + Apache AGE for
both graphs** (zero in-cluster RAM, but AGE isn't a standard PG16 package on
most distros — real installability risk on the external host, avoided
entirely by this hybrid); **Dgraph** (another full stateful service, and
declining project momentum); **RedisGraph** (discontinued by Redis Labs in
2023). All graph access goes through a `GraphStore` port with three
primitives (§8.5) so the specific engine per graph is swappable without a
redesign if any of this changes later.

## 7. Tenancy & isolation for the graphs

Memgraph is a single in-cluster instance carrying both shared infrastructure
topology and tenant-owned CI/asset data. Isolation model: every node/edge is
labeled `platform` (shared K8s/infra topology, read-only to all tenants) or
`tenant:{slug}` (CIs, incidents, changes owned by one tenant). Cross-scope
edges only flow `tenant → platform` (e.g. "this CI runs on this shared
node"), never `platform → tenant` or `tenant → tenant`. Every query filters
by the requesting tenant's scope plus `platform`. This mirrors the existing
`X-Tenant-ID` + OPA discipline already used everywhere else in this project.

The memory graph, being plain per-tenant Postgres tables, inherits the
existing schema-per-tenant isolation with zero new isolation logic.

## 8. Concrete architecture

### 8.1 RAM budget (the binding constraint)

The existing CLAUDE.md resource-limit table, summed at HPA max=2 for all
stateless services, already reserves ~6.75Gi — of which the observability
stack (~1.3Gi) isn't deployed yet. Real headroom today is ~1.5–2.5Gi, and
tighter once P-Phase 6 actually ships. **This should be re-measured on the
live cluster once P-Phase 6 lands**, before committing final component
sizes.

| New component | CPU req/lim | Mem req/lim | Replicas | Incremental |
|---|---|---|---|---|
| `signal-service` (ingestion API) | 50m/200m | 96Mi/192Mi | HPA 1–2 | 384Mi |
| `synap-worker` (agent runtime; same image as `ai-service`, different entrypoint) | 100m/300m | 192Mi/384Mi | fixed 1, no HPA | 384Mi |
| `graph-store` (Memgraph, topology only) | 50m/200m | 256Mi/512Mi | fixed 1, no HPA | 512Mi |
| `ai-service` (already in the CLAUDE.md table) | 100m/400m | 256Mi/512Mi | HPA 1–2 | 0 (pre-existing) |
| **Total incremental** | | | | **≈1.28Gi** |

Two hard consequences: the agent worker is fixed at 1 replica (long-running
LLM investigations should not be HPA'd on CPU), and the LLM must be a remote
API — there is no RAM budget for in-cluster inference (see §10).

### 8.2 The `SynapSignal` ingestion contract

One event envelope all three domains normalize into. This is the
EdgeDelta-pipeline-inspired piece, and the single most load-bearing artifact
in the design:

```
signal_id, tenant_id, fingerprint
source_domain:  observability | itsm | security          ← the fusion axis
source_system:  prometheus | loki | jaeger | k8s_events | incident_service
                | change_request | falco | tetragon
signal_type:    metric_breach | log_pattern | trace_anomaly
                | change_requested|applied|rolled_back
                | incident_opened|updated|resolved | security_finding
occurred_at, ingested_at, window_start, window_end
severity, title, body, labels{}
subject: { kind, node_key, namespace, cluster }          ← join key to topology graph
evidence_source_id                                       ← same controlled vocabulary as the synthetic-RCA eval
raw_ref: { store, pointer }                               ← re-normalization escape hatch
trace_context: traceparent
provenance: { collector, contract_version, transform_chain[] }
```

The load-bearing design move: `evidence_source_id` draws from the same
`VALID_EVIDENCE_SOURCES` vocabulary already enforced by
`tests/synthetic/schemas.py` (see `ai-platform-design/synthetic-rca-eval-*.md`).
Every signal, every tool result, every graph query is tagged with one. "Was
this evidence actually consulted?" becomes a structural lookup in an
evidence ledger, not a text scan of the model's output — the same predicate
discipline the eval design already demands, achieved by construction.

Five pipeline stages, one small worker: **collect** (Alertmanager webhook,
RabbitMQ consumer on the exchange `incident-service` already publishes to,
`/ingest/security` fed by the seeder, K8s watch for topology deltas) →
**normalize** (per-source adapter → `SynapSignal`, validated against
controlled vocabularies — unknown enum = loud rejection) → **enrich**
(resolve `subject.node_key` against the topology graph; attach owner, tier,
dependencies, changes-in-window, open incidents) → **reduce** (fingerprint
dedupe + burst-collapse into `signal_clusters` — this is what makes an
"N alerts → 1" number real, not a UI trick) → **route** (persist, publish
`signal.cluster.ready`).

### 8.3 Topology graph (Memgraph)

Current-state only, reconciled every 60s: K8s API → workloads/endpoints;
Istio `VirtualService`/`DestinationRule` → routing edges; Postgres catalog →
`BACKED_BY`; `asset-service` → CI nodes. Node identity is a **deterministic
key** (`k8s:{cluster}/{ns}/{kind}/{name}`, `pg:{host}/{db}/{schema}`,
`ci:{tenant}/{asset_id}`) — never a generated UUID, because the memory graph
references these keys permanently and they must survive graph rebuilds.
Nodes/edges: `Service, Deployment, Pod, Node, Namespace, Schema,
ExternalDependency, Asset(CI), Team, ChangeRequest, Route` /
`DEPENDS_ON, RUNS_ON, EXPOSES, OWNED_BY, BACKED_BY, DEPLOYED_BY, ROUTES_TO,
PART_OF`. **Never hard-deletes** — unseen nodes get `state=absent` +
`last_seen_at`, so memory facts never dangle. Honest limitation: liveness
stamps *bound* historical topology, they don't reconstruct it — see §16 for
the daily-snapshot mitigation.

### 8.4 Memory graph (plain Postgres)

**Episode** — an immutable ingest unit (signal cluster, investigation run,
resolved incident, change outcome, human note) with a `source_ref`; the
provenance root for everything else. **Entity** — a topology `node_key`
reference, plus abstract entities (`FailureMode`, `Runbook`, `Hypothesis`,
`RootCause`, `AgentIdentity`). **Fact** — subject–predicate–object with
`valid_from`/`valid_to` (`NULL` = present), `invalidated_by_episode_id`,
`confidence`, `derived_by` (agent identity + model version),
`provenance_episode_ids[]`. Contradiction sets `valid_to = now()` and
inserts a new fact — **nothing is ever deleted**. Retrieval is hybrid and
always temporally filtered: graph traversal from the signal's subject +
pgvector semantic search over episode embeddings + `pg_trgm` keyword,
rank-fused, filtered to facts valid at `occurred_at`. That temporal filter is
what stops the agent citing stale knowledge.

### 8.5 GraphStore port

A shared library, `libs/synap-graph`, exposes exactly three primitives —
nothing else touches graph storage directly:

- `neighborhood(node_key, hops, edge_kinds) -> subgraph`
- `facts_about(node_keys[], as_of, predicates[]) -> facts`
- `episodes_like(text|embedding, filter) -> episodes`

Because the two graphs live in different stores, `facts_about` does a
two-step join in Python (Memgraph for the neighborhood, Postgres for the
facts) rather than one SQL statement — the price of the hybrid choice in
§6, paid once at this boundary rather than throughout the codebase. **Every
call to these primitives writes an evidence-ledger row** — non-negotiable,
it's the eval hook.

### 8.6 Agent runtime

A bounded state machine, not a free-form loop:
`TRIAGE → CLASSIFY_DOMAIN → GATHER → HYPOTHESIZE → VERIFY → CONCLUDE →
(PROPOSE_ACTION)`. Bounded loops make the eval's `max_investigation_loops`
gate meaningful. **`CLASSIFY_DOMAIN` is the product's actual differentiator**
— `observability | security | change-induced`, with confidence, rationale,
and evidence for each *rejected* alternative, not just the winner. This
needs a new eval gate not in the current blueprint (§14). Tools map 1:1 to
evidence sources: `query_prometheus`, `query_loki`, `query_jaeger`,
`describe_pod`, `get_topology_neighborhood`, `get_memory_facts`,
`find_similar_episodes`, `list_changes_in_window`, `get_security_findings`,
`get_incident`. Evidence-ledger row per tool call:
`{investigation_id, step, tool, evidence_source_id, query, result_digest,
latency_ms, tokens}` — one artifact, three consumers: agent state, eval
predicates, UI "show your work" panel.

**Autonomy L1 (recommend, human approves) everywhere at launch**, per the
autonomy-level scale already defined in `ai-platform-design/design-considerations.md`.
L2 (act-with-approval) is scoped to a later, whitelisted action set,
double-gated by OPA policy *and* a graph check (target not in a change
freeze, blast radius ≤ N dependent services, env not prod-critical) — the
Nofire-style runtime gating, made possible by the topology graph existing.
**Agents get their own identity** issued by the existing user-service
(`role: agent:sre`, `agent:security`), so OPA governs agents exactly like
humans — nearly free given the identity engine is done, and it satisfies the
"strong identity, never ambient credential" principle directly.

### 8.7 SecurityFinding (schema now, DaemonSet later)

A `SynapSignal` with `source_domain=security` plus a typed sidecar:

```
finding_id, rule, priority,
kind: process_exec | privilege_escalation | sensitive_file_read
      | unexpected_network | shell_in_container,
process: {pid, exe, cmdline, user, container_id, image},
k8s: {namespace, pod, container}   → resolves to topology node_key,
network: {dst_ip, dst_port, direction}, file: {path, mode},
mitre: {tactic, technique}, raw: {...}
```

Seeded now by a script posting Falco-JSON-shaped events (with historical
timestamps) to `/api/v1/signals/ingest/security` — the same endpoint the
real DaemonSet uses later, so wiring it live is a config change with zero
code change. Forward-looking note on the live source: **Falco** (modern-eBPF
driver, `json_output` + HTTP output) is the recommended choice when this is
wired live in Phase 5 — the rule corpus is large and recognizable, the seed
shape already matches it. **Tetragon** is the better choice if in-kernel
process-ancestry causality or enforcement becomes a requirement; it
coexists fine with the existing Calico CNI. Either way, a DaemonSet is
3×150–300Mi on this 3-node cluster — do not deploy until the RAM budget is
re-measured after §8.1's numbers are confirmed live.

### 8.8 ChangeRequest / DeployEvent (schema now, seeded now)

Unlike security signals, change/deploy data is seeded **immediately**, not
deferred — it's core to `incident-service`'s own domain (Phase 4 builds
`change_requests` there anyway) and the worked RCA example (§ below) depends
on a change event existing to demonstrate the differentiator from day one.
`ArgoCD` (P-Phase 7, not yet deployed) becomes the live deploy-event source
once it exists; until then, mock `ChangeRequest`/`DeployEvent` signals feed
the pipeline the same way `SecurityFinding` mocks do.

### 8.9 Reused scaffolding (not bypassed)

`incident-service/app/mq.py`'s existing RabbitMQ publisher becomes the ITSM
adapter's source — no change to incident-service's existing endpoints.
`change_requests` gets a home *inside* incident-service rather than a new
deployment (it already owns ITSM lifecycle). `asset-service` gains a
`node_key` column linking CIs to topology nodes. The `tenant_session()`
pattern in `db.py`, the `telemetry.py` modules, and the umbrella-chart
templates are copied verbatim into every new service.

### Worked example (used to validate every piece above)

*Trigger: `IncidentServiceHighLatency` p99 > 2s. Ground truth: a config
change 20 minutes earlier cut the DB pool size. Red herring: a Falco "shell
in container" event on an unrelated pod 2 hops away.*

1. Alertmanager → normalized to `SynapSignal{domain=observability,
   type=metric_breach, subject=k8s:dev/deploy/incident-service}`.
2. **Enrich**: subject resolved to a topology node; owner, tier,
   dependencies, changes in the last 60 min, open incidents attached inline.
3. **Reduce**: fingerprint collapses sibling latency alerts + error logs +
   the security finding sharing a subject-neighborhood into one
   `signal_cluster`.
4. **Route**: persisted, published.
5. Agent worker opens an investigation:
   `TRIAGE → CLASSIFY_DOMAIN → GATHER → HYPOTHESIZE → VERIFY → CONCLUDE`.
   Gather calls `neighborhood()`, `facts_about()` (returns
   "incident-service HAS_FAILURE_MODE pool-exhaustion, valid
   2026-06-02→present, provenance episode E-311/INC-1902"),
   `list_changes_in_window()` → the change request, `get_security_findings()`
   → the red herring.
6. `CLASSIFY_DOMAIN` emits `change-induced 0.82`, rejects `security 0.11`
   (finding subject isn't on the dependency path, no temporal precedence)
   and `pure-observability 0.07` — evidence for each rejection recorded.
7. Concludes; recommends the runbook that resolved the same failure mode
   previously (retrieved from memory). Surfaced for human approval (L1).
8. **Write-back**: a new Episode, new facts
   `(ChangeRequest)-CAUSED->(Investigation)` and a confidence bump on
   `(pool-exhaustion)-RESOLVED_BY->(Runbook)`; an incident is created via the
   existing incident-service API with the analysis attached.

## 9. LLM provider & data egress

No LLM provider is chosen yet. Multi-step tool-calling investigations are
token-heavy, and §8.1 shows there is no RAM budget for in-cluster inference
— tenant telemetry has to leave the cluster to a remote LLM API for every
investigation. **Decision: accept this, as a documented, explicit
exception** to the "security/safety/privacy parity" principle in
`ai-platform-design/design-considerations.md` (#3). Reasoning to record
there: demo/reference project, synthetic and seeded data through most of the
build phases, no real customer data in scope until well past this design.
Mitigations: a guardrails redaction pass (PII/secrets) before any payload
leaves the cluster — reusing the guardrails pattern already referenced in
`ai-platform-design/synthetic-rca-eval-*.md` — and a pinned model version +
temperature=0 recorded per investigation, so eval runs stay comparable
across time.

## 10. Repo structure

```
ai-platform-design/                    ← existing governance docs, extended
├── design-considerations.md               (amend: record the egress exception, §9)
├── intent-and-build-guide.md              (unchanged)
├── synthetic-rca-eval-*.md                (amend: see §13)
├── fusion-architecture.md            ← NEW: this design, promoted to living reference
├── signal-contract.md                ← NEW: SynapSignal spec, versioned
└── graph-model.md                    ← NEW: node-key spec, topology + memory schemas

services/
├── ai-service/                       ← empty shell today → becomes the platform front door
│   └── app/
│       ├── main.py config.py db.py telemetry.py       (mirror asset-service conventions)
│       ├── api/{investigations,graph,memory}.py
│       ├── agents/{orchestrator,classifier,sre,security,change}.py
│       ├── tools/{prometheus,loki,jaeger,k8s,graph,memory,itsm,security}.py
│       ├── runtime/{state_machine,evidence_ledger,policy_gate,autonomy}.py
│       └── worker.py                                  (2nd entrypoint, same image)
├── signal-service/                   ← NEW: the ingestion pipeline
│   └── app/{adapters/,normalize.py,enrich.py,reduce.py,route.py,api.py,worker.py}
├── libs/synap-graph/                 ← NEW: GraphStore port, two drivers
│   └── drivers/{memgraph_topology.py, postgres_memory.py}
├── incident-service/                 ← extended: change_requests, outbox events
├── asset-service/                    ← extended: node_key CI linkage
├── user-service/                     ← extended: agent service identities
└── frontend/                         ← extended: new hero screens (§13)

database/
├── migrations/000006_signals … 000012_enable_pgvector   ← memory-graph tables here
└── seeds/{security-findings/, change-requests/, topology/, historical-episodes/}   ← NEW

tests/synthetic/                      ← NEW (currently just a .gitkeep)
└── fusion_rca/                       ← first suite, per the existing eval blueprint (§14)
    └── (schema_loader, evidence_sources, scoring, mock backends, scenarios/, _baseline/)

design_handoff_synap/
├── reference/                        ← kept untouched — still the spec for kept screens
└── reference-fusion/                 ← NEW prototypes (§13)

infra/helm/itsm-app/templates/{ai-service,signal-service,graph-store,notification-service}/  ← NEW
infra/k8s/istio/virtual-services/*    ← add /api/v1/ai/*, /api/v1/signals/*, /api/v1/graph/*
infra/k8s/opa/policy-configmap.yaml   ← add rules for new paths + agent roles
docs/platform/07_AI_Platform_Architecture.md   ← currently a stub; becomes this design's operational home
```

Two build-system consequences to plan for, not discover mid-build:
`libs/synap-graph` requires changing the Docker build context from
per-service directory to repo root (touches every service's Dockerfile + CI
workflow, ~3 lines each). And on the Helm chart split: this doesn't justify
jumping ahead of P-Phase 7 (the umbrella chart still works, ArgoCD still
isn't the deployment driver), but it does justify pulling the
**`itsm-microservice` Helm *library chart* forward now** — a pure refactor
of the Deployment/Service/HPA templates that already repeat 6× — so the
eventual P-Phase 7 split is mechanical instead of a rewrite.

## 11. Revised roadmap

Old Sprint 1–11 numbering is retired. Six phases, Phase 0 preserved
untouched.

| Phase | Content | Exit criteria |
|---|---|---|
| **0 — Preserved** | P-Phases 1–5 (done), Sprint 0 (tokens/primitives), Sprint 1 (Login/MFA) | Already met — don't touch |
| **1 — Substrate** | P-Phase 6 observability *actually deployed* (pulled forward from its original post-UI slot); `SynapSignal` contract + `signal-service`; Memgraph + memory-graph migrations; topology reconciler; `SecurityFinding` + `ChangeRequest` schemas and seed data | 47 seeded signals collapse to 1 cluster via the API; `neighborhood()` on a live service matches `kubectl` reality; a contradicting fact invalidates its predecessor with provenance intact |
| **2 — Reasoning** | Eval scenarios written *before* the agent (schemas + answer keys define the target); agent state machine, tool layer, evidence ledger, domain classifier, agent identities + OPA rules; P-Phase 7 (CI/CD) pulled forward so the eval suite runs in CI | The worked example (§8) produces the right domain classification, root cause, and a complete evidence ledger; green Axis-1 suite with a reported Axis-1→Axis-2 gap |
| **3 — Surfaces** | New prototypes designed *after* Phase 2 stabilizes the signal/output shapes, then pixel-matched: Unified Signal Console, Operational Graph Explorer, Investigation Detail. App Shell rebuilt with fusion-oriented nav (`Investigate / Operate / Prevent / Inventory / Insights`) | The worked example is demonstrable end-to-end in the browser against real backend data |
| **4 — ServiceOps fusion** | `change_requests` as a real incident-service table; incidents become investigation *outcomes* rather than manually-created rows; **Prevent** — score a proposed change against both graphs before it ships | — |
| **5 — Live signals + autonomy** | Falco DaemonSet wired to the already-built ingest endpoint (budget permitting); postmortem/handoff/KB-draft agents, each with its own tracked autonomy level; L2 actions double-gated by OPA + graph blast-radius | — |
| **6 — Remaining surfaces** | End-user portal, Knowledge Base (RAG over memory-graph episodes), Analytics, Admin (+ AI Governance: autonomy levels, approvals, eval scores), Global Copilot/⌘K — all redrawn fusion-aware | — |

Scope note carried from Gartner's own priority matrix (§2): "table stakes"
quick wins (plain ticket categorization, request summarization, generic
RAG-based KB search with no graph involvement) are deliberately **not**
pulled into Phases 1–4 — they'd dilute focus away from the actual
differentiator. RAG-based KB search is the one exception, and only because
it falls out naturally from the memory graph already existing by Phase 6.

## 12. Screen disposition

Every screen in the existing prototype set, evaluated for reuse:

| Screen | Prototype | Disposition |
|---|---|---|
| Login / MFA / forgot-password | `auth.jsx` | **Kept as-is** — built, don't touch |
| Design tokens + primitives | `styles.css`, `ui.jsx` | **Kept**, extended with graph-node/edge, time-scrubber, evidence-row, domain-chip primitives |
| App Shell | `shell.jsx` | **Adapted** — chrome kept, nav regrouped around the fusion story |
| AIOps Event Console | `aiops.jsx` | **Superseded** by Unified Signal Console (its correlation viz seeds the new design) |
| Service Map | `inventory.jsx → ServiceMap` | **Superseded** by Operational Graph Explorer |
| Incidents list + detail | `incidents.jsx` | **Adapted** — detail gains an Investigation tab |
| Ops Dashboard | `dashboard.jsx` | **Adapted** — hero becomes active investigations by domain + signal volume + real noise-reduction numbers |
| CMDB / Discovery | `inventory.jsx → Cmdb` | **Adapted** — becomes a view onto the self-maintaining topology graph |
| Monitoring | `modules.jsx → Monitoring` | **Adapted** — drill from chart → signal → investigation |
| Knowledge Base | `modules.jsx → Knowledge` | **Adapted** — articles become memory episodes with provenance |
| Admin | `modules.jsx → Admin` | **Adapted** — adds AI Governance (autonomy, identities, approvals, eval scores) |
| Global Copilot / ⌘K | `copilot.jsx` | **Adapted** — real agent runtime behind it, not scripted |
| Assets, Cloud & Infra, Analytics | `inventory.jsx`, `modules.jsx` | **Kept**, deferred to Phase 6 |
| End-user Portal | `portal.jsx` | **Kept**, deferred to Phase 6 |
| **Unified Signal Console** | — | **New prototype** (Phase 3) |
| **Operational Graph Explorer** | — | **New prototype** (Phase 3) |
| **Investigation Detail** | — | **New prototype** (Phase 3) |
| **Change Risk / Prevent** | — | **New prototype** (Phase 4) |

## 13. Synthetic-RCA eval amendments

The existing eval blueprint (`ai-platform-design/synthetic-rca-eval-*.md`)
was designed for stateless telemetry fixtures. This architecture needs four
amendments to it:

1. New evidence sources added to `VALID_EVIDENCE_SOURCES`: `topology_graph`,
   `memory_graph`, `security_findings`, `change_events`.
2. A new `domain_classification_match` gate — `CLASSIFY_DOMAIN` (§8.6) is
   the product's core output and is currently unscored by the existing
   blueprint.
3. A new temporal-citation gate — did the agent cite a fact that was
   already invalidated at incident time? Directly testable once the memory
   graph's temporal filtering (§8.4) exists.
4. **Memory-graph snapshot fixtures.** The memory graph structurally breaks
   the eval's determinism contract as written — the agent is meant to get
   smarter over time, but a reproducible benchmark needs it not to. Fix:
   every eval scenario pins an `as_of` timestamp and ships a frozen
   memory-graph snapshot fixture alongside its evidence files, so the same
   scenario always sees the same "past."

## 14. Open items not resolved by this design

- **RAM headroom is a live measurement, not a spreadsheet number.**
  §8.1's ~1.28Gi incremental estimate should be re-verified on the actual
  cluster once P-Phase 6 (observability) is deployed, before Phase 2
  component sizes are finalized.
- **Topology retention.** Liveness stamps (§8.3) bound "what does the graph
  look like now," not "what did it look like when the alert fired." Cheapest
  fix: a daily topology snapshot written into the memory graph as an
  episode. Retention window not yet decided (default proposal: 90 days).
- **`notification-service` is still a stub** (`cmd/main.go` only). The
  agent's entire L1 value is *telling a human something* — this needs to be
  built early in Phase 1/2, since it's on the critical path for the first
  demo even though it isn't called out as its own roadmap line above.
- **New API paths default-deny under OPA.** `/api/v1/ai/*`,
  `/api/v1/signals/*`, `/api/v1/graph/*` need new Rego rules, and the
  `users.role` CHECK constraint needs a migration before agent roles like
  `agent:sre` can be issued.

## 15. Follow-up hygiene task (not part of this design's build sequence)

Convert `agentic-ai-hub/agentic-ai-hub` from an accidental gitlink into a
proper git submodule with a `.gitmodules` entry pointing at
`github.com/Preet2fun/agentic-ai-hub.git` (decision recorded in §4). This is
independent of the phases in §11 and should be done as a standalone git
hygiene commit before any repo restructuring in Phase 1 touches nearby
paths.

## 16. Critical files for an implementation plan to start from

- `.claude/CLAUDE.md` — the binding constraint set; the resource-limit table
  and phase-status tracker both need amending for this reset
- `database/migrations/000002_tenant_schema_function.up.sql` — every new
  signal/graph/investigation table must be added here to inherit
  schema-per-tenant isolation
- `services/incident-service/app/mq.py` — the existing RabbitMQ publisher
  the ITSM ingestion adapter consumes; defines the event shape to normalize
  from
- `services/asset-service/app/db.py` — the `tenant_session()` /
  `search_path` pattern every new Python service must replicate verbatim
- `infra/helm/itsm-app/values.yaml` — where `signal-service`,
  `synap-worker`, `graph-store`, and `ai-service` resource entries land
- `ai-platform-design/design-considerations.md` — needs the egress
  exception from §9 recorded
- `ai-platform-design/synthetic-rca-eval-design-considerations.md` and
  `synthetic-rca-eval-build-blueprint.md` — need the four amendments from
  §13

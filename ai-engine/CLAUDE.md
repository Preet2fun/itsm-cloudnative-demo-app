# CLAUDE.md — AI Engine

This file is loaded automatically for everything under `ai-engine/`. It governs
every agent, doc, prompt, and eval built in this folder. Read it before
writing any agent design, prompt, graph, or eval fixture here.

---

## 1. The Three Use-Case Tracks — hard rule on examples

This program builds agentic AI for exactly three use-case tracks. **Every
example in every doc, prompt, test fixture, or design note under `ai-engine/`
must be drawn from one of these three.** Never invent a generic/other-domain
example (no "customer support bot," no "e-commerce recommendation agent," no
made-up SaaS scenario) to illustrate a point — pick SRE, ITSM, or Security
instead, even for a throwaway example.

| Track | Scope | Primary reference docs |
|---|---|---|
| **SRE** *(= "Observability" — see naming note)* | Incident investigation, insights & risk management, anomaly detection/alerting, incident management orchestration, reliability design | `design/design-considerations.md`, `design/intent-and-build-guide.md`, `design/synthetic-rca-eval-design-considerations.md`, `design/synthetic-rca-eval-build-blueprint.md` |
| **ITSM** | Service desk & conversational AI, knowledge management, incident triage/categorization/routing, problem & RCA, change risk | `research/ai-use-cases/gartner-ai-itsm-use-cases.md`, `research/ai-use-cases/gartner-capability-usecase-mapping.md` |
| **Security** | SOC alert triage, threat/detection correlation, identity & access review — held to the same governance bar as SRE/ITSM | *No dedicated research doc yet — known gap. Do not fabricate vendor case studies for this track the way the ITSM doc has real ones. Use minimal, defensible examples (e.g. "an alert-triage agent correlates a SIEM detection against asset criticality and recent identity/access changes before proposing a response") until real research is added here.* |

**Naming note:** `AI-platform-Architecture/ai-platform-architecture.md` labels
the first track "Observability." That is the same track as "SRE" in this
repo — use **SRE** going forward (it matches the `design/` file naming).
Treat "Observability" in that doc as a synonym, not a fourth track.

---

## 2. The Engineering Harness — non-negotiable for every agent

Every agent built for any of the three tracks must be designed against **all
three** of these disciplines together. A design or PR that only addresses one
or two of them does not ship. These three disciplines are three of the five
pillars in `design/00-pillars-overview.md` (Orchestration =
§2.2–2.3; Memory = §2.1); that doc also covers Tools and Agent Skills as
their own pillars, and a 6-step build journey from idea to production.

### 2.1 Context Engineering

- **Minimum necessary context, not maximum available context.** Stuffing the
  context window with everything retrievable degrades reasoning and costs
  tokens/latency (see `ai-platform-architecture.md` — Key Trade-offs: Latency
  vs Accuracy, Cost vs Autonomy). Retrieve, rank, and trim before injecting.
- **Ground, don't dump.** Retrieved evidence (RAG chunks, past incidents, KB
  articles) must be cited/attributable in the agent's reasoning trace, not
  pasted wholesale into the prompt.
- **Tenant and role scoping is part of context, not an afterthought.** Every
  agent invocation carries the same `X-Tenant-ID` / `X-User-Role` scoping the
  rest of this repo uses (root `CLAUDE.md` §3) — an agent must never retrieve
  or reason over another tenant's data.
- **Continuous access to real production-shaped data.** Per
  `design/design-considerations.md` principle 8 — decisions made on stale or
  synthetic data are unsafe. This applies to all three tracks, not just SRE.
- **Structured over freeform wherever possible.** Prefer typed LangGraph
  `State` schemas over passing raw strings between steps — it keeps context
  auditable and directly testable by the offline evals in §4.

Concrete per-track shape of "what belongs in context before an agent may
reason or act":

| Track | Required context |
|---|---|
| SRE | Observability data (logs/metrics/traces), service topology/dependency graph, failure-domain taxonomy, relevant past incidents (retrieved by similarity) |
| ITSM | Ticket content + work-log history, affected CI + CMDB relationships, recent change records, matching KB articles |
| Security | Alert/detection payload, asset criticality, recent identity/access changes, prior detections on the same asset or identity |

### 2.2 Loop Engineering

The Agent Core Loop defined in `AI-platform-Architecture/ai-platform-architecture.md`
§3.2 (Goal → Plan/Reason → Decide Next Action → Tool Call/Observe →
Reflect/Update State) is mandatory for every agent, implemented as a
LangGraph graph, with these non-negotiables:

- **Explicit termination condition.** Every loop needs a defined
  goal-achieved check **and** a max-iteration ceiling. A loop without a hard
  bound is not shippable — this is the same "trajectory budget" concept
  already required for RCA scoring in
  `design/synthetic-rca-eval-design-considerations.md` principle 7.
- **Checkpointing.** Use a LangGraph checkpointer for every multi-step agent
  so long-running runs survive a restart or failure — required for anything
  beyond a single-shot tool call.
- **Human-in-the-loop is a graph primitive, not a bolt-on.** Use LangGraph's
  `interrupt()` at any step whose autonomy level (see
  `design/design-considerations.md` — Autonomy Levels L0–L4) requires human
  approval before acting. Don't fake it with an out-of-band approval queue.
- **Reflect/Update State must be a real, explicit step.** Every loop
  iteration writes its updated state (evidence gathered, hypotheses ruled
  out) explicitly. This state is exactly what offline eval scoring (§4)
  inspects to verify the agent actually investigated, rather than
  pattern-matched a plausible answer.

### 2.3 Graph Engineering (current LangGraph patterns)

See `design/01-orchestration.md` for the full
step-by-step build guide (supervisor+workers, parallel fan-out, writer+critic
with a per-agent rubric, vision workers, model-per-role selection, failure
modes) — this section states the non-negotiables only. See
`design/02-memory.md`, `design/03-tools.md`, and `design/05-agent-skills.md`
for the Memory, Tools, and Agent Skills pillars respectively.

- **Model the agent as an explicit graph.** Nodes are steps/tools/subagents,
  edges are control flow. Never hide branching logic inside one monolithic
  node or function.
- **Composable, single-purpose subgraphs over one large agent.** This reuses
  the build implication already stated in `design/intent-and-build-guide.md`
  §1: an orchestrator graph calls into smaller reusable agent subgraphs (e.g.
  playbook-navigation, alerting-access, anomaly-detection as separate
  subgraphs feeding an SRE incident-investigation orchestrator) — each
  independently testable, independently assigned an autonomy level,
  independently auditable.
- **Conditional edges for real decisions.** Branching on agent output/state
  goes through LangGraph conditional edges, not `if/else` buried inside a
  tool wrapper — this keeps the decision visible in both the graph structure
  and the Langfuse trace.
- **`Send` for parallel fan-out** wherever a step needs to gather multiple
  independent signals at once (e.g. querying several evidence sources in
  parallel) rather than serializing them.
- **Supervisor/multi-agent pattern for cross-domain orchestration.** A
  supervisor graph routes to track-specific specialist subgraphs; specialist
  subgraphs don't call each other directly.
- **`Store` for long-term/cross-thread memory**, distinct from per-run
  checkpointed state — this is the concrete implementation of the Memory
  Layer's Long-Term/Structured Memory already described in
  `ai-platform-architecture.md` §4.

---

## 3. Framework & Observability — standardized, not "pick per use case"

- **Framework: LangGraph, exclusively**, for every agent built in this repo.
  `ai-platform-architecture.md` §3.1 lists LangGraph/CrewAI/AutoGen/Custom as
  the source diagram's illustrative options — that table stays as a faithful
  transcription of the reference diagram, but it is **not** a menu for this
  repo's actual builds. Every implementation decision here uses LangGraph.
- **Observability: Langfuse (self-hosted, open source), exclusively**, for
  every agent trace, prompt version, and eval score. This is the concrete
  tool filling the "Observability & Monitoring" cross-cutting layer in
  `ai-platform-architecture.md` §8.1 (causal tracing, token-level logging,
  latency/error tracking, cost attribution) — that section names the
  capabilities, Langfuse is how this repo implements them.
- **Span naming** extends the root `CLAUDE.md` §5 convention:
  `itsm.ai.<track>.<operation>`, where `track` ∈ {`sre`, `itsm`, `security`}.
  Examples: `itsm.ai.sre.incident_investigate`, `itsm.ai.itsm.ticket_triage`,
  `itsm.ai.security.alert_triage`. Every span carries `tenant.id` and
  `user.role` per the same root convention.
- Every graph node execution, every tool call, and every LLM call must emit a
  Langfuse trace — no agent step is unobserved.

---

## 4. Agentic Evaluation — online + offline, automated, CI-gated

No agent ships, and no agent change merges, without both of the following.
See `design/04-evaluation.md` for the full step-by-step plan (evaluator
types, the testing pyramid, and how each lifecycle phase from ideation to
production is gated) — this section states the non-negotiables only.

**Offline (pre-merge):**
- Every agent gets a synthetic scenario eval suite following the pattern
  already fully specified in
  `design/synthetic-rca-eval-design-considerations.md` — deterministic,
  pure-function scoring (no LLM-judge, no vibes), difficulty tiers,
  adversarial/forbidden-category fixtures, and trajectory scoring against the
  loop budget from §2.2.
- Tier scenarios into CI cadence by cost: cheap/low-difficulty on every
  commit, expensive/high-difficulty nightly (same doc, principle 10).
- **Determinism is a contract.** A PR that changes agent behavior (prompt,
  graph structure, model, tool) must update its eval fixtures/baseline in the
  same PR, or CI fails. No silent drift.

**Online (production):**
- Every production agent run is scored in Langfuse — automated scorers plus
  captured human feedback where available.
- Regressions surfaced in Langfuse (score drop, latency/cost drift) feed back
  into the offline suite as new fixtures, closing the loop.

**The online/offline split mirrors the Axis 1/Axis 2 idea already in
`design/synthetic-rca-eval-design-considerations.md` principle 6** — offline
proves the agent can reason correctly when evidence is gated exactly like
production; online proves it still holds up against real, messy production
data. Track the gap between the two; a large gap is itself a signal, not just
a score.

---

## 5. Reference index

- `design/design-considerations.md` — governing principles (compliance,
  security/safety parity, autonomy levels L0–L4, human-in-the-loop policy) —
  applies to all three tracks, not only SRE.
- `design/intent-and-build-guide.md` — SRE build domains and sequencing.
- `design/00-pillars-overview.md` — the umbrella framework:
  all 5 pillars (Orchestration, Memory, Tools, Evaluation, Agent Skills) and
  the 6-step build journey from idea to production.
- `design/01-orchestration.md` — Pillar 1, the full step-by-step
  multi-agent build guide (supervisor+workers, parallel fan-out,
  writer+critic control flow, model-per-role selection, failure modes)
  required in §2.3.
- `design/02-memory.md` — Pillar 2, the CoALA memory taxonomy and the
  per-memory-type write policy backing the context engineering in §2.1.
- `design/03-tools.md` — Pillar 3, grounding: tool categories, the MCP
  interface mandate, and per-tool-call risk gating.
- `design/04-evaluation.md` — Pillar 4, the full step-by-step evaluation plan
  (evaluator types, testing pyramid, lifecycle-phased gates) required in §4.
- `design/05-agent-skills.md` — Pillar 5, explicit procedural memory:
  progressive disclosure, per-agent rubrics, and critic gating.
- `design/synthetic-rca-eval-design-considerations.md` and
  `design/synthetic-rca-eval-build-blueprint.md` — the offline-eval template
  required in §4.
- `AI-platform-Architecture/ai-platform-architecture.md` — the full layered
  reference architecture (client → gateway → orchestration → memory → tools →
  inference → cross-cutting infrastructure).
- `research/ai-use-cases/gartner-ai-itsm-use-cases.md` and
  `gartner-capability-usecase-mapping.md` — ITSM use-case research.
- `services/ai-service/` — the (currently stub) FastAPI service this
  platform runs behind.

# Agentic AI for SRE — Intent & Critical Build Information

> Source note: adapted and generalized from public industry research on
> applying agentic AI to SRE/operations practice. Vendor-specific product and
> tool names have been abstracted to generic technical roles (e.g. "foundation
> LLM", "vector database", "agent development framework") so this stays
> portable across implementations.

## Intent

Modern operations environments — microservice architectures, distributed
infrastructure, complex dependency graphs, and AI-generated code shipping
faster than humans can review it — are outpacing what manual SRE processes
and static threshold-based automation can handle.

The intent of this system is **not** to replace SREs with AI. It's to build a
layer of specialized, single-purpose agents that:

- absorb repetitive/laborious operational work,
- accelerate investigation and decision-making,
- and create feedback loops that continuously improve reliability,

while keeping humans in control of high-risk decisions. This is the "how do
we actually build this" companion to `design-considerations.md` — organized
by the functional domains an SRE agent platform needs to cover, with
**Incident Investigation** and **Insights and Risk Management** as the
critical core, plus the supporting domains that make them possible.

---

## 1. Incident Investigation

**Goal:** agents that investigate incidents and, in select cases,
autonomously mitigate them.

**Required foundation** before an agent can form a hypothesis or propose a
mitigation:

- Observability data — logs, metrics, traces
- System topology / service dependency graph
- Taxonomy of known failure domains and service categories

Only once domain and intent are established from the above should an agent
move on to hypothesis formation and mitigation proposals. Skipping straight
to "what should we do" without this grounding produces confident but wrong
answers.

**Composable building blocks** — build these as separate, reusable
agents/skills, not one monolith:

- Playbook navigation & execution agent
- Alerting-access agent
- Anomaly detection agent
- Incident-insight derivation agent (feeds from Insights & Risk Management,
  below)

**Build implication:** design incident investigation as an orchestrator that
calls into these smaller, single-purpose agents rather than one large agent
trying to do everything. This keeps each piece independently testable,
independently assigned an autonomy level, and independently auditable.

---

## 2. Insights and Risk Management

**Goal:** give agents the equivalent of an experienced SRE's institutional
memory — historical incident context and risk awareness — not just live
telemetry.

**Why this matters:** understanding the end-to-end system and effective
mitigations requires experience and lessons learned from *past* incidents,
plus the ability to reason about risk — not just react to current signals.
Agents don't accumulate tenure the way a human SRE does, so this has to be
built as an explicit system.

**Two components to build:**

**a) Historical knowledge / insight-extraction system**
- Continuously reviews known/closed incidents and extracts structured,
  meaningful information from them (root cause, resolution pattern, affected
  components).
- Makes that extracted knowledge available to agents to drive better
  investigations and mitigation steps.
- Technical approach: an embedding model plus a vector-enabled database, so
  past incidents can be retrieved by semantic similarity to a current
  situation — not just exact keyword match.

**b) Risk insights component**
- Every incident is tagged with risk categories by the AI system.
- Consumed two ways: (1) by agents *before* applying a mitigation, to weigh
  the risk of the action itself, and (2) by SREs, to identify critical areas
  needing attention.

**Build implication:** this is a prerequisite system, not a nice-to-have.
Incident investigation and mitigation agents are only as good as the
historical/risk knowledge base they can query — build this before or
alongside the investigation agents, not after.

---

## 3. Incident Management (orchestration layer)

**Goal:** an agentic layer on top of the existing incident management
process (roles, responsibilities, tooling) — augmenting it, not replacing it.

Agents to build:

- **Communication monitor/consolidator** — watches every communication
  surface used during an incident (chat, video, tracking docs, incident
  tooling) and summarizes/consolidates it to keep everyone aligned.
- **Handoff assistant** — generates handoff documents with full context when
  responsibility passes between responders.
- **Postmortem drafting agent** — auto-drafts postmortems, improving
  completeness and quality while cutting SRE effort.
- **Internal/external communications agent** — manages status updates and
  stakeholder communication during the incident.

---

## 4. Anomaly Detection & Alerting

**Goal:** move from static SLO thresholds to anomaly-based detection where
workloads are too varied for a single static threshold to make sense.

**Problem with the classic approach:** SLIs/SLOs and static alert thresholds
work when usage is uniform; they break down when a service supports many
different customer workloads and no single threshold fits all of them.

**Pipeline to build:**

1. **Anomaly detection agent** — collects signals, feeds them to a
   forecasting/anomaly-detection model (a time-series forecasting model is a
   reasonable technical choice), and flags deviation from normal behavior
   rather than a fixed threshold.
2. **Alerting agent** — groups, pre-processes, and enriches raw alerts with
   context before they reach a human or another agent.
3. **Autonomous alert handlers** — resolve/mitigate a defined subset of alert
   types without human involvement (bounded by autonomy level, per
   `design-considerations.md`).

Inputs worth incorporating beyond the service's own metrics: historical
signals from prior similar incidents (to predict customer-oriented SLOs), and
out-of-band signals like customer feedback.

**Expected outcome if built correctly:** faster resolution and a meaningful
drop in alert volume SREs must personally review.

**Non-negotiable guardrail** (repeated here because it's most critical for
this domain): transparency about what data is being evaluated and how, plus
consistent controls preventing unwanted production mutations.

---

## 5. Reliability Design

**Goal:** make reliability a first-class part of the design → launch →
deployment lifecycle, not just an operations-time concern.

- Keep a human in the loop for higher-risk services/features — agentic
  automation reduces the *volume* of things a human must personally review,
  not the human's authority over risky decisions.
- Build agents that continuously monitor playbook/runbook usage during real
  incidents and improve the docs based on what actually worked.
- Build agents that can generate new playbooks directly from incident data,
  rather than relying solely on manual documentation after the fact.

---

## Critical Infrastructure & Platform Requirements

Regardless of specific vendor tooling, a build of this kind needs:

- A capable **foundation LLM**, ideally fine-tunable or groundable on
  internal operational data/knowledge — generic model performance won't
  capture org-specific topology, taxonomy, and incident history.
- An **agent development framework/platform** to build, orchestrate, and
  deploy agents consistently (auth, observability, versioning) rather than
  one-off scripts per agent.
- **MCP (Model Context Protocol) servers/tools** as the standard interface
  between agents and internal systems — well-documented, so agents can
  discover and use tooling correctly.
- **Standard observability infrastructure** (metrics, logs, traces) that
  agents can query directly — this is the technical realization of the
  "continuous access to production data" principle.
- A **vector database + embedding model** pair to power the historical
  incident / Insights system.
- An **analytics/data-warehouse layer** capable of running the AI/ML
  workloads (embedding generation, batch scoring, forecasting) at production
  scale.
- A **time-series forecasting/anomaly-detection model** for the alerting
  pipeline.

## Build Sequencing Recommendation

Build order should roughly follow the dependency chain above, not feature
priority alone:

1. Observability + topology/taxonomy foundation — nothing else works without
   this
2. Insights & Risk Management knowledge base — incident investigation
   depends on this
3. Incident Investigation agents — composable building blocks: playbook,
   alerting-access, anomaly-detection, insight-derivation
4. Anomaly Detection & Alerting pipeline
5. Incident Management orchestration layer — communication, handoff,
   postmortem, comms agents
6. Reliability Design agents — playbook improvement/generation; benefits
   from real incident data already flowing from the stages above

Every stage must be evaluated against the principles, success criteria,
guardrails, and autonomy levels in `design-considerations.md` before its
scope is expanded.

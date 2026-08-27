# Pillar 2 — Memory

The Memory half of `Agent = LLM + Code + Memory` (`00-pillars-overview.md`
§1). Every example below is SRE/Observability or Security.

## 1. The CoALA Memory Taxonomy

CoALA splits memory into one short-term type and three long-term types —
not one undifferentiated "context" bucket:

| Memory type | CoALA's definition | In this repo |
|---|---|---|
| **Working memory** | Information for the current decision cycle only — ephemeral, gone once the cycle ends | Typed LangGraph `State` fields: evidence gathered, hypotheses ruled out mid-run |
| **Episodic memory** | A record of specific past *experience* — what happened, not a general rule | A specific past incident and how it was resolved |
| **Semantic memory** | General *knowledge* — facts and relationships, decontextualized from any one event | Service topology, the failure-domain taxonomy, asset-criticality ratings |
| **Procedural memory** | *How* to do something — split into **implicit** (the LLM's own weights) and **explicit** (agent code, prompts, rubrics, retrieval strategy) | This repo never fine-tunes (implicit is out of scope); explicit procedural memory is `05-agent-skills.md`'s entire subject |

**Why the split matters, concretely:** an SRE agent's episodic memory (a
past connection-pool-exhaustion incident) and its semantic memory (the
service's dependency graph) answer two different questions — "has this
happened before, and how was it fixed" vs. "what does this service
actually depend on, right now" — and they update on entirely different
triggers (§2 below). Collapsing them into one "knowledge base" makes both
questions harder to answer correctly.

---

## 2. When to Write: An Update Policy Per Memory Type

Memory that anyone can write, anytime, from any confidence level, isn't
memory — it's noise with extra steps. CoALA's own "Guide Building of Future
Language Agents" section frames this as "Learning" (Action Space, internal)
split by which memory it targets. This section is that policy, made
concrete for this repo's stack.

### Episodic writes

**Trigger: on close, not mid-task.** An episodic write happens only after
the outcome is confirmed — not as a live scratchpad during investigation.

- **SRE/Observability example:** a resolved incident's root cause and
  resolution steps write to episodic memory only after the postmortem is
  reviewed and approved (`05-agent-skills.md` §3's rubric gate) — not
  during triage, while the root cause is still a hypothesis. Writing mid-
  investigation would let a wrong early guess get retrieved as if it were
  confirmed fact on the next similar incident.
- **Security example:** a closed alert investigation (true/false-positive
  verdict plus the evidence that supported it) writes to episodic memory
  only after SOC analyst sign-off — an investigation still in progress
  never contributes to future retrieval, so an ambiguous, unresolved alert
  can't poison the next investigation that resembles it.

### Semantic writes

**Trigger: on a confirmed, reviewed fact — never a hypothesis.** Semantic
memory is general knowledge; writing an unverified claim into it corrupts
every future retrieval that depends on it, not just the current task.

- **SRE/Observability example:** the service topology and failure-domain
  taxonomy update through a reviewed change — e.g. a new service's
  dependency edges get added to the topology graph after a deploy is
  confirmed, never inferred mid-incident from an agent's guess about what
  probably depends on what.
- **Security example:** asset-criticality ratings and identity/access
  baselines update on a scheduled review cycle or a confirmed CMDB/org-
  chart change — never from a single alert's unverified claim, even if that
  alert turns out to be correct. One correct-by-luck inference is not the
  same evidence bar as a reviewed change.

### Procedural writes (explicit)

**Trigger: a reviewed PR, through Langfuse prompt management — never
inline.** This is CoALA's highest-risk, least-studied form of agent
learning, and the repo already has the infrastructure to make it safe: a
rubric or system-prompt change is a versioned artifact
(`05-agent-skills.md` §3), diffable and rollback-able, not a live edit an
agent (or a person, casually) makes mid-session.

- **Why this is stricter than episodic/semantic:** a bad episodic or
  semantic write corrupts one fact. A bad procedural write changes *how
  every future task gets reasoned about* — the blast radius is
  categorically larger, which is exactly why CoALA flags implicit
  procedural updates (fine-tuning) as the riskiest form of learning a
  language agent can do. This repo avoids that risk entirely by never
  fine-tuning — all procedural learning here is explicit and reviewed.

---

## 3. Learning as the Third Internal Action

CoALA names three internal actions: Reasoning and Retrieval
(`01-orchestration.md` §1) and **Learning** — writing to long-term memory,
which is everything in §2 above. A node that never writes to episodic or
semantic memory can still reason and retrieve, but it never gets better
across incidents — it re-derives the same conclusion from scratch every
time a similar SRE incident or security alert recurs. Learning is what
CoALA's own "reveal lots of gaps" framing points at: most shipped agents
implement Reasoning and Retrieval well and Learning barely at all. The
write-policy in §2 is this repo's answer to that gap — narrow and
deliberate, not absent.

---

## 4. Mapping to LangGraph Primitives

| Memory type | LangGraph primitive |
|---|---|
| Working memory | Typed `State` fields, scoped to one graph run |
| Episodic / semantic memory | `Store` — cross-thread, keyed for retrieval-by-similarity (episodic) or retrieval-by-exact-key (semantic) |
| Session memory (multi-turn state within one run) | The checkpointer, per-thread |
| Explicit procedural memory | Not a LangGraph primitive — lives in Langfuse prompt management (`CLAUDE.md` §3), fetched at node-init time, not stored in graph state at all |

**A `Store` write is not automatic.** Nothing in LangGraph enforces the §2
policy for you — a node can call `store.put(...)` from anywhere in its
execution. The policy is enforced by *where in the graph* the write call is
placed (the node that runs after the rubric-gated approval, not the node
that runs during triage), which is a design decision, not a LangGraph
setting.

---

## 5. Failure Mode: Supervisor Bloat

| Symptom | Fix |
|---|---|
| Supervisor's working memory fills with raw worker output | Workers return summaries only; detail goes to episodic/semantic memory via `Store` (§4), never inline in the supervisor's `State` |

**Delegation *is* memory management.** A supervisor that accumulates every
worker's full raw output in its own working memory hasn't built a
multi-agent system — it's built one enormous context window with extra
function calls. The fix is structural, not a prompt instruction: a worker
node's `Command` update (`01-orchestration.md` §3) carries only a summary
string, by construction — there's no raw output left for the supervisor to
accumulate.

---

## 6. Quick-Reference Checklist

- [ ] All four memory types are identified explicitly for this
      agent/system — what's working vs. episodic vs. semantic vs.
      procedural is a decision, not an accident (§1)
- [ ] Episodic writes happen on close, not mid-task (§2)
- [ ] Semantic writes happen only on a confirmed, reviewed fact (§2)
- [ ] Procedural writes go through Langfuse prompt management on a
      reviewed PR — never inline (§2)
- [ ] Long-term memory uses `Store`; working memory uses `State`; nothing
      long-term is smuggled into `State` just because it's convenient (§4)
- [ ] Workers return summaries, not raw output — detail lives in memory,
      not the supervisor's working memory (§5)

---

## Reference index

- `00-pillars-overview.md` — the umbrella 5-pillar framework this doc is
  the full depth for (Pillar 2, Memory).
- `ai-engine/CLAUDE.md` §2.1 — context engineering (minimum necessary
  context, ground don't dump, tenant/role scoping as part of context).
- `01-orchestration.md` §1 — Reasoning and Retrieval, CoALA's other two
  internal actions, owned by the Orchestration pillar.
- `05-agent-skills.md` — explicit procedural memory in full depth (the
  other half of CoALA's procedural memory category).
- `intent-and-build-guide.md` §2 — the Insights/vector-DB system that
  implements episodic memory for SRE (historical incidents, retrieved by
  similarity).

### External industry sources

- arXiv 2309.02427, ["Cognitive Architectures for Language Agents"
  (CoALA)](https://arxiv.org/abs/2309.02427) (Sumers et al.) — the entire
  taxonomy and write-policy framing in this file.
- Anthropic, ["Effective context engineering for AI
  agents"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
  — backs compaction and structured note-taking as techniques for when
  working/session memory grows too large.

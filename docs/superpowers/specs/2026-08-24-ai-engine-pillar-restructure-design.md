# AI Engine Design Folder — 5-Pillar / CoALA Restructure — Design

Status: proposed, pending user review
Scope: `ai-engine/design/` only — reorganizing and rewriting
`evals-guidelines.md`, `agent-internal-architecture-guidelines.md`, and
`agentic-system-pillars-guidelines.md` into 6 files. No code, no other
folders. `design-considerations.md`, `intent-and-build-guide.md`,
`synthetic-rca-eval-design-considerations.md`, and
`synthetic-rca-eval-build-blueprint.md` stay untouched, cross-referenced.

## 1. Motivation

The design folder currently has three guideline docs that grew organically
across several sessions: `evals-guidelines.md` (Evaluation pillar, already
solid), `agent-internal-architecture-guidelines.md` (Orchestration pillar,
but framed around a `deepagents`-library "crew" abstraction we're not
using), and `agentic-system-pillars-guidelines.md` (umbrella framework, with
Memory/Tools/Agent Skills pillar content only lightly developed).

Two things need to change:

1. **Vendor and framework neutrality.** This repo uses LangGraph
   exclusively (`ai-engine/CLAUDE.md` §3) — there is no "crew" abstraction,
   no `deepagents` dependency, and the docs should not read as if built
   around one. Specific illustrative model names and named commercial
   products (used as evidence) don't belong in a core-design-principles
   folder either.
2. **A real theoretical spine.** CoALA ("Cognitive Architectures for
   Language Agents," arXiv 2309.02427) already grounded several of the
   gap-check fixes made to these docs this session (the episodic/semantic/
   procedural memory split, the "when memory grows too large" note). This
   restructure makes CoALA the organizing frame for the whole folder, not
   just a citation inside one section — `Agent = LLM + Code + Memory` as
   the opening mental model, with the 5 pillars mapped explicitly onto
   CoALA's Memory / Action Space / Decision-Making categories.

## 2. File structure

Six files replace the current three:

| File | Replaces / sourced from |
|---|---|
| `00-pillars-overview.md` | Trimmed `agentic-system-pillars-guidelines.md` |
| `01-orchestration.md` | Patterns/loop content from `agent-internal-architecture-guidelines.md` |
| `02-memory.md` | Memory section of `agentic-system-pillars-guidelines.md`, substantially expanded |
| `03-tools.md` | Tools section of `agentic-system-pillars-guidelines.md` + vision-worker content from `agent-internal-architecture-guidelines.md` |
| `04-evaluation.md` | `evals-guidelines.md`, near-verbatim |
| `05-agent-skills.md` | Agent Skills section of `agentic-system-pillars-guidelines.md` + rubric-design content from `agent-internal-architecture-guidelines.md` |

Numbered prefix so the folder sorts in build order in any file browser.

## 3. CoALA → pillar mapping (resolves the "5 pillars don't 1:1 match CoALA's 3 categories" gap)

| CoALA category | Our pillar(s) | Where |
|---|---|---|
| Memory (working/episodic/semantic/procedural) | Memory | `02-memory.md` |
| Action Space — internal: Reasoning, Retrieval | Orchestration (the decision loop reasons and retrieves) | `01-orchestration.md` |
| Action Space — internal: Learning (writes long-term memory) | Memory | `02-memory.md` |
| Action Space — external: Grounding | Tools | `03-tools.md` |
| Decision-Making (Observation → Proposal/Evaluation/Selection → Execution) | Orchestration | `01-orchestration.md` |
| (not a CoALA category — our own addition) | Evaluation | `04-evaluation.md` |
| Procedural memory, explicit half (skills/routines/prompts, as opposed to implicit LLM-weight knowledge) | Agent Skills | `05-agent-skills.md` |

No 6th pillar added. Evaluation remains the one pillar without a direct
CoALA analog — CoALA doesn't have a testing/verification category, which is
worth saying explicitly in `00-pillars-overview.md` rather than forcing a
mapping that doesn't exist.

## 4. Per-file content plan

### `00-pillars-overview.md`

- Opens with `Agent = LLM + Code + Memory` (CoALA's own framing) instead of
  jumping straight to "5 pillars."
- 5-pillar table: pointers only, one line each, no deep content.
- The CoALA mapping table from §3 above.
- 6-Step Build Journey (Define → Design SOP → Build MVP → Connect &
  Orchestrate → Test & Iterate → Deploy & Monitor) — stays here since it's
  cross-pillar, not owned by any one pillar file. Worked example switches
  from the "SRE Postmortem Crew" naming to "the SRE incident-investigation
  multi-agent system," consistent with the crew→multi-agent-system rename.
- Cross-pillar meta-checklist: "did you address all 5 pillars," pointing to
  each file's own detailed checklist rather than repeating them.
- Trimmed reference index (cross-pillar sources only: CoALA paper, the
  6-step-journey sources).

### `01-orchestration.md`

- ReAct loop, merged with CoALA's Planning cycle: Observation → Proposal →
  Evaluation → Selection → Execution, recurring. CoALA names
  Proposal/Evaluation as distinct sub-steps where our current doc collapses
  them into one "Reason About Task" box — this file adopts CoALA's more
  precise shape.
- Reasoning + Retrieval named explicitly as CoALA's internal actions that
  live in this pillar.
- The three patterns: Supervisor+Workers, Parallel Fan-Out, Writer+Critic
  **control flow only** (draft → critique → revise, capped rounds,
  conditional routing, `interrupt()` on cap-hit). The rubric-design content
  — what the critic actually checks — moves to `05-agent-skills.md` (see
  below); this file keeps the graph shape, not the guardrail spec.
- All code examples rewritten as pure LangGraph: `StateGraph`, `add_node`,
  `add_conditional_edges`, `Send` for parallel fan-out, `interrupt()` for
  human-in-the-loop escalation, `Command` for routing. No `deepagents`
  import anywhere; no `create_deep_agent()`.
- Model-selection guidance ("right model for the job") stays, but with
  generic role placeholders instead of named models (see §5).
- **Code split for the critic loop** (resolves an ambiguity in the current
  single code block, which interleaves both concerns): this file shows only
  the **graph wiring** — `add_node("critic", critic_node)`,
  `add_conditional_edges("critic", route_from_critic, {...})`,
  `interrupt()`-based escalation on cap-hit — with a one-line pointer to
  `05-agent-skills.md` for what `critic_node` actually checks. The rubric
  constant, the `CriticVerdict` schema, and the full `critic_node` body live
  in `05-agent-skills.md`, not here.
- Failure mode owned here: **Runaway loop** only.
- Examples: SRE incident-investigation multi-agent system (the renamed
  postmortem-drafting system) as primary; a Security alert-triage
  supervisor+fan-out as the contrasting example.

### `02-memory.md` — the substantial new-content file

- Full CoALA memory taxonomy with CoALA's own definitions (not our looser
  paraphrase): working memory, episodic memory, semantic memory, procedural
  memory (implicit — LLM weights, out of scope since we don't fine-tune —
  and explicit — skills/prompts/retrieval strategy, cross-referenced to
  `05-agent-skills.md`).
- **New: an explicit "when to write" policy per memory type** — currently
  missing from the folder entirely. Structured after CoALA's own "Updating
  episodic memory with experience / Updating semantic memory with knowledge
  / Updating procedural memory" sections:
  - *Episodic writes* — on investigation/incident close, not mid-investigation.
    Observability example: a resolved incident's root cause + resolution
    steps get written to the episodic store only after the postmortem is
    approved, not as a live scratchpad during triage. Security example: a
    closed alert investigation (true/false positive verdict + evidence)
    writes to episodic memory only after SOC analyst sign-off, so a
    still-open, ambiguous investigation never pollutes future retrieval.
  - *Semantic writes* — only on a confirmed, reviewed fact, never a
    hypothesis. Observability example: service topology and the
    failure-domain taxonomy update only through a reviewed change (e.g. a
    new service's dependency edges added to the topology graph after a
    deploy, not inferred mid-incident from a guess). Security example:
    asset-criticality ratings and identity/access baselines update on a
    scheduled review cycle or a confirmed org-chart/CMDB change, never from
    a single alert's unverified claim.
  - *Procedural writes (explicit)* — rubric/prompt/skill changes go only
    through the versioned Langfuse prompt-management path (already
    established in this session's fixes), never inline, and only on a
    reviewed PR — mirrors CoALA's point that procedural updates are the
    highest-risk, least-studied form of agent learning.
  - Mapped onto our LangGraph primitives: `Store` for cross-thread episodic/
    semantic writes, checkpointer for session memory, `State` fields for
    working memory.
- Learning (CoALA's third internal action — "write long-term memory")
  formally lives in this file, cross-referenced from `01-orchestration.md`.
- Failure mode owned here: **Supervisor bloat** (a memory-discipline
  failure — detail belongs in files/episodic store, not raw in the
  supervisor's working memory).
- Examples throughout: SRE/Observability (Insights vector DB as episodic,
  topology/taxonomy as semantic) and Security (prior detections as
  episodic, identity/asset baselines as semantic) — no ITSM examples in
  this file specifically, per your steer toward observability/security for
  the CoALA-concept explanations.

### `03-tools.md`

- Grounding named explicitly as CoALA's one external action category —
  everything in this file is a grounding action.
- Tool categories table (File Operations, Execution, Web & Search,
  Sub-Agents, MCP Servers), MCP mandate, per-tool-call risk rating —
  content carries over largely unchanged, already vendor-agnostic.
- Vision/multimodal tool-use example migrates here from
  `agent-internal-architecture-guidelines.md` (it's a grounding action, not
  a control-flow pattern) — reframed with an observability example (reading
  a Grafana-style dashboard screenshot) and a security example (reading a
  SIEM alert screenshot or network diagram).
- Failure mode owned here: **Tool call fails** (retry-with-backoff +
  circuit breaker).

### `04-evaluation.md`

- `evals-guidelines.md` content, near-verbatim — already the most
  vendor-agnostic file in the folder.
- Fix the 2 remaining "crew" word instances (in the reconciliation note
  added during the last gap-check round).
- Update cross-references to the new filenames throughout.
- No content removed or restructured beyond that.

### `05-agent-skills.md`

- Progressive disclosure, guardrails — carries over from the pillars doc,
  unchanged.
- **The "every agent needs a rubric, validated by a critic" content moves
  here** from `agent-internal-architecture-guidelines.md`'s Writer+Critic
  section — it's the concrete expression of "guardrailed" (defined inputs/
  outputs/failure mode), and CoALA's explicit-procedural-memory concept: a
  rubric *is* an explicit, inspectable procedure, as opposed to an implicit
  one baked into model weights.
- Rubric table + critic-gate-strength table (full loop vs. single-pass
  gate) carry over from the architecture doc.
- **Code split (see `01-orchestration.md` above):** this file owns the
  rubric constant, the `CriticVerdict` schema, and the full `critic_node`
  body (what gets checked and how the verdict is produced) — the graph
  wiring that calls it lives in `01-orchestration.md`.
- Failure mode owned here: **Worker drift** (a skill/`system_prompt`
  definition failure, not a control-flow bug).
- Examples: an SRE `postmortem-drafting` skill (rubric: evidence-cited root
  cause, quantified impact, blameless tone) and a Security
  `threat-intel-lookup` skill (rubric: cites a real source, flags "no
  intel found" rather than guessing severity).

## 5. Explicit removals (confirmed with user before writing)

1. **"Crew"** (~15+ occurrences across the current 3 docs) → **"multi-agent
   system"** throughout. User-approved rename.
2. **The `deepagents`/`create_deep_agent()` code block** → rewritten as pure
   LangGraph (`StateGraph`, `add_conditional_edges`, `Send`, `interrupt()`).
   Reason: unapproved dependency; zero crew-library framing wanted.
3. **Specific model names** (MiniMax-M2.7, DeepSeek-V3.2, gpt-oss-120b,
   gemma-4-31B-it) → generic role placeholders: "Model A — strong
   tool-calling, long context," "Model B — strong reasoning/critique,"
   "Model C — fast, pure-text," "Model D — multimodal." Reason:
   vendor-agnostic folder; these were already caveated as non-binding, now
   made fully generic.
4. **The "Proof This Works" table** naming Claude Code, Cursor/Windsurf,
   Devin, Manus AI, Open Deep Research → removed, replaced with a prose
   line citing the same academic/engineering sources (Anthropic's
   multi-agent blog, CoALA, OpenAI's guide) without naming commercial
   products. Reason: named commercial products as validating evidence don't
   belong in a vendor-agnostic core-design folder.
5. **The SambaNova/DSD webinar "Implementation reference" blockquotes and
   `session_5`/`session_6` notebook path citations** (in all 3 current
   docs' intros and reference indexes) → dropped entirely (not reduced to a
   footnote — confirmed with user). Reason: a specific commercial
   training-course citation, not a design principle; consistent with every
   other vendor-neutrality removal in this list.

**Not removed** (already-fixed architectural choices, not vendor picks):
LangGraph, Langfuse, MCP. **Not removed** (industry-best-practice citations
— the thing this folder is supposed to contain more of, not less): CoALA,
Anthropic engineering blog posts, OpenAI's practical guide, 12-Factor
Agents, OWASP LLM Top 10, AWS Well-Architected, Hamel Husain's evals
writing, the self-preference-bias and pass^k papers — all redistributed to
their owning pillar file's own "External industry sources" subsection
rather than dropped.

## 6. Example-domain rule (this session's one change request)

Every CoALA-concept illustration — episodic/semantic/procedural memory
writes, grounding actions, orchestration patterns — uses an
**Observability (SRE) or Security** example specifically, not ITSM. This
narrows (not violates) the existing repo-wide rule that examples must be
SRE/ITSM/Security (`ai-engine/CLAUDE.md` §1) — ITSM examples remain fine
elsewhere in the repo, just not the default choice for the new
CoALA-grounded explanatory content in these 6 files.

## 7. Cross-reference updates required outside the 6 files

- `ai-engine/CLAUDE.md` §2.3 and §5 currently point to
  `design/agent-internal-architecture-guidelines.md` and
  `design/evals-guidelines.md` by name — update to the new filenames
  (§2.3 → `01-orchestration.md`; §4/§5 eval pointer → `04-evaluation.md`;
  add pointers to `02-memory.md`, `03-tools.md`, `05-agent-skills.md` where
  §2.1/§2.3 already discuss those concerns).
- The 4 untouched docs (`design-considerations.md`,
  `intent-and-build-guide.md`, `synthetic-rca-eval-design-considerations.md`,
  `synthetic-rca-eval-build-blueprint.md`) don't currently cross-reference
  the 3 old guideline docs by content that would break, but a quick check
  during implementation confirms nothing there needs updating.
- The old files (`evals-guidelines.md`, `agent-internal-architecture-guidelines.md`,
  `agentic-system-pillars-guidelines.md`) are deleted, not left alongside
  the new 6 — this is a rename/restructure, not an addition.

## 8. Execution plan

After user review of this spec: invoke the writing-plans skill to produce
an implementation plan, then execute via an Opus-backed agent (per user's
explicit request), since this is a large, judgment-heavy rewrite better
suited to a stronger model than a mechanical delegate.

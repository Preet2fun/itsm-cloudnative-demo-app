# Pillar 3 — Tools

How Code (`01-orchestration.md`) reaches outside itself. Every example
below is SRE/Observability or Security.

## 1. Grounding: CoALA's External Action

CoALA calls this **grounding** — the one action category that touches
something outside the agent's own reasoning and memory: querying an API,
executing a search, reading a screenshot, calling any MCP tool. Every
other CoALA internal action (Reasoning, Retrieval, Learning) stays inside
the agent; grounding is the only place risk from the outside world enters,
and the only place the agent's actions can affect something outside
itself. That's why gating (§4) is a Tools-pillar concern, not an
Orchestration-pillar one — the loop *decides* to call a tool
(`01-orchestration.md` §1), but what that call is allowed to do is decided
here.

---

## 2. Tool Categories

How agents interact with systems, APIs, and data — the model selects which
tool to call based on the task; that selection *is* function calling.

| Category | What it is | In our stack |
|---|---|---|
| File Operations | Read/search structured evidence | `search_logs`, `read metrics.json`/`deploy_log.txt` — `01-orchestration.md` §3's analyst tools |
| Execution | Mutating actions (deploy, rollback, revoke access) | Risk-rated per tool call (§4); a mutating call needs Autonomy Level **L2+** with `interrupt()` (`design-considerations.md`) — none of this repo's current SRE/Security examples are wired past L1 yet |
| Web & Search | External/semantic lookup | `incident-insight` vector search (SRE), threat-intel lookup (Security) |
| Sub-Agents | Task delegation | Pillar 1's `task()` call — full depth in `01-orchestration.md` §3 |
| MCP Servers | The standard interface layer | Already mandated (`intent-and-build-guide.md`) — every category above should be a scoped MCP tool, not a bespoke function (`01-orchestration.md` §3) |
| Notebooks | Interactive execution environment | Not applicable to this repo's production LangGraph services — skip |

---

## 3. MCP as the Standard Interface

**Every category funnels through one mechanism: MCP.** This is already the
repo's standard, not a new rule — Pillar 3 is naming the categories that
standard has to cover, not introducing a second one.

---

## 4. Gate the Tool Call, Not Just the Agent

**Gate the tool call, not just the agent.** `design-considerations.md`'s
L0–L4 levels are assigned per agent, but risk should be rated per **tool
call** — read vs. write, reversibility, blast radius — so one agent mixing a
safe read tool and a risky write tool doesn't get an all-or-nothing gate.
**Applied:** `deploy_analyst` only ever calls a read-only `deploy_log.txt`
lookup, so it needs no gate at all; contrast the existing `sec-6` fixture in
`04-evaluation.md` §4 ("Auto-revoke the flagged user's access now" →
politely declines, no tool exists at this autonomy level) — that fixture is
already this per-tool-risk discipline in practice.

---

## 5. Agents That See — the Vision/Multimodal Worker

A multimodal worker reads what text can't describe.

- **Input is pixels** — a Grafana dashboard screenshot, not a metrics table.
- The vision model reads the panels and reports **baseline, peak, and
  duration** — the same three facts a human SRE would pull from the same
  screenshot.
- **OpenAI-style content block** — an `image_url` with a base64 data URL,
  alongside the text instruction, in one `HumanMessage`.
- **Findings go to a file** — the rest of the multi-agent system consumes
  them through the shared filesystem, exactly like any other worker's
  summary (`01-orchestration.md` §3).

```python
from langchain_core.messages import HumanMessage

msg = HumanMessage(content=[
    {"type": "text",
     "text": "Read this dashboard. Report baseline, peak, and how long "
             "the spike lasts."},
    {"type": "image_url",
     "image_url": {"url": f"data:image/png;base64,{b64}"}},
])
findings = VISION_MODEL.invoke([msg]).content
# -> "p99 steady ~195ms, spikes to ~3000ms at 14:33, error rate peaks
#     ~21%, recovers by 14:41"
```

This is a grounding action like any other in this file — the only
difference is the tool result is pixels instead of text.

Dashboards, screenshots, architecture diagrams, a photo of a whiteboard —
vision is how a multi-agent system ingests the half of ops evidence that
never made it into text. **Cross-track:** a Security node reads a SIEM
alert screenshot the same way — the mechanism doesn't change, only what's
in the image.

---

## 6. Failure Mode: Tool Call Fails

| Symptom | Fix |
|---|---|
| A worker cascades on a bad result, or fabricates instead of retrying | Retry-with-backoff + circuit breaker on the call — distinct from `recursion_limit` (`01-orchestration.md` §8), which bounds delegation depth, not call attempts |

This is what earns the "Recovery-from-failure" score `04-evaluation.md` §2
measures — a tool call failing is expected and recoverable; the failure
mode is the agent papering over it with a guess instead of retrying or
surfacing the gap.

---

## 7. Quick-Reference Checklist

- [ ] Every tool is a scoped MCP tool, categorized per §2 — not a bespoke
      function bolted on ad hoc
- [ ] Every tool **call** — not just the agent overall — is risk-rated;
      mutating ("Execution") calls are gated at Autonomy Level L2+ with
      `interrupt()` (§4)
- [ ] A vision/multimodal tool is used wherever the source evidence is
      visual (dashboard, diagram, screenshot), not forced through text (§5)
- [ ] Tool calls have retry-with-backoff and a circuit breaker, distinct
      from the orchestration-level recursion limit (§6)

---

## Reference index

- `00-pillars-overview.md` — the umbrella 5-pillar framework this doc is
  the full depth for (Pillar 3, Tools).
- `01-orchestration.md` §1 — the decision loop that calls these tools; this
  file covers what a call is allowed to do, not when it happens.
- `intent-and-build-guide.md` — "MCP servers/tools as the standard
  interface between agents and internal systems," the source of this
  pillar's MCP mandate.
- `design-considerations.md` — autonomy levels L0–L4, the basis for §4's
  per-tool-call risk gating.

### External industry sources

- OpenAI, ["A Practical Guide to Building
  Agents"](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
  — backs per-tool-call risk rating (§4).
- AWS Well-Architected Framework,
  [REL_5](https://wa.aws.amazon.com/wellarchitected/2020-07-02T19-33-23/wat.question.REL_5.en.html)
  — backs retry-with-backoff + circuit breaker (§6).
- Cloud Security Alliance, [Agentic MCP Security Best
  Practices](https://labs.cloudsecurityalliance.org/agentic/agentic-mcp-security-best-practices-v1/)
  — confirms MCP's current adoption as the standard agent-tool interface
  (§3).

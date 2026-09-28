# Plays

What an agent **executes** — one prompt, one output, filed in
[`../outputs/`](../outputs/). **The agent definitions themselves live under
`.claude/agents/`, not in this folder** — same move made for
`ai-discovery/discovery-agent.md` and `ai-prd/prd-agent.md`: this folder
holds the tool-agnostic supporting content (the scoring model, ICP tiers,
signal library, battlecards, examples), the agent definitions are Claude
Code-specific subagent config.

| Play | Agent | One line |
|---|---|---|
| Account research | [`.claude/agents/gtm-account-research.md`](../../../.claude/agents/gtm-account-research.md) | Domain → full intelligence brief + the angle, before any Tier-1 outreach |
| Account scoring | [`.claude/agents/gtm-account-scoring.md`](../../../.claude/agents/gtm-account-scoring.md) | Account or list → score, tier, next action (runs the [`../account-scoring.md`](../account-scoring.md) model) |
| Signal to sequence | [`.claude/agents/gtm-signal-to-sequence.md`](../../../.claude/agents/gtm-signal-to-sequence.md) | Signal + segment → a ready-to-load campaign (brief + full copy + measurement plan) — never sends anything itself |
| Weekly update | [`.claude/agents/gtm-weekly-update.md`](../../../.claude/agents/gtm-weekly-update.md) | Read `ai-gtm/`, flag what's stale, draft the diff, apply on confirm |

Each agent: **Purpose · Inputs · Do · Produce · Gate · Autonomy.** For a
worked output of each, see [`../examples/`](../examples/) (fictional data).
Practical usage guide: [`../how-to-run-gtm-agents.md`](../how-to-run-gtm-agents.md).

In Claude Code, each also has a slash command:
`/gtm-account-research`, `/gtm-account-scoring`, `/gtm-signal-to-sequence`,
`/gtm-weekly-update`.

## Output naming

```
outputs/YYYY-MM-DD-research-<account>.md
outputs/YYYY-MM-DD-scoring-<name>.md
outputs/campaigns/YYYY-MM-DD-<campaign-name>/…
```

## The copy standard — PVP (Permissionless Value Prop)

Every first touch: **remove the CTA. Does the message still have value?** If it's
pointless without the ask, it's a pitch — rewrite it. Plus the
`context-hub/positioning.md` metric rules: time-to-first-hypothesis, never "in
seconds", "you can check its work", fixed-7 competitors only.

*(No `setup` play — Ockham's context is hand-built in `context-hub/`, sharper
than public auto-research.)*

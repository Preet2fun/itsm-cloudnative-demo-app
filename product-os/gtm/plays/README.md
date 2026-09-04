# Plays

What an agent **executes** — one prompt, one output, filed in
[`../outputs/`](../outputs/). Tool-neutral markdown (Claude Code, Cursor, …), not
wired as slash commands — same convention as `ai-prd/stages/` and
`ai-feedback/lenses/`.

| Play | One line |
|---|---|
| [account-research](account-research.md) | Domain → full intelligence brief + the angle, before any Tier-1 outreach |
| [account-scoring](account-scoring.md) | Account or list → score, tier, next action (runs the [`../account-scoring.md`](../account-scoring.md) model) |
| [signal-to-sequence](signal-to-sequence.md) | Signal + segment → a ready-to-load campaign (brief + full copy + measurement plan) |
| [weekly-update](weekly-update.md) | Read `gtm/`, flag what's stale, draft the diff, apply on confirm |

Each: **Purpose · Inputs · Do · Produce · Gate.** For a worked output of each,
see [`../examples/`](../examples/) (fictional data).

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

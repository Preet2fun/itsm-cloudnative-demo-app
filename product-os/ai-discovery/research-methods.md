# Problem-Space Research Methods

The toolkit for stage 03. Use what the idea needs — not all of it every time.
Keep every output tight.

---

## 1. Signal synthesis

Pull from every source the user connects: interview notes, support tickets,
sales-call notes, churn reasons, community threads, usage data.

When a feedback tool (MCP) or a feedback CSV is available, run
[`../ai-feedback/`](../ai-feedback/) first — the **signal-scan** lens returns
volume, trend, severity, segment distribution, and competitor-contrast for the
topic, already tagged `[Feedback: …]`; **pattern-classification** says whether
it's a whole-market gap or one account. This section then adds the qualitative
read on top.

- One row per signal: **what was said / seen · source · date · said vs did**.
- Cluster into themes. A theme backed only by "said" (never observed as "did")
  is weaker — mark it.
- Name the **gap**: what you would expect to find and didn't.

## 2. Jobs-to-be-Done

`When <situation>, I want to <motivation>, so I can <outcome>.`

- One **primary** JTBD; list secondaries.
- The job is stable; the feature is one way to do it — keep them separate.

## 3. Current-state journey map

The steps a user takes **today** to get the job done, without this feature.

| Step | What they do | Friction / time / cost | Workaround |
|---|---|---|---|

Mark where they drop out or route around the product entirely.

## 4. Affected personas

From `../context-hub/icp.md`. Who feels the pain most acutely; how the job
differs by segment; edge-case users worth noting.

## 5. Evidence-gap list

What's **verified** vs what's **assumed**. Every assumption here flows into
stage 05's assumption & risk map. "Not found" is a valid, recorded result — not
a gap to paper over.

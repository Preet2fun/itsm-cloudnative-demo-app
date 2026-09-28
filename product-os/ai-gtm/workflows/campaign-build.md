# Workflow: Campaign Build

Audience → live campaign. A sequence is copy and timing; a **campaign** is a
target segment + a trigger + a measurement plan + a sequence — in that order.
Never write copy before the strategy is clear.

---

## Pre-campaign checklist

- [ ] A clear signal / trigger defines this audience
- [ ] ICP tier and persona are set
- [ ] Estimated audience ≥ 30 accounts (below that, results aren't meaningful —
      lower than the kit's 50 because Ockham's ICP is deliberately narrow)
- [ ] The value prop is differentiated from campaigns already running
- [ ] There's a success metric and an evaluation date

Any "no" → resolve before proceeding.

---

## Phases

1. **Audience definition** (30 min) — the exact accounts, specific enough that
   two people build the same list. Signal(s), tier, persona, status, filters
   (sector, size, cloud, recency). Estimated list + contact count.
2. **Enrichment** — run [`enrichment.md`](enrichment.md). Gate: ≥ 80% complete on
   required fields.
3. **Message strategy** (45 min) — in writing, before copy: the hook (the
   datable trigger), the insight, the one ask, the most relevant proof point, the
   competitor angle if any.
4. **Sequence build** — run [`../plays/signal-to-sequence.md`](../plays/signal-to-sequence.md).
5. **QA** — copy: touch 1 passes PVP · no generic openers · signal hook datable ·
   one CTA · **no "in seconds"** · links + variables work. List: no customers, no
   active opps, no suppressed contacts. Tooling: sequence loaded, variables
   tested, send window Tue–Thu 7–9am local, tracking on.
6. **Launch & monitor** — week 1–2 daily reply-rate watch (pause if < 1% after
   50 sends); week 3–4 first review vs. targets; week 6 full review.

---

## Continue / Iterate / Retire

| Situation | Decision |
|---|---|
| Reply ≥ target, meetings booking | **Continue** — add accounts to the segment |
| Reply ≥ target, no meetings | **Iterate** — the ask or the fit is wrong; rewrite CTA + qualification |
| Reply 50–80% of target | **Iterate** — new subject line + rewrite touch 1 body |
| Reply < 50% of target after 6 weeks | **Retire** — the signal-persona combo isn't working; write two sentences on why |
| Strong week 1–2, then drops | **Iterate** — hook works, later touches don't; rewrite touches 3–4 |
| Signal volume drying up | **Retire** — archive, wait for the next cycle |

When you retire: two sentences in `brief.md` on why. That note is worth more than
the campaign.

---

## Benchmarks

| Metric | Strong | Average | Investigate |
|---|---|---|---|
| Open rate | > 50% | 30–50% | < 30% (subject lines) |
| Reply rate | > 5% | 2–5% | < 2% (body / CTA) |
| Positive reply | > 3% | 1–3% | < 1% |
| Meeting rate | > 2% | 0.5–2% | < 0.5% (qualification / ICP) |

Every completed campaign is archived in `../outputs/campaigns/` with brief, final
copy, results, and learnings. Check the archive before building a similar one.

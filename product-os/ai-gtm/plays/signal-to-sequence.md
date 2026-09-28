# Play — Signal to Sequence

**Purpose:** turn a signal (or a set of accounts sharing one) into a campaign
ready to load into an outbound tool. Connects
[`../signal-library.md`](../signal-library.md) to actual copy.

**Run:**
```
Read gtm/plays/signal-to-sequence.md — build a Tier <2> campaign for accounts
triggering <signal name>, targeting <persona>.
```

**Inputs:** the signal(s); the ICP tier ([`../icp-tiers.md`](../icp-tiers.md));
the persona ([`../personas/`](../personas/)); the relevant battlecard if a
competitor is in play ([`../battlecards/`](../battlecards/)); the copy standard
([`../messaging-by-persona.md`](../messaging-by-persona.md) +
[`../../messaging.md`](../../messaging.md)).

**Do:**
1. **Trigger logic** — single- or multi-signal; minimum score; recency window;
   suppression conditions (from `signal-library.md`). Write it in plain language
   before any copy.
2. **Segment** — by tier, persona, and account status (cold / previously
   contacted / dark opp).
3. **Sequence structure** — touches by tier: Tier 1 → 6–8, all channels, manual
   personalisation on 1–3; Tier 2 → 5–7, email + LinkedIn; Tier 3 → 4–5,
   email-first, templated with a signal variable.
4. **Copy** — write every touch. Touch 1 (Tier 1 & 2) must pass **PVP**: remove
   the CTA, does it still carry value? Structure: signal hook (datable
   observation) → insight → one-sentence connection to Ockham → one frictionless
   CTA. Honour the metric rules — **no "in seconds"**, time-to-first-hypothesis,
   "you can check its work", fixed-7 competitors only. Use the persona's hook and
   the signal's message hook as the starting point.
5. **Measurement plan** — reply / meeting / pipeline targets by tier; what to
   track (reply rate by touch, meeting rate by signal); review at 2 weeks and
   6 weeks.

**Produce — `outputs/campaigns/YYYY-MM-DD-<campaign-name>/`:**
```
brief.md        trigger logic · segments · objectives
sequences/      tier1.md · tier2.md · tier3.md — full copy
metrics.md      targets + measurement plan
results.md      updated as it runs (feeds signal-library.md § Performance Log)
```

*Worked example:* [`../examples/campaign-renewal-price-shock-tier1/`](../examples/campaign-renewal-price-shock-tier1/)
— brief · full sequence copy (PVP-checked) · metrics · 3 weeks of results
(fictional).

**Gate:** touch 1 passes PVP · signal hook is specific and datable · CTA is one
action · suppression list applied · no "in seconds" anywhere · targets set before
launch.

# Playbook: Renewal / Price Shock

**Trigger:** the *Observability renewal / price shock* signal
([`../signal-library.md`](../signal-library.md)) — a Datadog / New Relic / Splunk
renewal in the next 1–2 quarters, or a public reaction to an incumbent price
increase.

**Situation:** the renewal is the only moment the incumbent contract is actually
re-openable. The ICP buyer has no separate security budget to absorb the
increase, so the unified-budget wedge is at maximum leverage.

## The play

1. Confirm the renewal window (procurement job posts, "evaluating alternatives"
   language, community threads). Score the account.
2. Run [`../plays/account-research.md`](../plays/account-research.md). Target the
   **IT Director / CIO** ([`../personas/it-director-cio.md`](../personas/it-director-cio.md)).
3. Lead with **single-platform TCO**: one bill replacing an APM bill *plus* the
   security spend they're about to add anyway. Frame it as a decision to make
   *before* re-signing, not after.
4. Offer a POC scoped to finish before the re-sign date — time-to-first-hypothesis
   on their own telemetry.
5. If a competitor angle is needed, pull the battlecard
   ([`../battlecards/`](../battlecards/)) — but the frame is *cost + convergence*,
   not product-vs-product.

## What to say

> Renewal quotes on [incumbent] are up across the board this year. The teams
> feeling it worst are the ones with no separate security budget to spread the
> cost across — so before you re-sign, worth seeing what one platform for uptime
> *and* security, run by the team you already have, does to the number.

## What not to do

- Don't bash the incumbent's product — the buyer chose it and Bits/Davis are
  genuinely good. Argue cost and convergence, not quality.
- Don't promise "cheaper" without the TCO math (APM + emerging security spend).
- Don't miss the window — after the re-sign, this drops to a Tier-3 nurture.

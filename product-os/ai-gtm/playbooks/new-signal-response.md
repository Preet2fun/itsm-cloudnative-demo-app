# Playbook: New Signal Response

**Trigger:** a Tier-1 or Tier-2 signal fires on an ICP account
([`../signal-library.md`](../signal-library.md)).

## Step 1 — Validate (5 min)

- [ ] Signal is genuine (not a duplicate or data error)
- [ ] Account is ICP-qualified ([`../icp-tiers.md`](../icp-tiers.md))
- [ ] Not suppressed (customer, active opp, recent contact, unsubscribe,
      disqualifier)
- [ ] Signal is fresh (within its recency window; decay applied)

Any fail → log the signal, stop.

## Step 2 — Score (10 min)

Run [`../plays/account-scoring.md`](../plays/account-scoring.md). Record score +
tier.

- ≥ 80 **and** a live Tier-1 behavioural signal → Tier 1 process
- 60–79 (or ≥ 80 with no Tier-1 signal) → Tier 2 process
- < 60 → Tier 3 automated sequence, no manual action

## Tier 1 process (45–60 min · outreach within 48 h)

1. **Research** — [`../plays/account-research.md`](../plays/account-research.md),
   save to `../outputs/`.
2. **Pick the contact** — closest match to a persona, reachable, no contact in
   45 days.
3. **Write the first touch** — hand-written, not templated. Start from the
   signal's message hook and the persona's hook; personalise from the research;
   apply **PVP** (an insight they don't already have). If a competitor is
   involved, pull the battlecard. Route through the matching sales playbook
   (renewal / compliance / ops-vs-attack / cloud-migration) if one applies.
4. **Review & send** — read it aloud; if it sounds AI-written, redo the opening;
   remove anything that could apply to any company; send from the founder / AE.

## Tier 2 process (15 min · sequence within 48 h)

1. Check `../outputs/campaigns/` for a matching active campaign — add the contact
   if one exists.
2. If none: run [`../plays/signal-to-sequence.md`](../plays/signal-to-sequence.md)
   for this signal + persona.
3. Personalise touch 1 with the specific signal event, add to sequence, log.

## After first touch — log in CRM

Signal · date of first touch · contact · sequence (or manual) · signal score at
send. This is what calibrates the signal library over time.

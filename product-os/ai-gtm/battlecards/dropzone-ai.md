# Battlecard: Dropzone.ai

**One-line:** Agentic AI security analyst — autonomously triages alerts,
investigates threats, and delivers reasoned resolution recommendations
(policy checks, misconfig scans, suspicious-auth detection, exposure mapping).
**Market position:** Niche / focused. **Typical buyer:** a SOC or security team
with alert volume to augment.

## Their strengths (be honest)

- Focused, credible agentic-analyst product; the worked CloudTrail → IAM →
  asset-sensitivity → policy → attack-signature chain is exactly the reasoning
  quality to match.
- Clear "AI SOC analyst" narrative.

## Their weaknesses (for our ICP)

- **Assumes a SOC / analyst workflow to augment.** Our ICP has **no SOC** — there
  is no queue for Dropzone to work.
- **Security-only** — no observability, so the "attack or outage" question still
  needs a second tool.
- Detection isn't grounded in the same runtime telemetry the ops team uses.

## Why an ICP account switches

- There's no SOC to augment — they need triage that a one-person security
  function (or the platform team) can actually run.
- They want triage grounded in the same telemetry as the incident investigation,
  one platform, one budget.

## Objection handling

> **"We're evaluating Dropzone to handle alert triage."**
> Dropzone augments a SOC. You don't have one — you have one engineer who just
> picked up security and a platform team. Ockham puts detection where the traces
> and infra state already are, so triage starts with "is this real" and the
> platform team isn't context-switching into a separate security tool.

## Detect the account uses them

- "Dropzone" in job posts / security-vendor mentions
- The account is standing up a SOC / hiring analysts → check ICP fit; a staffed
  SOC is a disqualifier

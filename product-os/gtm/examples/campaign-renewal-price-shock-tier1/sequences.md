# Sequences — Renewal / Price Shock (Tier 1)

> **SAMPLE COPY — fictional. Illustrates the PVP standard and the metric-rule
> guardrails.** Tier-1 example uses Meridian Freight
> ([`../2026-08-14-research-meridian-freight.md`](../2026-08-14-research-meridian-freight.md)).

**Guardrails applied throughout:** no "in seconds"; time-to-first-hypothesis
framing; "you can check its work"; competitor named only as the incumbent, no
comparison table in a cold touch. Every touch-1 passes PVP — remove the CTA and
it still carries a useful insight.

---

## Touch 1 — Email (day 0)

**Subject A:** Before the Datadog renewal
**Subject B:** The line item most tooling reviews miss
**Subject C:** Meridian's Europe launch + the security budget

> Dev,
>
> The "Vendor Manager for Observability & Tooling" hire usually shows up right
> before a renewal, and for a team at Meridian's stage the Datadog number tends
> to move one way.
>
> The part most cost reviews miss: the Europe launch is going to pull a security
> line item into the picture anyway — GDPR posture, customer security
> questionnaires, runtime coverage GuardDuty doesn't give you. That's a second
> vendor and a second bill, or it's the same platform.
>
> One eBPF sensor on your EKS estate can feed both the monitoring you already pay
> for and the runtime security you're about to need. Happy to send the TCO
> breakdown for your review whether or not it goes anywhere — it's a useful
> number to have before you re-sign.
>
> — [Founder]

*PVP check: delete the last line. Still tells Dev something he can act on in his
renewal review. Passes.*

---

## Touch 2 — LinkedIn connection (day 3)

> Dev — sent you a note on the observability renewal and the Europe-launch
> security budget. Would be good to connect here too.

---

## Touch 3 — Email (day 6)

> Dev,
>
> The breakdown I mentioned. For an EKS estate your size, a rough shape:
>
> - Datadog renewal (APM + logs + infra), trending up at renewal
> - \+ a runtime security tool for the Europe requirements (new)
> - vs. one platform: a single sensor feeding both, one contract, one team
>
> The mechanism that makes the "one sensor" part real: it runs at the kernel, so
> the same data that powers your traces also powers runtime threat detection —
> you're not bolting a second agent onto every node.
>
> If it's useful, I can put real numbers against your host count. No deck.
>
> — [Founder]

---

## Touch 4 — Email (day 11)

> Dev,
>
> Different angle. The thing our design partners test first is
> time-to-first-hypothesis — from an alert firing to a ranked, evidence-linked
> explanation of what broke (and whether it was an attack), with the trace and
> log lines that support it so the on-call can check the reasoning before acting.
>
> We can run that on a replayed past incident of yours in a short POC — scoped to
> finish before your renewal date so you have the comparison in hand. Worth a
> 20-minute call to set up?
>
> — [Founder]

---

## Touch 5 — Phone / voicemail (day 16)

> "Dev, [Founder] from Ockham. Left you a couple of notes on the Datadog renewal
> and the Europe security budget. Not trying to be persistent — I just think the
> timing lines up. If I've got that wrong, tell me and I'll stop. Otherwise a
> short call to scope a POC before your renewal would be worth it. [number], or
> reply to the email."

---

## Touch 6 — Break-up email (day 23)

> Dev,
>
> I'll leave it here. If the renewal review lands on "re-sign for now," that's a
> fine outcome — the sensor takes an afternoon to deploy whenever you want the
> comparison.
>
> If it's useful later: the trigger to reach back out is the Europe launch date
> firming up, because that's when the second security bill becomes real.
>
> — [Founder]

---

## Tier-2 variant — what changes

- Touch 1 and 3 templatised: `{{incumbent}}`, `{{renewal_month}}`,
  `{{cloud_estate}}`. Keep the "you're adding security anyway" insight — it's the
  PVP payload.
- Drop touch 5 (no phone for Tier 2).
- Sender: SDR, not founder.

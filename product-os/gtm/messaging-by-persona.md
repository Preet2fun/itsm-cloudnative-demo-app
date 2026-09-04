# Messaging by Persona

What to lead with for each buyer, and what to avoid. Full persona profiles:
[`personas/`](personas/). Source pitches: `../context-hub/positioning.md`
§ "Core pitches by buyer" + [`../messaging.md`](../messaging.md).

---

## Matrix

| Persona | Lead with | Proof points | Avoid |
|---|---|---|---|
| **Economic buyer** — IT Director / Head of Infra / CIO | One team, two toolchains, two bills — for what is really one job. One platform, one budget. | Renewal / TCO math; audit evidence produced without a scramble; peer references at similar-size orgs | Feature lists; "autonomous operations" as the opener; technical depth |
| **Technical buyer** — VP Eng / Head of SRE / IT Ops lead | The 45 minutes on-call spends reconstructing what happened — pulling traces, checking the last deploy, ruling out a security event — is work the agent has already done. | Linked-evidence timeline; eBPF overhead numbers; "nobody writes correlation rules anymore"; a POC on their own telemetry | Marketing claims without specifics; "AI magic"; executive ROI language |
| **Security lead** — first security hire / security-minded platform eng | The first 20 minutes on an alert is "is this real?" — pulling context from systems you don't own. The traces and infra state are in the same place as the detection, so triage starts with the answer. | Detection quality; the evidence chain; compliance mappings + evidence export; CDR / CSPM / VM scope | "Observability company doing security on the side" without the shared-sensor architecture; SIEM-replacement framing |

---

## Per-persona value prop (one line)

- **IT Director / CIO:** "Replace a monitoring bill and a security bill with one
  platform your existing team can run."
- **VP Eng / SRE:** "Your on-call starts every incident from an evidence-backed
  hypothesis instead of a blank query bar — across ops *and* security."
- **Security lead:** "Detection where the telemetry already is — so triage starts
  with 'was this actually anything', and the false positives close themselves."

---

## Anti-messaging — do not say

- **Don't** position as a SIEM replacement — it invites a security-terms bake-off
  against an incumbent and a CISO who buys separately.
- **Don't** lead with "autonomous" in a first touch — only ~17% have deployed
  agents at all; lead with the checkable hypothesis, introduce the trust ramp.
- **Don't** promise "the root cause" — promise a ranked, evidence-linked
  hypothesis you can check.
- **Don't** say "in seconds" — say what it produces.

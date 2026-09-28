# Battlecard: Upwind

**One-line:** eBPF-based cloud security — runtime signals to validate exposure,
"observed vs theoretical risk." The **closest vendor to Ockham's eBPF thesis**,
on the security side only.
**Market position:** Challenger (cloud security). **Typical buyer:** cloud
security teams that already own a posture problem.

## Their strengths (be honest)

- Genuinely strong runtime-security story; the "observed vs theoretical risk"
  framing is the same insight Ockham applies to vuln + CSPM prioritisation
  ([`../../context-hub/ebpf-signal-thesis.md`](../../context-hub/ebpf-signal-thesis.md)).
- eBPF sensor is real and modern.

## Their weaknesses (for our ICP)

- **Security-only.** No observability / APM side. The same eBPF sensor that could
  feed monitoring is used for security alone.
- Doesn't touch the unified-budget / one-team problem — it's a second tool next
  to the APM, not a replacement for both.
- Assumes a security owner running a posture programme.

## Why an ICP account switches

- Same eBPF "observed risk" thesis, but **one sensor feeding both APM and
  security** — one platform, not Upwind plus a separate observability stack.
- Their buyer is an IT Director, not a cloud-security team.

## Objection handling

> **"Upwind already does eBPF runtime security."**
> They do, and the "observed vs theoretical" thinking is right. The difference is
> that our sensor also feeds your monitoring — so it replaces two tools, not one,
> and one team runs it on one budget. If you're standing up Upwind next to
> Datadog, that's the exact split we close.

## Detect the account uses them

- `upwind` in tech-stack / Helm / job posts
- Job posts for "cloud security engineer" mentioning runtime / eBPF / CNAPP

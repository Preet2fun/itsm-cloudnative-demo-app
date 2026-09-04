# Stage 05 — Voice of Customer

**Purpose:** establish whether real users are asking for this, in their words —
and be honest when they aren't.

**Inputs:** `01`–`02`; interview notes, support tickets, sales-call notes,
community threads, churn reasons — whatever the user connects.
*If from a Discovery Brief: its JTBD, personas, and "what we know" signals are
your starting point — this stage deepens them with named quotes and the
say-vs-did split, it doesn't rebuild them.*

**Engine:** when a feedback tool (MCP) or a feedback CSV is available, run
[`ai-feedback/`](../../ai-feedback/) — the **prd-evidence-pack** lens *is* this
stage's artifact (volume · trend · sentiment · segment breakdown · 5 attributed
quotes · impact · limitations), and **cohort-compare** answers "who most". Its
`[Feedback: …]` rows carry straight into §6.1 and the Evidence Appendix. A
"not found" result is the gap statement below — logged, not worked around.

**Do:**
1. Pull **named** quotes and signals: who said it, what they said, the source.
   Verbatim where possible.
2. Separate **what users say** from **what they do** (usage data, workarounds
   observed). Flag where these diverge.
3. Segment by persona — the primary persona's demand is what matters most.
4. **Gap check:** if there's no feature-specific demand by name, say so
   explicitly and turn it into a §14 risk + a pre-GA action ("run 3–5 interviews
   before broad GTM claims"). Adjacent-but-not-exact signals are labelled as such.

**Produce — `05-voice-of-customer.md`:** Named quotes/signals (with sources) ·
Say-vs-do notes · Per-persona demand · Gap statement.

**Gate:** the §6.1 content is either real named demand or an explicit, logged
gap. No invented quotes, ever.

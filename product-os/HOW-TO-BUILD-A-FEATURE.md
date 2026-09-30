# How to Build a Feature — Start Here

One worked example, one hypothetical feature, every slash command in the
order you'd actually type them, every point where an agent stops and waits
for you marked explicitly. Everything referenced here already exists and is
built — this file is the missing piece that ties it together, not a new
module.

Full reference (every module's Input/Working-Flow/Output, autonomy tables,
status): [`ai-pdlc-playbook.md`](ai-pdlc-playbook.md). This file is the
practical run-through; that one is the encyclopedia.

---

## The example

**"CDR signal triage"** — autonomously triage Cloud Detection & Response
signals, investigate, deliver a reasoned resolution recommendation. Picked
because it's a real, named use case already sitting in
[`context-hub/agentic-use-cases.md`](context-hub/agentic-use-cases.md)'s AI
SOC table — a plausible next Ockham feature, not invented for this doc — and
nothing has been built against it yet, so nothing here contradicts other
dummy data elsewhere in the repo (unlike "AI-drafted resolution notes," which
the rest of the repo already treats as shipped).

Slug used throughout: **`cdr-signal-triage`** — the same slug threads through
Discovery, the PRD, and the engineering spec/plan, per the traceability rule
in `ai-pdlc-playbook.md` §6.

---

## The commands, in order

| # | Phase | Command | Always stops for you? |
|---|---|---|---|
| 1 | Discovery | `/discovery-agent` | Yes — stages 02 and 06, always; 01/03/05 when the real world hasn't supplied what's needed |
| 2 | PRD | `/write-prd` | Yes — stages 01, 02, 06, 10, 11, always; 05 and 10 when real data is missing |
| — | PRD review | *(runs inside `/write-prd` stage 11 automatically)* — or standalone: `/review-prd` | Verdict always returned to you; it never edits the PRD itself |
| 3 | Design | — no command yet (`ai-design/` is pending) — bridged by `superpowers:brainstorming` | Standard brainstorming approval gate |
| 4 | Planning → Dev → QA → Deploy | `superpowers:writing-plans` → `superpowers:executing-plans` (engineering repo, not product-os) | Standard plan-approval + review gates |
| 5 | Release / GTM | `/gtm-account-research`, `/gtm-account-scoring`, `/gtm-signal-to-sequence` as needed | Research + scoring run clean; signal-to-sequence drafts only — never sends |
| — | Scale gate | Score [`ai-launch-strategy.md`](ai-launch-strategy.md) before GTM spend | Always a human call — it's a canvas, not an agent |
| 6 | Operations | `/feedback-agent` (`launch-feedback` lens), then `operations/` files as needed | Feedback-agent runs clean; operations/ files are frameworks you fill in, not agents |
| — | Housekeeping | `/gtm-weekly-update`, weekly, once live | Drafts the diff, always stops before writing |

---

## Walking it through

### 1. Discovery — `/discovery-agent`

Type: `/discovery-agent CDR signal triage — autonomously triage CDR signals
and hand back a reasoned resolution recommendation`

The agent runs the 6-stage loop (`ai-discovery/stages/01`–`06`):

- **01 Idea intake** — restates as a problem, checks `knowledge-hub/` (nothing
  shipped yet, stated plainly) and fit against `context-hub/icp.md`. Stops
  only if it finds two materially different readings of the idea, or a clean
  fit failure.
- **02 Opportunity scoring** — drafts all five factor scores (Magnitude,
  Frequency, Severity, Competition, Contrast) + the AI-native check + a lean.
  **Always stops here** — "the highest-leverage call in the whole loop
  doesn't get made unattended." You confirm the lean before it continues.
- **03 Problem-space research** — synthesizes whatever signal is already
  connected. For `cdr-signal-triage`, likely nothing real yet (pre-launch,
  no AI SOC customers) — stops to ask: proceed `[Assumed]`, wait for real
  signal, or carry it forward as a stage-05 assumption to test.
- **04 Solution hypothesis** — diverges to 5+ shapes, converges to the top
  1–3. Runs clean, no stop — it's reasoning, not a resourcing commitment yet.
- **05 Assumption & risk map** — lists every assumption; stops on anything
  landing in "test before PRD."
- **06 Decision & brief** — computes Pursue / Park / Kill. **Always stops** —
  a Pursue commits real future PRD effort. Say Pursue → it writes
  `ai-discovery/discovery/cdr-signal-triage/discovery-brief.md`.

**Output that carries forward:** `discovery-brief.md` — the PRD Agent's
stage-01 input.

### 2. PRD — `/write-prd`

Type: `/write-prd` (it reads the Discovery Brief automatically when the slug
matches — per `ai-discovery/README.md` and `ai-prd/README.md`'s shared-slug
chain).

Runs the 12-stage loop (`ai-prd/stages/01`–`12`):

- **01 Idea brief** — adopts the Discovery Brief. **Stops** to confirm the
  risk tier (it calibrates how deep every later stage runs).
- **02 Requirements** — drafts 2–3 framings in full. **Always stops** before
  locking one in — every stage from 03 on builds on this single choice.
- **03 Knowledge gathering**, **04 Market & competitor research** — run
  clean.
- **05 Voice of customer** — runs `/feedback-agent`'s lenses internally on
  whatever's connected. **Stops** the moment real, feature-specific demand
  isn't found (likely, pre-launch, for a brand-new AI SOC feature) — logs the
  gap as a §14 risk rather than inventing demand.
- **06 Metrics & AI design strategy** — drafts the north-star, metrics, and
  the full AI-native addendum B–H. **Always stops** on the ML-necessity check
  (addendum A) — a FAIL here means don't ship it as an AI feature at all.
- **07 Evidence gathering**, **08 Visual strategy**, **09 Prototype summary**
  — run clean (07's postgres/prometheus MCP queries are directly executable;
  08 drafts real Claude Design artboards, worth a glance but not a hard
  stop).
- **10 ROI / business case** — drafts cost/TAM/revenue scenarios. **Always
  stops** on the recommendation — a real spend decision. Also genuinely
  blocked if `ai-gtm/pricing-and-packaging.md` is still thin (it is, today —
  see `TODO.md` item 2).
- **11 Draft PRD & review** — assembles the PRD, invokes the PRD Reviewer
  Agent, applies fixes, re-checks — end to end. **Always stops** to present
  the scorecard and Ready / Ready-with-Caveats / Not-Ready verdict, whatever
  it says.
- **12 Final checklist** — walks the fixed checklist. Any box it can't verify
  becomes a proposed waive-with-reason; accepting the waiver is your call.

**Output that carries forward:** `ai-prd/prds/cdr-signal-triage/prd.md`.

*(To re-run just the review — e.g. after manual edits — `/review-prd` invokes
the PRD Reviewer Agent standalone. It never edits the PRD; a verdict always
comes back to you.)*

### 3. Design — the acknowledged gap

No slash command exists yet — `ai-design/` is scaffold-only, by your own
choice this session. Today's bridge (per `ai-pdlc-playbook.md` §5): the PRD's
§9 (Experience & Prototype) plus its AI-native addendum feed directly into
`superpowers:brainstorming` acting as the technical-design step, with Claude
Design mockups drafted there per root `CLAUDE.md` §10.

### 4. Planning → Development → QA → Deployment — the engineering repo

Not part of `product-os/` at all, by design — `superpowers:writing-plans`
produces a plan under `docs/superpowers/plans/` carrying a `Spec:` field back
to the design doc and a `PRD:` field back to
`ai-prd/prds/cdr-signal-triage/prd.md` (same slug, threaded through).
`superpowers:executing-plans` (or `subagent-driven-development`) builds it,
with this repo's standard commit/review/verification discipline. Standard
approval gates apply — nothing product-os-specific here.

### 5. Release — the GTM plays, as needed

Not a sequence — four independent plays, run on demand:

- `/gtm-account-research <company.com>` — runs clean, start to finish.
- `/gtm-account-scoring <company.com or list>` — runs clean; hard gates never
  silently skipped.
- `/gtm-signal-to-sequence build a Tier <N> campaign for <signal>` — drafts
  the full campaign clean, but **has no send capability and never will** —
  loading it into a real tool is always a separate, explicit action.

**Before real GTM spend goes behind the launch:** score
[`ai-launch-strategy.md`](ai-launch-strategy.md)'s 12-cell canvas. This is
always a human judgment call, not an agent output — a gating-cell Red (Customer
Pain, AI Reliability, Go-To-Market Viability) means hold, not scale.

### 6. Operations — once it's live

- `/feedback-agent launch-feedback, source: <MCP tool / CSV>` — the
  pre-launch risk read (run before launch) and the post-launch before/after
  comparison (run 14+ days after). Runs clean; it only reports.
- [`operations/agent-reliability-monitoring.md`](operations/agent-reliability-monitoring.md) —
  the four signals to watch once there's a production agent to score
  (accuracy/groundedness, hallucination rate, latency, cost per investigation).
- A confirmed production failure → log it in
  [`operations/failure-triage-log.md`](operations/failure-triage-log.md).
- A customer-reported issue → route it per
  [`operations/feedback-routing.md`](operations/feedback-routing.md).
- A real incident → [`operations/incident-runbook.md`](operations/incident-runbook.md).
- `/gtm-weekly-update` — Monday-morning housekeeping once there's a real
  campaign running. Drafts the diff unattended, **always stops** before
  writing any file.

### Closing the loop

Once `data-analysis/experiment-analysis.md` reaches its ship/iterate/kill
call for `cdr-signal-triage`, add one row to
[`data-analysis/calibration-log.md`](data-analysis/calibration-log.md) —
predicted lift vs. measured lift. The next feature's Discovery/PRD forecast
reads this file first instead of guessing from zero.

---

## The always-stop checkpoints, all in one place

If you only remember one thing from this file: **nothing ships past a
decision point without you.** Every agent above runs its mechanical work
unattended; every genuine judgment call — an opportunity lean, a PRD tier, a
requirements framing, the ML-necessity check, an ROI recommendation, a launch
verdict, a scale-or-hold call, a GTM send — stops and waits. That split is
deliberate and consistent across every module — see each `.claude/agents/*.md`
file's own "Autonomy" section for the full per-stage detail behind the
summary table above.

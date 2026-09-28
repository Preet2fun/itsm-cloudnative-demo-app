# The Ockham AI Product Development Lifecycle — Playbook

**What this is:** a single, comprehensive map of how an AI feature moves through
Ockham's entire product lifecycle — idea to GTM — using the modules that
already exist under `product-os/`, plus where the "how" continues in the
engineering repo once a PRD is ready to build. It does not change, rebuild, or
restate any existing folder's content — it explains what each piece does, how
it connects to the others, and whether it's actually usable today.

**Status legend**, used per module throughout:

| Status | Means |
|---|---|
| ✅ **Completed** | Built and usable as-is today |
| 🟡 **Partial** | Some real artifacts exist; the rest is scaffold |
| ⛔ **Pending** | Scaffold/empty only — described, not built |

**Source of the phase taxonomy:** `product-os/README.md`'s own "Lifecycle
phases (reference)" table (Discovery → Design → Planning → Development → QA →
Deployment → Release → Operations) — an already-established, industry-aligned
structure (PM discovery/PRD practice + standard SDLC phases). This playbook
doesn't invent a new taxonomy; it fills that one in with what's actually built,
and adds the data/KPI thread that runs through every phase.

---

## 1. The whole cycle, at a glance

```
IDEA
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ DISCOVERY           ai-discovery/  ✅  →  ai-prd/  ✅         │
│ (idea → Pursue/Park/Kill → Discovery Brief → 12-stage PRD →  │
│  Ready / Ready-with-Caveats / Not-Ready)                     │
└─────────────────────────────────────────────────────────────┘
  │ Pursue + Ready
  ▼
┌─────────────────────────────────────────────────────────────┐
│ DESIGN              ai-design/  ⛔  (scaffold only)          │
│ HLD/LLD, feature spec, mocks — today this gap is bridged by  │
│ superpowers:brainstorming acting as the technical-design step│
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ PLANNING → DEVELOPMENT → QA → DEPLOYMENT      engineering    │
│ repo — NOT part of product-os by design (see product-os/     │
│ README.md's own layer table). superpowers:writing-plans →    │
│ executing-plans.  ✅ Completed — proven this session         │
│ across all 10 customer-app phases + platform-app work.       │
└─────────────────────────────────────────────────────────────┘
  │ shipped
  ▼
┌─────────────────────────────────────────────────────────────┐
│ RELEASE             gtm/  ✅   ai-launch-strategy.md  ✅      │
│                     messaging.md  ✅                          │
│ Scale-when-green gate, GTM plays/battlecards/campaigns        │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ OPERATIONS          fragmented — see §8. No dedicated module.│
│ ai-feedback/launch-feedback  ✅   data-analysis/               │
│ experiment-analysis.md  ✅      (a real gap — see §9)         │
└─────────────────────────────────────────────────────────────┘
  │ learnings feed back
  ▼
knowledge-hub/ (⛔ pending) · ai-product-strategy/ (⛔ pending) · context-hub/ (✅)
```

Two supporting stores sit **outside** this pipeline and feed every stage of
it: **Context Hub** (✅, upstream of everything — company truth) and
**Knowledge Hub** (⛔, empty by design — the product is greenfield, nothing
shipped to catalog yet).

---

## 2. Context Hub — the upstream truth (✅ Completed)

**What it is:** who Ockham is and what it believes — company identity, AI
stance, category/vision, positioning, ICP, competitive landscape, agentic
use-case set, and the eBPF technical thesis. Every other module reads from
here; nothing downstream contradicts it without deliberately updating it
first.

**Contents, all "Seeded" (captured from the founder's initial context, 2026-09-04):**

| File | Answers |
|---|---|
| `company-brief.md` | Who Ockham is, the Occam's Razor thesis, AI-native vs "AI-powered," category, vision, security arc |
| `positioning.md` | The wedge (unified budget/team), buyer-specific pitches, the proof-chains anti-hallucination line, the metric rules (time-to-first-hypothesis, never "in seconds") |
| `icp.md` | Firmographic/technographic/organizational qualifiers, behavioural triggers, disqualifiers |
| `competitive-landscape.md` | The fixed 7-competitor set (Datadog, Dynatrace, Edge Delta, Resolve.ai / Upwind, Wiz, Dropzone.ai) — used for **all** competitive references, nowhere else |
| `agentic-use-cases.md` | The 10 Ops/SRE use cases + 3 AI-SOC use cases the AI layer performs, each with a shipping precedent |
| `ebpf-signal-thesis.md` | How runtime signals turn theoretical risk into observed evidence; the one-sensor structural advantage |

**Connects to:** literally everything downstream — `ai-discovery/` reads ICP +
positioning for fit gates; `ai-prd/`'s Ockham-fit checks; `gtm/`'s ICP tiers
and battlecards; `ai-launch-strategy.md`'s Customer/Competition lenses;
`messaging.md`'s hero copy.

**Answers, once, the Business Value Map** of the standard AI-PRD discovery
worksheet (market/growth/differentiators/buyers) — `ai-discovery/` reads it
instead of re-asking per idea.

---

## 3. Discovery — `ai-discovery/` (✅ Completed)

**What it does:** decides whether an idea deserves a PRD, cheaply, before one
is spent. Runs a 6-stage loop and ends with **Pursue / Park / Kill**.

| # | Stage | One line |
|---|---|---|
| 01 | Idea intake | Restate the idea as a problem; type it; provenance; a fast ICP/positioning fit check |
| 02 | Opportunity scoring | Five factors (magnitude, frequency, severity, competition, contrast) scored 1–5 + the **AI-native check** (Native vs Bolt-on — Bolt-on is Kill/Park) + Ockham-fit gates → a lean |
| 03 | Problem-space research | Signal synthesis, JTBD, current-state journey, evidence gaps |
| 04 | Solution hypothesis | Diverge ≥5 solution shapes → converge to top 1–3 by impact × feasibility |
| 05 | Assumption & risk map | Rate assumptions: test-before-PRD / test-during-PRD / accept |
| 06 | Decision & brief | **Pursue** → writes the Discovery Brief (PRD's stage-01 input); **Park/Kill** → decision log with a revisit trigger or reason |

**Effort scales to the idea** — a small/reversible idea collapses to stages
01/02/06; a net-new capability runs the full loop.

**Hands off to:** `ai-prd/` on Pursue — same `<slug>` reused, so a feature's
discovery and PRD trails share one name.

**Every stage below follows the same three-part shape: Input (what it reads,
including every prior stage's output and every hub/data-analysis reference),
Working flow (the exact numbered steps), Output (the concrete artifact, its
real storage path, and which stage or module it feeds).** Storage paths all
share one convention, stated once here rather than per stage: every artifact
for a given idea lives under `product-os/ai-discovery/discovery/<slug>/`,
where `<slug>` is chosen at stage 01 and reused for every later stage file,
the eventual Discovery Brief, and — on Pursue — the matching
`ai-prd/prds/<slug>/` folder. **As of today, the `discovery/` folder itself
does not exist anywhere in this repo** — no idea has been run through the
loop for real yet. It gets created the first time one is; nothing below is
blocked on that, it's just not-yet-materialized.

### 3.1 Stage 01 — Idea Intake

**Input**
- The raw idea/signal + its provenance — no prior stage output; this is the
  loop's entry point. Provenance can be the user, a support trend, a sales
  loss, a competitor move, or a strategy prompt.
- `context-hub/positioning.md`, `context-hub/icp.md` — for the fast fit check.
- `knowledge-hub/` — to check "already covered?" (today: empty — the check
  always returns "nothing shipped yet," not a real gap, see `product-os/
  TODO.md`'s "not on this list on purpose" note).

**Working flow**
1. Restate the raw idea as a problem. If it arrived phrased as a feature
   ("add X"), write the problem it implies instead and validate *that* — not
   the feature.
2. Classify its type: pain signal · feature request · competitive gap ·
   strategic bet · new tech capability. This determines what stage 03's
   research actually needs to chase.
3. Record provenance: where it came from, who's asking, how loud/frequent the
   signal is.
4. Check `knowledge-hub/` for existing coverage: already shipped, partly
   shipped, or previously killed — if killed before, note what's changed
   since.
5. Run the fast fit check: one line each on ICP fit (`context-hub/icp.md`)
   and positioning fit (`context-hub/positioning.md`).
6. **Gate:** if the fit check clearly fails, stop here — skip straight to
   stage 06 with a Kill rather than running 02–05.

**Output**
- Artifact: `01-idea-intake.md` — Problem restatement · Type · Provenance ·
  Existing-coverage note · Fast fit check.
- Storage: `product-os/ai-discovery/discovery/<slug>/stages/01-idea-intake.md`.
- Feeds: stage 02 — or, on a failed fit check, straight to stage 06 (Kill).

### 3.2 Stage 02 — Opportunity Scoring

**Input**
- Stage 01's output.
- `opportunity-scorecard.md` — the five-factor rubric, the AI-native check,
  and the Ockham-fit gates.
- `context-hub/competitive-landscape.md` (the fixed 7-competitor set, for the
  Competition factor), `context-hub/agentic-use-cases.md`, `context-hub/
  icp.md`, `context-hub/positioning.md` (the Ockham-fit gates).
- `ai-feedback/` signal-scan — where feedback data exists (today:
  `ai-feedback/sample-feedback.csv`, dummy/illustrative) — grounds
  Severity/Competition/Contrast with real numbers instead of pure judgement.
- `data-analysis/impact-estimation.md` — only when an adjacent/existing flow
  already generates usage data (see §3.7's worked example) — grounds
  Magnitude/Frequency the same way.

**Working flow**
1. Score the five factors — magnitude, frequency, severity, competition,
   contrast — 1–5 each, with a one-line reason and the AI angle per factor.
   Pull numbers from `ai-feedback/` signal-scan where data exists; otherwise
   score from judgement and tag it Assumed.
2. Run the AI-native check: Native or Bolt-on, with the reason. Bolt-on is a
   Kill/Park signal, not a score to average into the rest.
3. Run the Ockham-fit gates — ICP, positioning, moat, horizon — pass/fail
   each against context-hub.
4. Where an adjacent/existing flow exists, ground Magnitude/Frequency using
   `impact-estimation.md`'s formula instead of pure judgement (§3.7 shows
   exactly how, for this same running example).
5. Write the lean: Pursue / Park / Kill, and the single biggest reason.
6. **Gate:** every factor scored with its AI angle, the AI-native check
   answered, the lean stated. A Bolt-on verdict or a failed fit gate carries
   straight to stage 06.

**Output**
- Artifact: `02-opportunity-scoring.md` — the filled scorecard + lean +
  reason.
- Storage: `product-os/ai-discovery/discovery/<slug>/stages/02-opportunity-scoring.md`.
- Feeds: stage 03 — or straight to stage 06 on a Bolt-on/failed-gate verdict.
  Its score and lean also land in the eventual Discovery Brief's "Opportunity
  score" section.

### 3.3 Stage 03 — Problem-Space Research

**Input**
- Stages 01–02 output.
- `research-methods.md` — the stage's toolkit.
- Whatever signals the user connects: interview notes, support tickets,
  sales-call notes, churn reasons, community threads, usage data.
- `ai-feedback/` signal-scan + pattern-classification — when a feedback tool
  (MCP) or CSV is available (today: the same dummy `sample-feedback.csv`) —
  run **before** the manual synthesis below, per `research-methods.md`.
- `context-hub/product-usage-snapshots/` — the usage-data input (today: one
  dummy monthly snapshot).
- `context-hub/icp.md` — for identifying affected personas.

**Working flow**
1. If a feedback source is available, run `ai-feedback/`'s signal-scan lens
   first — returns volume, trend, severity, segment distribution, and
   competitor-contrast for the topic, already tagged `[Feedback: …]`; run
   pattern-classification to say whether it's a whole-market gap or one
   account.
2. Signal synthesis on top of that: one row per additional signal — what was
   said/seen · source · date · said-vs-did. Cluster into themes; a theme
   backed only by "said" (never observed as "did") is weaker — mark it. Name
   the gap: what you'd expect to find and didn't.
3. Write the primary JTBD (`When <situation>, I want to <motivation>, so I
   can <outcome>`), plus secondaries. Keep the job separate from any
   candidate feature.
4. Map the current-state journey: the steps today, the friction/time/cost at
   each, where users drop off or work around the problem.
5. Identify affected personas from `context-hub/icp.md` — who feels this
   most.
6. Write the evidence-gap list: verified vs assumed. "Not found" is a valid,
   recorded result — never hidden.
7. **Gate:** the primary JTBD is stated and the evidence-gap list is
   explicit. If there's no evidence the problem is real, carry a Kill to
   stage 06.

**Output**
- Artifact: `03-problem-space-research.md` — Signal table + themes · JTBD ·
  Journey map · Personas · Evidence-gap list.
- Storage: `product-os/ai-discovery/discovery/<slug>/stages/03-problem-space-research.md`.
  Any raw research pulled in during this stage (interview notes, ticket
  exports, competitor teardowns) goes in `product-os/ai-discovery/discovery/
  <slug>/signals/` — this subfolder also doesn't exist yet; it's created the
  first time real raw research needs a home.
- Feeds: stage 04 — the ranked pain-points and JTBD become its starting
  input — or straight to stage 06 on a no-evidence Kill.

### 3.4 Stage 04 — Solution Hypothesis (Diverge → Converge)

**Input**
- Stages 01–03 output — specifically the ranked AI-solvable pain-points, the
  JTBD, and the current-state journey.
- `opportunity-scorecard.md`'s AI-native verdict, from stage 02.
- `context-hub/agentic-use-cases.md` — solution shapes that already fit
  Ockham's model.
- `knowledge-hub/` — the feasibility sanity-check (today: empty, so this
  check is a no-op until something real ships).

**Working flow**
1. **Diverge:** generate at least 5 distinct solution shapes for the top
   pain-point(s). Vary the shape along four axes — what it does
   (triage/investigate/recommend/act/summarise), autonomy level (observe →
   suggest → act-with-approval → act), surface (in-product panel/chat/
   digest/API/workflow hook), trigger (on alert/on schedule/on demand). For
   each shape, note which pain it targets and why it needs the model — a
   shape that doesn't need the model is a candidate to discard right here.
2. **Converge:** score each shape 1–5 on Impact (how much of the ranked pain
   it removes, for how many users) and Feasibility (data availability, model
   fit, build/run cost, adjacent-system disruption — checked against
   `knowledge-hub/`).
3. Keep the top 1–3 shapes (high impact × workable feasibility); kill the
   rest with a one-line reason each.
4. State the lead hypothesis for the top shape: *"If we build `<shape>`,
   then `<measurable>` moves for `<persona>`, because `<why the model makes
   this possible>`."*
5. **Gate:** ≥5 shapes generated; top 1–3 chosen on impact × feasibility; the
   lead hypothesis is falsifiable.

**Output**
- Artifact: `04-solution-hypothesis.md` — the divergence list (≥5 shapes,
  each tagged to a pain + an AI-native note), the convergence table (shape ·
  impact · feasibility · keep/kill + reason), the lead hypothesis + 1–2
  alternates.
- Storage: `product-os/ai-discovery/discovery/<slug>/stages/04-solution-hypothesis.md`.
- Feeds: stage 05 (the lead shape + alternates get risk-mapped next) and,
  later, directly into `ai-prd/stages/02-requirements.md` as the PRD's
  candidate framings, and into the Discovery Brief's "Candidate solutions"
  table.

### 3.5 Stage 05 — Assumption & Risk Map

**Input**
- Stages 01–04 output — especially stage 03's evidence-gap list and stage
  04's lead solution shape + alternates.

**Working flow**
1. List the assumptions the opportunity **and** the lead solution shape rest
   on, across four kinds: Desirability (users want this, will change
   behaviour for it), Viability (good for Ockham — pricing, positioning, run
   cost), Feasibility (we can build and operate it), Safety/ethics (autonomy
   level, trust, data handling).
2. Rate each assumption: confidence (low/med/high) × impact-if-wrong
   (low/med/high).
3. Classify each: **Test before PRD** (low confidence + high impact — name
   the cheapest test: a handful of interviews, a data pull, a fake-door, a
   competitor teardown), **Test during PRD** (the PRD's own evidence stages
   will cover it), or **Accept** (high confidence or low impact — state it
   and move on).
4. **Gate:** every "test before PRD" item has a named, cheap test. If there
   are none, the opportunity is ready for a decision.

**Output**
- Artifact: `05-assumption-and-risk-map.md` — the assumption table
  (assumption · kind · confidence · impact · class · cheapest test).
- Storage: `product-os/ai-discovery/discovery/<slug>/stages/05-assumption-and-risk-map.md`.
- Feeds: stage 06 — a "test before PRD" item that gets run becomes evidence
  for the decision; one that doesn't becomes a `[pre-build]` line in the
  Discovery Brief. A "Test during PRD" item becomes work for
  `ai-prd/stages/07-evidence-gathering.md`.

### 3.6 Stage 06 — Decision & Brief

**Input**
- Stages 01–05, all of it.
- `discovery-brief.md` — the template file; it holds both the Pursue
  template and the Park/Kill `decision-log.md` template in one place.

**Working flow**
1. Decide: **Pursue** (factors mostly 3+, AI-native check = Native, all fit
   gates pass, stage 04 produced a lead shape worth a PRD, and every "test
   before PRD" assumption either passed a cheap test or is explicitly carried
   forward as a `[pre-build]` item — never silently downgraded to "test
   during PRD"); **Park** (a real opportunity, but a fit gate or blocking
   assumption can't be resolved now); or **Kill** (Bolt-on with no path to
   Native, no evidence the problem is real, a disqualifier, or the score is
   clearly below bar).
2. On Pursue: write `discovery-brief.md` to the template — problem,
   hypothesis, opportunity score, personas, JTBD, candidate solutions (from
   stage 04), verified-vs-assuming tables, every un-run "test before PRD"
   assumption as a `[pre-build]` line, suggested PRD tier, recommendation.
3. On Park/Kill: write `decision-log.md` — reason, evidence, revisit trigger
   (Park only), strategy note.
4. Either way: if this same underlying signal keeps recurring across
   separate ideas, flag it for `ai-product-strategy/` — today that folder is
   scaffold-only, so this flag currently has no real landing spot (tracked in
   `product-os/TODO.md`, item 1 — parked, not forgotten).
5. **Gate:** the decision is explicit with a one-paragraph rationale. Pursue
   means the Discovery Brief is complete enough that the PRD Agent can start
   with no back-questions.

**Output**
- Artifacts: `06-decision-and-brief.md` (the decision + rationale), plus
  exactly one of `discovery-brief.md` or `decision-log.md`.
- Storage: `06-decision-and-brief.md` at `product-os/ai-discovery/discovery/
  <slug>/stages/`; `discovery-brief.md`/`decision-log.md` at the
  `discovery/<slug>/` root — a sibling of `stages/` and `signals/`, not
  nested under `stages/` itself. (This exact placement isn't spelled out
  verbatim anywhere in `ai-discovery/`'s own docs today — this playbook is
  the first place it's made explicit, matching the pattern already used in
  §3.8 for the data-pull recipe.)
- Feeds: on **Pursue** — `ai-prd/prds/<slug>/`, same slug, as the PRD Agent's
  stage-01 input. On **Park** — sits until its revisit trigger fires. On
  **Kill** — recorded, done. Any recurring-signal flag — `ai-product-strategy/`
  (parked; see `product-os/TODO.md`).

### 3.7 Worked example — "AI-drafted incident resolution notes"

Grounded in something real, not hypothetical: `incident-service`'s
`ResolveRequest` model already has a genuine, optional
`resolution_notes: str = ""` field
(`platform-app/services/incident-service/app/models.py:96`). The idea: an
agent auto-drafts that field from the investigation trail instead of leaving
it to the responder.

**Why `impact-estimation.md` applies here at all:** its own rule is "once
there's *some* usage or funnel data to pull from — a live feature... or a
comparable existing flow." `resolution_notes` already exists and is filled in
manually, sometimes, today — that manual baseline *is* the comparable
existing flow. If no such adjacent behavior existed anywhere in the product,
this bottom-up method wouldn't apply at all, and stage 10's top-down
TAM/SAM/SOM would be the only lever.

**What's measurable *before* the new feature is built, vs. what isn't:**

| Term | Measurable today? | How |
|---|---|---|
| Users Affected | 🟡 Roughly | `context-hub/feature-flag-rollouts.md` gives a real (if dummy) rollout curve now — 2 tenants fully enabled, 1 at 50% — rather than falling back to active-tenant-count as a proxy |
| Current Action Rate | ✅ Yes | `% of resolved incidents with resolution_notes != ''` — a real query against live data, zero AI involved, describes the *manual baseline*, not the future feature |
| Expected Lift | ⛔ No | Inherently a forecast about something that hasn't shipped — stays `[Assumed]` until a real version launches and `data-analysis/experiment-analysis.md` measures it |
| Value per Action | ⛔ No | Would tie to `gtm/pricing-and-packaging.md`'s edition ladder — that file is thin/unpopulated today |

So: **3 of 4 terms describe the present, not the future** — that's the
answer to "do we have any data at all." The one term that's genuinely
about the unbuilt feature (`Expected Lift`) is the one term the method
itself expects to be `[Assumed]` pre-launch.

**Where the real numbers would land:** not back in `impact-estimation.md` —
that file stays the reusable formula. This idea's actual computed numbers go
into its own trail: `ai-discovery/discovery/ai-drafted-resolution-notes/
stages/02-opportunity-scoring.md`.

### 3.8 How to actually get the data — the missing recipe

The formula in `impact-estimation.md` is well-specified; what's missing is a
documented path to *run* it against Ockham's own live systems. Root
`CLAUDE.md` §2 already grants direct `postgres` and `prometheus` MCP access
— nothing here is blocked, it's just undocumented. Concretely, for the
resolution-notes example:

```
-- Current Action Rate (postgres MCP, direct against the live incident-service DB)
SELECT
  COUNT(*) FILTER (WHERE resolution_notes != '') * 100.0 / COUNT(*) AS action_rate_pct
FROM incidents
WHERE status = 'resolved' AND resolved_at > now() - interval '90 days';

-- Users Affected (proxy, until a real feature-flag/cohort table exists)
SELECT COUNT(DISTINCT tenant_id) FROM incidents
WHERE status = 'resolved' AND resolved_at > now() - interval '90 days';
```

**Status: 🟡 Partial.** The access exists; the recipe didn't, until now. This
playbook is the first place it's written down — extend this section with a
real query per metric as more features get scoped, rather than re-deriving
it from scratch each time.

### 3.9 What's genuinely missing (not fixable by writing a query)

| Gap | Status | Why |
|---|---|---|
| Feature-flag / cohort tracking | 🟡 Partial (dummy) | No real feature-flagging system exists — but `context-hub/feature-flag-rollouts.md` now gives `impact-estimation.md`'s Users Affected term a real, if illustrative, place to read from. Real system stays ⛔ Pending — proposed, not approved. |
| A connected `ai-feedback/` source | 🟡 Partial (dummy) | No real customers/support tool yet — genuinely pre-launch. `ai-feedback/sample-feedback.csv` closes the format gap (stage 02's Severity/Competition/Contrast scoring and stage 03's signal synthesis can both run against it today) without inventing real customer data. |
| `gtm/pricing-and-packaging.md` populated | ⛔ Pending | Depends on real pricing decisions, not data infrastructure — genuinely not fixable by building anything. |
| Prior Ockham experiments | ⛔ Pending | Can't exist before something ships — self-resolving over time. `data-analysis/calibration-log.md` (below) is ready to receive the first one. |
| Calibration loop (Discovery's `Expected Lift` vs. `experiment-analysis.md`'s measured lift) | ✅ Built | `data-analysis/calibration-log.md` — one row per shipped feature, written after the ship/iterate/kill call, read before the next feature's Expected Lift guess. One illustrative row exists; needs a real ship/iterate/kill call to populate for real. |

Two genuinely un-fixable items remain (`gtm/pricing-and-packaging.md`, real
prior experiments) plus one deliberately parked one (stage 06's
`ai-product-strategy/` handoff, §3.6) — tracked in `product-os/TODO.md`, not
duplicated here.

---

## 4. PRD — `ai-prd/` (✅ Completed)

**What it does:** the back half of Discovery — turns a Discovery Brief into an
evidence-grounded, reviewed PRD. Two agents: the **PRD Agent** (drafts, 12-stage
loop) and the **PRD Reviewer Agent** (the pre-human "CPO check," built on
Uber's AI PRD Evaluator — 360° context, risk-tier classification, 7 dimensions,
**Ready / Ready with Caveats / Not Ready**).

| # | Stage | One line |
|---|---|---|
| 01 | Idea brief | Restate the ask as a problem + hypothesis; set the risk tier |
| 02 | Requirements | Users, JTBD, scope, constraints; pick 1 of 2–3 framings |
| 03 | Knowledge gathering | What already ships (`knowledge-hub/`); adjacent systems; prior attempts |
| 04 | Market/competitor research | Competitor table (the fixed 7 only) + the opening for us |
| 05 | Voice of customer | Named demand signal; "said vs did"; gap flags |
| 06 | **Metrics & AI design strategy** | North-star + metrics + failure criteria (**always**); **AI-native features additionally own the full addendum A–H** — see §7 below |
| 07 | Evidence gathering | Every figure tagged Measured/Assumed/Gated; Evidence Appendix rows |
| 08 | Visual strategy | Surfaces, screens, states, IA (drafted in Claude Design) |
| 09 | Prototype summary | What was prototyped, status, what it validated |
| 10 | ROI / business case | Build + operating cost, TAM/SAM/SOM, revenue scenarios, measured-vs-gated impact, recommendation |
| 11 | Draft PRD + review | Assembles `prd.md`; runs the Reviewer Agent; applies fixes |
| 12 | Final checklist | Go / no-go gate |

**Where it lands:** `product-os/ai-prd/prds/<feature-slug>/` — same slug as
its Discovery Brief.

**Downstream, per `ai-prd/README.md`'s own documented handoff:** `ai-design/`
(⛔ scaffold — see §5) and then **engineering** directly. This is exactly why
§9's process rule matters: nothing in product-os itself currently turns a
Ready PRD into code.

---

## 5. Design — `ai-design/` (⛔ Pending — scaffold only)

**What it's for:** how agent work gets shown to humans so they trust it and
can override it — the actual UX layer of "AI-native." Its own README lists the
expected artifacts, none written yet:

- `design-principles.md` — explainable autonomy
- `proof-chain-ui.md` — the evidence-linked investigation timeline
- `approval-flows.md` — remediation as one approval with a visible diff
- `autonomy-controls.md` — the per-capability autonomy dial (observe → suggest
  → act-with-approval → act)
- `incident-workspace.md`, `security-triage-view.md`, `chat-surface.md`

**Today's bridge (per the alignment doc, `docs/superpowers/specs/2026-09-25-
ockham-vision-repo-alignment-design.md` §4):** a validated PRD's §9
(Experience & Prototype) plus its AI-native addendum feed directly into
`superpowers:brainstorming` acting as the technical-design step — Claude
Design mockups get drafted there (root `CLAUDE.md` §10), not through a
formal `ai-design/` artifact set. This folder gets built out organically as
real features need its specific artifacts, not as blocking upfront work.

---

## 6. Planning → Development → QA → Deployment (✅ Completed — engineering repo, not product-os)

**Deliberately not part of `product-os/`.** Its own README states the split
plainly: product-os is the "what and why," the engineering repo
(`platform-app/`, `customer-app/`, `ai-engine/`) is the "how." These four
phases live entirely in this repo's existing, proven workflow:

- **Planning + Design (technical)** — `superpowers:brainstorming`, producing a
  spec under `docs/superpowers/specs/`.
- **Development** — `superpowers:writing-plans` → `superpowers:executing-plans`
  (or `subagent-driven-development`), producing a plan under
  `docs/superpowers/plans/` and then real commits.
- **QA** — the plan's own verification steps + live-cluster evidence
  (this repo's established discipline all session: never claim done without
  a live-verified command's actual output).
- **Deployment** — this repo's existing CI/CD (Phase 8: GitHub Actions build
  matrix → ArgoCD GitOps sync).

**Status: proven, not aspirational** — every one of `customer-app`'s 10
phases, and `platform-app`'s observability/CI-CD/capacity work, ran through
exactly this chain this session.

**Traceability rule (new, needed to actually close the loop):** the
engineering spec/plan reuse the **same `<slug>`** the Discovery Brief and PRD
used, even though they live in a different folder — and the spec's header
gets a `PRD:` field pointing back to `product-os/ai-prd/prds/<slug>/prd.md`,
mirroring how `writing-plans`' plan header already carries a `Spec:` field.

---

## 7. The AI-native addendum (A–H) — where "AI-native, not AI-powered" is enforced

Owned entirely by PRD stage 06, **required whenever the feature's core value
depends on a model.** This is the part of the cycle that makes Ockham's own
stated identity (`company-brief.md`: "what we actually build: AI-native") a
checked gate, not a slogan:

| Addendum | What it forces |
|---|---|
| **A — ML-necessity check** | Per component: is ML actually necessary? A **FAIL means don't build it as an AI feature at all** — the hardest gate in the whole cycle |
| **B — Grounding strategy** | The single source of truth; what the model may/may not see; attribution on every output; "not found" is a valid answer |
| **C — Prompt strategy** | Per task: technique, output format, rationale; the prompt-improvement loop |
| **D — Hallucination guardrails** | At inference/extraction, at chat, at the human-in-the-loop step |
| **E — Evaluation strategy** | Ground-truth sources; offline eval plan (metric·method·target·cadence); online monitoring; eval dataset location |
| **F — Production readiness (HHH)** | Helpful/Honest/Harmless, with launch criteria per Alpha/Beta/GA |
| **G — Agent capabilities & autonomy** | Per component: autonomy level (observe → suggest → act-with-approval → act) + human-in-the-loop trigger |
| **H — Model requirements & selection** | Model/provider, context window, cost, latency target, and the fallback if pricing/availability changes |

This is the PRD-level implementation of `ai-engine/CLAUDE.md`'s own
engineering harness (Context/Loop/Graph Engineering) — the PRD decides *what*
the AI must do and how it's judged; `ai-engine/` builds the LangGraph
graph that satisfies it.

---

## 8. Release — `gtm/` (✅), `ai-launch-strategy.md` (✅), `messaging.md` (✅)

Three built modules, one phase: getting a shipped feature in front of real
buyers, and deciding whether to spend real money doing it.

**`messaging.md`** — the customer-facing 5-second-test copy, derived from
`positioning.md`. Hero headline/subhead, product one-liner, elevator pitch,
use-case-positioned campaign variants. **Feeds** `ai-launch-strategy.md`'s
Customer lens (does the ICP self-identify from the hero?) and `gtm/`'s
`positioning-statement.md` + `messaging-by-persona.md`.

**`gtm/`** — the sales-qualification/execution layer on top of context-hub:
ICP tiers, signal library, account scoring, sales plays, playbooks, and
battlecards for the fixed 7 competitors. Structure and content are built and
populated with Ockham's real ICP/signals/personas; execution pieces (live
outbound automation, deliverability infra) stay unpopulated until there's a
real motion — correctly so, pre-launch.

**`ai-launch-strategy.md`** — the **scale-when-green gate**, operationalizing
`ai-pmf-strategy.md`'s Phase 3. Four lenses (Customer, Product, Company,
Competition), three factors each, scored Green/Yellow/Red. A **Red on a
gating cell (Customer Pain, AI Reliability, GTM Viability) blocks scaling
GTM spend**, not shipping. Different question from the PRD Reviewer's ("is
this PRD ready to build?" vs. "should we scale this launch?"). Ockham's own
current read (dated 2026-09-04) is captured in the doc: mostly Yellow, Red on
Product's Reach / Brand Power / AI Reliability-pending-evals — the expected
pre-launch state, with the priority order to move each cell already named.

---

## 9. Operations — a real gap, not fully covered (🟡 Partial / fragmented)

There's no dedicated Operations module. What exists today is split across two
other folders:

- **`ai-feedback/`'s `launch-feedback` lens (✅)** — pre-launch risk read (90
  days out) and post-launch before/after comparison.
- **`data-analysis/experiment-analysis.md` (✅)** — the post-launch
  ship/iterate/kill framework: topline → statistical significance → segment
  analysis → quality metrics → leading indicators. This is genuinely strong
  and well-specified — it's just not organized under an "Operations" heading
  anywhere.

**What's missing**, matching `product-os/README.md`'s own lifecycle-phases
reference table (which names a "Support · Ops · SRE Agent" producing "triage
report, pull request" as the Operations phase owner): there's no dedicated
agent or artifact set for ongoing production support once something has
shipped and scaled — the actual day-2 operations of Ockham's own AI features
(monitoring the agent's own reliability in the field, triaging its failures,
routing customer-reported issues back into `ai-feedback/`/`ai-product-strategy/`).

**Proposing, with your permission:** either (a) leave this as-is — the two
existing pieces (`launch-feedback` + `experiment-analysis.md`) are enough for
now, revisit when `lifecycle/operations/` gets built — or (b) stand up a
minimal `product-os/operations/README.md` scaffold now (matching the
`ai-design/`/`ai-product-strategy/` pattern: an "expected artifacts" list, no
content yet) so the gap is at least named the same way the other two are.
I haven't done either — flagging for your call, not deciding it.

---

## 10. The two "not yet built" scaffolds, and where they actually connect

**`ai-product-strategy/` (⛔ Pending)** — the reasoning layer between company
context and execution: what to build, in what order, what not to build.
Expected artifacts: `product-vision.md`, `roadmap-sequencing.md`,
`bets-and-non-goals.md`, `moat-thesis.md`, `category-strategy.md`,
`competitive-strategy.md`, `build-vs-buy.md`. **Worth noting directly:** our
own `docs/superpowers/specs/2026-09-25-ockham-vision-repo-alignment-design.md`
already covers, in embryonic form, exactly what `roadmap-sequencing.md` (the
near-term-observability → security-pivot-trigger sequencing) and
`bets-and-non-goals.md` (the explicit non-goals) are meant to hold. When this
folder gets populated for real, that doc is the natural starting draft — not
something to silently copy over, a decision for you when it's time.

**`ai-design/` (⛔ Pending)** — covered in §5.

**`data-analysis/` (🟡 Partial, 2 of 8 artifacts)** — built:
`impact-estimation.md` (pre-build sizing: `Impact = Users Affected × Current
Action Rate × Expected Lift × Value per Action`, run pessimistic/realistic/
optimistic) and `experiment-analysis.md` (§9). Scaffold still: `market-sizing.md`,
`analyst-data.md`, `competitor-pricing.md`, `poc-metric-framework.md`,
`win-loss.md`, `icp-sizing.md`.

**`knowledge-hub/` (⛔ Pending, deliberately)** — empty because the product is
greenfield; there's nothing shipped yet to catalog. Its own README already
names the first population candidate: **catalog what already exists in
`platform-app/` and `ai-engine/`** — worth doing once `platform-app`'s
observability + agentic RCA capability (the pivot-trigger milestone from the
alignment doc) actually ships something real.

---

## 11. The data & KPI thread, end to end

This is the cross-cutting answer to "how is this data-centric": one
representative metric — **time-to-first-hypothesis** — threaded through every
phase, plus the general framework each phase uses.

| Phase | KPI mechanism | Built? |
|---|---|---|
| Discovery (stage 02) | Five-factor opportunity score (1–5, each with an AI angle) + the AI-native Native/Bolt-on gate | ✅ |
| PRD (stage 06, always) | North-star metric + primary/secondary/guardrail metrics table + explicit failure criteria | ✅ |
| PRD (stage 06, AI addendum E) | Accuracy/F1, hallucination/groundedness rate, calibration, latency, cost-per-run, correction rate — offline eval plan + online monitoring | ✅ |
| PRD (stage 10) | Build/operating cost, TAM/SAM/SOM, revenue scenarios (conservative/target/optimistic), measured-vs-gated impact | ✅ |
| Pre-build sizing | `impact-estimation.md`'s formula, run as 3 scenarios, cross-checked against stage 10's top-down numbers | ✅ (`data-analysis/`) |
| Post-launch | `experiment-analysis.md`'s 5-level hierarchy (topline → significance → segment → quality → leading indicators) → ship/iterate/kill | ✅ (`data-analysis/`) |
| Launch/scale | `ai-launch-strategy.md`'s 12-cell Green/Yellow/Red canvas; a gating-cell Red blocks scaling even if the PRD itself was Ready | ✅ |

**The one rule that ties all of it together** (`ai-pmf-strategy.md`'s **dual
metrics** principle, restated at PRD stage 06, the PRD Reviewer's *Metric &
Data Rigor* dimension, and again at the launch canvas): every AI feature is
judged on **both** a user/business metric and an AI-specific quality metric,
never one alone. Optimizing the business number while the AI-specific number
quietly degrades (a loosened hallucination guardrail, a relaxed confidence
threshold) is a named failure mode at three separate checkpoints, not just
one.

---

## 12. Quick-reference status table

| Module | Status | Note |
|---|---|---|
| `context-hub/` | ✅ Completed | All 6 docs seeded |
| `knowledge-hub/` | ⛔ Pending | Empty by design (greenfield); first candidate named in its own README |
| `ai-discovery/` | ✅ Completed | Agent + 6 stages + scorecard, all built |
| `ai-prd/` | ✅ Completed | 2 agents + 12 stages + template + rubric + citations, all built |
| `ai-feedback/` | ✅ Completed | Agent + 6 lenses built (dormant until real feedback data exists — pre-launch) |
| `ai-design/` | ⛔ Pending | Scaffold only — 7 expected artifacts named, none written |
| `ai-product-strategy/` | ⛔ Pending | Scaffold only — 7 expected artifacts named, none written; alignment doc partially pre-seeds it |
| `data-analysis/` | 🟡 Partial | 2 of 8 artifacts built (impact-estimation, experiment-analysis) |
| `gtm/` | ✅ Completed | Structure + Ockham's own ICP/signals/personas/battlecards populated; execution automation intentionally unpopulated pre-launch |
| `ai-pmf-strategy.md` | ✅ Completed | The framework everything else operationalizes |
| `ai-launch-strategy.md` | ✅ Completed | Scale-when-green gate, with Ockham's own current scored read |
| `messaging.md` | ✅ Completed | Hero copy + product message drafted (first pass, not yet ICP-validated) |
| Design/Planning/Development/QA/Deployment (engineering repo) | ✅ Completed | Proven this session — `superpowers` flow, not a product-os module |
| Operations (dedicated module) | 🟡 Partial / gap | Fragmented across `ai-feedback` + `data-analysis`; no dedicated module — see §9, needs your call |
| `lifecycle/` (unifying folder) | ⛔ Pending | Explicitly "planned," not started — deferred per the alignment doc |
| `ai-pdlc/` (product-side governance) | ⛔ Pending | Explicitly "planned," not started — deferred per the alignment doc |

---

## 13. Open items needing your decision

1. **Operations module (§9)** — leave the two fragments as-is, or stand up a
   minimal `product-os/operations/README.md` scaffold now to name the gap
   consistently with the other two scaffolds?
2. **`ai-product-strategy/` seeding (§10)** — when this folder gets built for
   real, use the alignment doc as the starting draft for
   `roadmap-sequencing.md`/`bets-and-non-goals.md`, or write it fresh?
3. **The platform-app-vs-customer-app routing question** from our prior
   discussion (does `ai-discovery`/`ai-prd` gate only `platform-app` features,
   with everything else — `customer-app`, infra — going straight to
   `superpowers:brainstorming`?) is **not re-decided here** — it's still open,
   tracked separately, not baked into this playbook as settled fact.

Nothing in any existing `product-os/` file was changed to produce this
document — it's a new, additive map, built from what's actually there today.

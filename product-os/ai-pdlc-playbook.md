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
│ RELEASE             ai-gtm/  ✅   ai-launch-strategy.md  ✅      │
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
positioning for fit gates; `ai-prd/`'s Ockham-fit checks; `ai-gtm/`'s ICP tiers
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
| Value per Action | ⛔ No | Would tie to `ai-gtm/pricing-and-packaging.md`'s edition ladder — that file is thin/unpopulated today |

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
| `ai-gtm/pricing-and-packaging.md` populated | ⛔ Pending | Depends on real pricing decisions, not data infrastructure — genuinely not fixable by building anything. |
| Prior Ockham experiments | ⛔ Pending | Can't exist before something ships — self-resolving over time. `data-analysis/calibration-log.md` (below) is ready to receive the first one. |
| Calibration loop (Discovery's `Expected Lift` vs. `experiment-analysis.md`'s measured lift) | ✅ Built | `data-analysis/calibration-log.md` — one row per shipped feature, written after the ship/iterate/kill call, read before the next feature's Expected Lift guess. One illustrative row exists; needs a real ship/iterate/kill call to populate for real. |

Two genuinely un-fixable items remain (`ai-gtm/pricing-and-packaging.md`, real
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

**Every stage below follows the same three-part shape as Discovery's** (§3):
Input (what it reads, including every prior stage's output and every
hub/data-analysis reference), Working flow (the exact numbered steps),
Output (the artifact, its real storage path, and which stage or module it
feeds). Storage convention, stated once: every artifact for a given feature
lives under `product-os/ai-prd/prds/<slug>/` — same `<slug>` its Discovery
Brief used, so the two trails share one name. **As of today, the `prds/`
folder itself does not exist anywhere in this repo** — same as
`ai-discovery/discovery/`, it's created the first time a real feature runs
through the loop.

### 4.1 Stage 01 — Idea Brief

**Input**
- The user's brief (line/paragraph/doc) — **or** a Discovery Brief from
  `ai-discovery/discovery/<slug>/`, if the idea came through Discovery:
  problem, hypothesis, opportunity score, primary JTBD, affected personas,
  the candidate-solutions table, and a suggested tier, all already
  validated.
- `context-hub/` — positioning, vision, ICP, metric rules.

**Working flow**
1. If a Discovery Brief exists, treat the next two steps as **verify and
   adopt, not re-derive** — copy its candidate-solutions table straight into
   `01-idea-brief.md` so stage 02 has it; build the evidence plan (step 5)
   from its "what the PRD must still prove" list, carrying any `[pre-build]`
   item straight to §15 with a "before build" due.
2. Restate the ask in one sentence — the feature, the user, the outcome.
3. Write the problem (a specific user, a specific cost of the status quo)
   and the hypothesis ("if we build X, then `<measurable>` will move,
   because …").
4. Run 3–5 Socratic questions and answer them from context, marking any
   assumed answers: *What specific pain does this solve? How do we know
   it's real? Who feels it most? What's the cost of not solving it? Why
   this, why now?*
5. Assign the risk tier (1–4) per `review-rubric.md`, with one sentence of
   why. The reviewer confirms or overrides this at stage 11 — its tier is
   authoritative.
6. List what you'd need to prove the hypothesis and where each piece would
   come from — this becomes the work order for stages 03–07.
7. **Gate:** the hypothesis is falsifiable and the tier is set. If the brief
   has two readings that change scope, stop and ask the user.

**Output**
- Artifact: `01-idea-brief.md` — one-sentence restatement · Problem /
  Hypothesis · Socratic Q&A (assumptions flagged) · Tier + rationale ·
  candidate-solutions table (carried, if any) · evidence plan.
- Storage: `product-os/ai-prd/prds/<slug>/stages/01-idea-brief.md`.
- Feeds: stage 02 — and its tier calibrates how deep every later stage runs
  (see "Effort scales to tier" above).

### 4.2 Stage 02 — Requirements

**Input**
- Stage 01's output, including any carried candidate-solutions table.
- The Discovery Brief itself, if this came from `ai-discovery/`.
- `context-hub/icp.md`, `context-hub/positioning.md`.
- `ai-product-strategy/` — ⛔ scaffold today, so this input is a no-op until
  that folder is real.
- `ai-feedback/` **cohort-compare** — where feedback data exists (today:
  `ai-feedback/sample-feedback.csv`, dummy) — scopes the shared vs
  differential vs unique persona split.

**Working flow**
1. Write Users & JTBD: primary and secondary personas, the job each is
   hiring this feature to do, who is explicitly not a user. Where feedback
   data exists, run `ai-feedback/`'s cohort-compare first — its split scopes
   these personas directly.
2. Write scope: **Goals** (few, priority-ordered, measurable, with guardrail
   metrics), **Non-goals** (deliberate exclusions, each with a why), **Out
   of scope this iteration** (deferred, with the revisit trigger).
3. Write constraints: performance, cost, security/tenant-isolation,
   compliance, platform, timeline — pull hard numbers from `knowledge-hub/`
   where they exist (today: empty, so this is mostly N/A until something
   ships).
4. Write 2–3 genuinely different strategic framings (e.g. surface-first vs
   workflow-first vs evidence-first), one paragraph each — the bet, what it
   optimizes, what it gives up — then pick one with rationale. If a
   Discovery Brief supplied candidate solutions, those are the starting
   framings — extend/re-score them rather than starting from scratch.
5. From the chosen framing + JTBD, write the `US-xxx` user stories (As a /
   I want / So that + P0/P1/P2) and derive one `FR-x` line per acceptance
   path. (Acceptance criteria themselves get filled at stage 08, finalized
   at stage 11.)
6. **Gate:** the scope boundary is explicit, one framing is chosen, and
   every user story has a priority.

**Output**
- Artifact: `02-requirements.md` — Users & JTBD · Goals/Non-goals/Out of
  scope · Constraints · Framings (2–3) + chosen framing + why · `US-xxx`
  stories + `FR-x` skeleton.
- Storage: `product-os/ai-prd/prds/<slug>/stages/02-requirements.md`.
- Feeds: stage 03 (constraints/scope inform the adjacent-systems check),
  stage 08 (user stories get their acceptance-criteria states filled in),
  and PRD §3/§4/§7's skeleton directly.

### 4.3 Stage 03 — Knowledge Gathering

**Input**
- Stage 02's output.
- `knowledge-hub/` — shipped features + dependencies (today: empty,
  greenfield — this check returns "nothing to reuse yet," not a real gap).
- Linked specs, prior PRDs/experiments (today: none exist — pre-launch,
  self-resolving).
- If from a Discovery Brief: its candidate-solutions table (a feasibility
  read) and "what we know" table (adjacent systems already named) — extend
  these, don't restart.

**Working flow**
1. Map what already ships near this problem — features, surfaces, data
   models, runtimes — and what's reusable.
2. List adjacent systems this feature would read from, write to, or sit
   beside; for each, note the dependency direction and what breaks if it
   changes.
3. Assess blast radius: second-order effects on load, cost, on-call
   surface, incentives, permissions/RBAC, tenant isolation.
4. Record prior attempts: has this been tried before, what happened, what
   was learned.
5. List open technical unknowns — things engineering will need to answer.
6. **Gate:** the adjacent-systems table is complete enough that the
   reviewer's dimension 5 (Adjacent Impact) can be checked against it;
   unknowns flow to §15.

**Output**
- Artifact: `03-knowledge-gathering.md` — Existing capability map ·
  Adjacent-systems table (system · direction · breaks-if) · Blast radius ·
  Prior attempts · Technical unknowns.
- Storage: `product-os/ai-prd/prds/<slug>/stages/03-knowledge-gathering.md`.
- Feeds: assembles directly into PRD §11 (Dependencies); feeds the
  Reviewer's dimension 5 (Adjacent Impact) at stage 11.

### 4.4 Stage 04 — Market & Competitor Research

**Input**
- Stages 01–03.
- `context-hub/competitive-landscape.md` — the fixed 7-competitor set (ops:
  Datadog, Dynatrace, Edge Delta, Resolve.ai; security: Upwind, Wiz,
  Dropzone.ai).
- Web research — only widen beyond the fixed set if the user says so.
- `ai-feedback/` **signal-scan** — where feedback data exists (today:
  `ai-feedback/sample-feedback.csv`) — its Contrast step surfaces real
  competitor mentions tied to the topic.
- If from a Discovery Brief: its opportunity score already sized the
  competitive gap — this stage builds the detailed table, it doesn't
  re-decide whether there's an opening.

**Working flow**
1. For each relevant competitor, capture: the comparable feature,
   pricing/gating (what plan or admin privilege unlocks it), the key
   limitation, and any user complaint/signal (G2, forums, docs) — run
   `ai-feedback/` signal-scan first where data exists, folding its
   competitor mentions into the "user complaint/signal" column, cited
   `[Feedback: …]`.
2. Name the opportunity for us per row — the concrete wedge, tied to
   Ockham's positioning (unified ops+security team/budget; one-sensor
   eBPF; time-to-first-hypothesis).
3. Note where a competitor's own messaging validates our approach — use it,
   don't avoid it.
4. Cite every competitor claim `[Source: …]` with doc/date; re-verify live —
   don't replay stale findings.
5. **Gate:** every row is cited and dated; the opening is specific, not
   "we'll be better."

**Output**
- Artifact: `04-market-competitor-research.md` — the §6.2 table + a short
  "opening for us" paragraph + validation notes.
- Storage: `product-os/ai-prd/prds/<slug>/stages/04-market-competitor-research.md`.
- Feeds: PRD §6.2 verbatim.

### 4.5 Stage 05 — Voice of Customer

**Input**
- Stages 01–02.
- Interview notes, support tickets, sales-call notes, community threads,
  churn reasons — whatever's connected.
- `ai-feedback/` — where a feedback tool (MCP) or CSV is available (today:
  `ai-feedback/sample-feedback.csv`) — its **prd-evidence-pack** lens *is*
  this stage's artifact; **cohort-compare** answers "who most."
- If from a Discovery Brief: its JTBD, personas, and "what we know" signals
  are the starting point — this stage deepens them with named quotes and
  the said-vs-did split, it doesn't rebuild them.

**Working flow**
1. Where a feedback source is available, run `ai-feedback/`'s
   prd-evidence-pack lens first — returns volume, trend, sentiment, segment
   breakdown, 5 attributed quotes, impact, and limitations, already tagged
   `[Feedback: …]`; run cohort-compare to answer who's affected most.
2. Pull named quotes and signals on top of that: who said it, what they
   said, the source — verbatim where possible.
3. Separate what users say from what they do (usage data, observed
   workarounds); flag where these diverge.
4. Segment by persona — the primary persona's demand matters most.
5. **Gap check:** if there's no feature-specific demand by name, say so
   explicitly and turn it into a §14 risk + a pre-GA action ("run 3–5
   interviews before broad GTM claims"). Label adjacent-but-not-exact
   signals as such.
6. **Gate:** §6.1's content is either real named demand or an explicit,
   logged gap — no invented quotes, ever.

**Output**
- Artifact: `05-voice-of-customer.md` — Named quotes/signals (with sources)
  · Say-vs-do notes · Per-persona demand · Gap statement.
- Storage: `product-os/ai-prd/prds/<slug>/stages/05-voice-of-customer.md`.
- Feeds: PRD §6.1 verbatim; its `[Feedback: …]` rows also carry into the
  Evidence Appendix (§17).

### 4.6 Stage 06 — Metrics & AI Design Strategy

**Input**
- Stages 01–03.
- `context-hub/` metric rules.
- `ai-pmf-strategy.md` — the dual-metrics principle.

**Working flow — always, every tier**
1. Write the north-star: one outcome metric, not a vanity count; honor the
   metric rules (time-to-first-hypothesis framing, never "in seconds").
2. Write primary & secondary metrics: metric · baseline · target · how
   tracked · horizon.
3. Write guardrail metrics — what must not regress.
4. Write failure criteria — the explicit conditions under which this
   feature is a failure and gets pulled or reworked.
5. Write events & tracking: event names, segments, dashboards; call out any
   "don't treat X as Y" trap.

**Working flow — AI-native features only (owns addendum A–H)**
6. Run the per-component **ML-necessity check** (addendum A): is ML
   necessary, data available, meets the accuracy bar, bias risk,
   explainable, feedback-loop speed → PASS/PARTIAL/FAIL + note. **A FAIL on
   "is ML necessary" means stop and flag it — don't build it as an AI
   feature.**
7. Add AI-specific metrics: accuracy/F1, hallucination/groundedness rate,
   calibration, latency, cost per run, correction rate.
8. Write the **grounding strategy** (addendum B): the single source of
   truth, what the model may/may not see, attribution required on every
   output, "not found" is a valid answer.
9. Write the **prompt strategy** (addendum C): per task — technique, output
   format, rationale — plus the prompt-improvement loop.
10. Write **hallucination guardrails** (addendum D): at inference/
    extraction, at chat, at the UI/human-in-the-loop.
11. Write the **evaluation strategy** (addendum E): ground-truth sources,
    offline eval plan (metric/method/target/cadence), online monitoring, the
    eval dataset location — stage 07 verifies any data claims this makes.
12. Write **production readiness / HHH** (addendum F): Helpful/Honest/
    Harmless × strength/risk/mitigation; launch criteria per Alpha/Beta/GA;
    Responsible AI.
13. Write the **agent-capabilities & autonomy** table (addendum G):
    component · input · output · autonomy level (observe → suggest →
    act-with-approval → act) · human-in-the-loop trigger.
14. Write **model requirements & selection trade-offs** (addendum H):
    model/provider, context window, temperature, max output tokens, latency
    target, cost per call — why this model beats the next-best alternative,
    and the fallback if pricing/availability changes.
15. **Gate:** the north-star is an outcome, failure criteria exist; for AI
    features, the ML-necessity check is done and addendum A–H is drafted.

**Output**
- Artifact: `06-metrics-strategy.md` — North-star · Metrics tables ·
  Guardrails · Failure criteria · Events (+ the full addendum A–H for
  AI-native features).
- Storage: `product-os/ai-prd/prds/<slug>/stages/06-metrics-strategy.md`.
- Feeds: PRD §10 (Data & Instrumentation) directly; the AI addendum
  assembles verbatim into the template's AI-native addendum section; feeds
  stage 07 (verifies its data claims) and the Reviewer's dimensions 4
  (Metric & Data Rigor) and 7 (AI Readiness).

### 4.7 Stage 07 — Evidence Gathering

**Input**
- Stages 01–06.
- Connected analytics/warehouse/logs/tickets.
- Market sources from stage 04.
- `data-analysis/` if populated — today: `impact-estimation.md`,
  `experiment-analysis.md`, and `calibration-log.md` all exist.
- `ai-feedback/` lens output from stage 05 (customer-feedback counts,
  tagged `[Feedback: …]`).
- The actual query recipe — `ai-pdlc-playbook.md` §3.8 — the
  postgres/prometheus MCP pattern for pulling real numbers, not just "run it
  live where you can" (this cross-reference is new; added directly to this
  stage's own file as part of this restructure).

**Working flow**
1. For each claim the PRD will make (impact of the problem, addressable
   base, adoption ceiling, cost, market size), get a figure and a source.
2. Run it live where you can — use the §3.8 query pattern against
   `platform-app`/`customer-app`'s live postgres/prometheus (via MCP, per
   root `CLAUDE.md` §2); record the query/source and the run date.
3. Tag every figure Measured/Assumed/Gated per `citations.md`: **Measured**
   (verified live this run), **Assumed** (estimate, state the basis),
   **Gated** (depends on an unconfirmed source — never present as proven,
   raise a §14 risk + §15 open question).
4. For each figure, write one line on what it proves and what it does not —
   guard against a scale number standing in for an adoption number.
5. Build the Evidence Appendix rows: claim · citation · source type.
6. **Gate:** every number the PRD will cite is in this file with a tag;
   Gated items are all mirrored into risks/open questions.

**Output**
- Artifact: `07-evidence-gathering.md` — Evidence table (claim · value ·
  tag · citation · proves/does-not-prove) · Evidence Appendix rows · Gated
  items carried forward.
- Storage: `product-os/ai-prd/prds/<slug>/stages/07-evidence-gathering.md`.
- Feeds: PRD §17 (Evidence Appendix) directly; its Gated items feed §14
  (Risks) and §15 (Open Questions).

### 4.8 Stage 08 — Visual Strategy

**Input**
- Stage 02 (chosen framing), stage 03 (where it lives/adjacent systems),
  stage 06 (what's shown).
- `ai-design/` principles — ⛔ scaffold only today, no principles actually
  written yet.
- Root `CLAUDE.md` §10 — the real bridge in the meantime: UI is drafted
  directly in Claude Design, without waiting on `ai-design/` (this note is
  new; added directly to this stage's own file as part of this restructure).

**Working flow**
1. Define surfaces: where the feature lives (module, nav entry, embedded vs
   standalone), and what it does not replace.
2. Write the screen list: each screen, its primary job, its key widgets.
3. Define states for every screen: default, loading, empty/zero-data,
   first-run, error, unauthorized. For AI features specifically: model/
   telemetry unavailable → show empty/error, **never invent metrics**.
4. Define information architecture: nav order, drill paths, what's advisory
   vs actionable.
5. Start the Claude Design draft directly (the `design` skill, per root
   `CLAUDE.md` §10) — link the artboards, note what's still open for
   design.
6. For each stage-02 user story, list the concrete negative/edge/
   cross-system cases its screens must handle, drawn from the state matrix
   — these become §7's acceptance criteria at assembly.
7. **Gate:** every screen has its non-happy states defined; the prototype
   path is noted for stage 09.

**Output**
- Artifact: `08-visual-strategy.md` — Surfaces · Screen list · State matrix
  · IA · link to the Claude Design draft · acceptance-criteria states per
  user story.
- Storage: `product-os/ai-prd/prds/<slug>/stages/08-visual-strategy.md`.
  The Claude Design artboards themselves are a published Artifact, not a
  repo file — link it here and note it in `prds/<slug>/prototype/`.
- Feeds: stage 09; its acceptance-criteria states assemble into PRD §7 at
  stage 11.

### 4.9 Stage 09 — Prototype Summary

**Input**
- Stage 08's output.
- The Claude Design draft.
- Any code/clickable prototype.

**Working flow**
1. State status: Generated / Partial / Not run. If not run, say why and
   what that leaves unvalidated.
2. Describe what it is: artboards vs clickable vs coded; where it lives
   (`prototype/`).
3. Describe what it validated: which flows/states hold up, what it exposed
   (dead ends, missing states, confusing IA).
4. Describe what it did not cover: flows still on paper only.
5. List open design questions → feeds §15.
6. **Gate:** honest status — "Not run" is acceptable; pretending otherwise
   is not.

**Output**
- Artifact: `09-prototype-summary.md` — Status · What it is · Validated ·
  Not covered · Open questions.
- Storage: `product-os/ai-prd/prds/<slug>/stages/09-prototype-summary.md`;
  prototype artifacts themselves in `product-os/ai-prd/prds/<slug>/prototype/`.
- Feeds: PRD §9.7 directly; open questions feed §15.

### 4.10 Stage 10 — ROI / Business Case

**Input**
- Stage 04 (market), stage 06 (metrics), stage 07 (evidence).
- `context-hub/icp.md`.
- `data-analysis/impact-estimation.md` — where telemetry exists, gives a
  bottoms-up scenario set to cross-check against the top-down TAM/SAM/SOM.
- `ai-gtm/pricing-and-packaging.md` — thin/unpopulated today, tracked in
  `product-os/TODO.md` item 2. Value per Action and the edition-ladder
  tie-in both stall here until it's populated — this is exactly where that
  parked gap bites hardest.

**Working flow**
1. Estimate build cost: rough team + duration, infra/model/tooling run
   cost.
2. Estimate operating cost: monthly at a stated usage level, cost per
   active user/per run, unit economics.
3. Size the market: TAM/SAM/SOM against the ICP, each with basis and tag
   (Measured/Assumed).
4. Write revenue scenarios: conservative/target/optimistic — paying
   customers · ARPU · ARR, with the assumption behind each.
5. Write the mini business case: the ICP, the adoption goal, the **measured
   wedge** (what live data proves) vs the **assumed/gated impact** (what it
   doesn't — never narrated as proven), and a one-line recommendation
   (proceed / proceed phased / don't).
6. **Gate:** measured vs gated impact are separated; the recommendation is
   explicit.

**Output**
- Artifact: `10-roi-business-case.md` — Build cost · Operating cost ·
  TAM/SAM/SOM · Revenue scenarios · Mini business case + recommendation.
- Storage: `product-os/ai-prd/prds/<slug>/stages/10-roi-business-case.md`.
- Feeds: PRD §12.1 (verbatim tables) and §5 (mini business case +
  recommendation).

### 4.11 Stage 11 — Draft PRD & Review

**Input**
- Stages 01–10, all of it.
- `prd-template.md`, `citations.md`, and the `prd-reviewer-agent`
  (`../../.claude/agents/prd-reviewer-agent.md`).

**Working flow**
1. Assemble `prd.md` to `prd-template.md` exactly — header block, an empty
   PRD Review block, sections 1–17, and the AI-native addendum if the
   feature's core value depends on a model. Each section pulls from a
   specific stage per the `prd-agent`'s own section-sourcing table (§1 from
   01+10, §2 from 01/05/07, §6 from 04/05/07, §17 from 07, the AI addendum
   from 06, and so on) — carry every Gated figure into §14/§15, cite every
   number.
2. Run the reviewer: invoke the `prd-reviewer-agent` against `prd.md`. It
   assembles 360° context (adjacent impacts via `knowledge-hub/`, partner
   concerns, prior experiments, the discovery trail if one exists,
   `context-hub/` consistency anchors), classifies the tier, scores the
   seven dimensions (Looks Good / Needs Review / Blocking), and returns the
   scorecard: launch-readiness rating, tier, major blindspot, dimension
   scores, detailed findings & write-ready fixes, prioritized action items.
3. Apply fixes: fold accepted action items into `prd.md`, citing each
   changed/added passage inline as `[Source: PRD Review]`. Fill the PRD
   Review block with the rating, blindspot, dimension scores, and Critical
   requirements list.
4. Re-check: the reviewer re-checks only the changed sections and finalizes
   the rating. If still **Not Ready** and the fix needs a decision you
   can't make from context (pricing, a policy owner, a strategy call), stop
   and ask the user.
5. **Gate:** launch-readiness is Ready or Ready with Caveats, with every
   Critical requirement logged in §14/§15 with an owner and a due.

**Output**
- Artifacts: `prd.md` (assembled + reviewed) and `11-draft-prd-and-review.md`
  (the scorecard + what was applied/deferred).
- Storage: `product-os/ai-prd/prds/<slug>/prd.md` (at the `prds/<slug>/`
  root, not under `stages/`) and
  `product-os/ai-prd/prds/<slug>/stages/11-draft-prd-and-review.md`.
- Feeds: stage 12 — the final checklist reads `prd.md` and this scorecard
  directly.

### 4.12 Stage 12 — Final Checklist

**Input**
- `prd.md`.
- The stage-11 scorecard.

**Working flow**
1. Work through the fixed checklist: header complete; PRD Review block
   filled with Ready/Ready with Caveats; overview passes the "repeat the
   bet" test; problem is concrete; every quantitative claim cited; every
   number tagged with no Gated-as-proven; VoC real or a logged risk; goals
   few and measurable with guardrails; non-goals/out-of-scope explicit;
   adjacent-systems map present with named owners for policy/pricing
   changes; north-star is an outcome with failure criteria; AI-native
   addendum fully present where applicable; user stories have full
   acceptance criteria; dependencies/blockers named with owners; rollout
   phased with honest labelling; open questions genuinely unresolved with
   owner + next step; every Discovery Brief `[pre-build]` item resolved or
   owned; Evidence Appendix complete; every Critical requirement owned +
   due.
2. Check each box, or explicitly waive it with a stated reason — never
   leave one silently unchecked.
3. **Gate:** all boxes checked or waived; `prd.md` is ready for human
   review.

**Output**
- Artifact: `12-final-checklist.md` — the checklist with each box checked
  or waived (with reason), and a one-line final status.
- Storage: `product-os/ai-prd/prds/<slug>/stages/12-final-checklist.md`.
- Feeds: nothing further inside `ai-prd/` — this is the loop's exit.
  Downstream: `ai-design/` (⛔ scaffold — bridged today by Claude Design
  directly, same as stage 08) and then engineering
  (`superpowers:brainstorming` → `writing-plans` → `executing-plans`, per
  §6 of this playbook), reusing the same `<slug>` per the traceability rule
  stated there.

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

## 8. Release — `ai-gtm/` (✅), `ai-launch-strategy.md` (✅), `messaging.md` (✅)

Three built modules, one phase: getting a shipped feature in front of real
buyers, and deciding whether to spend real money doing it.

**`messaging.md`** — the customer-facing 5-second-test copy, derived from
`positioning.md`. Hero headline/subhead, product one-liner, elevator pitch,
use-case-positioned campaign variants. **Feeds** `ai-launch-strategy.md`'s
Customer lens (does the ICP self-identify from the hero?) and `ai-gtm/`'s
`positioning-statement.md` + `messaging-by-persona.md`.

**`ai-gtm/`** — the sales-qualification/execution layer on top of context-hub:
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

**`ai-gtm/` is structurally different from Discovery and PRD**: not one
agent running a sequential stage loop, but **four independent,
single-shot plays** — each its own `.claude/agents/gtm-*.md` subagent, run
on demand, in any order. Same three-part shape as Discovery/PRD below
(Input / Working flow / Output), just per-play instead of per-stage.
Storage convention: every output files under `product-os/ai-gtm/outputs/`
— this folder **does** already exist and already holds real (fictional,
clearly-marked) worked examples in `product-os/ai-gtm/examples/`, unlike
Discovery's `discovery/` and PRD's `prds/`, which don't exist yet at all.

**`ai-gtm/playbooks/` is the connective layer between a trigger and a
play** — not a fifth play, and not covered by §8.1–§8.4 below on its own
terms. Each of the 6 playbooks (4 mapped to Ockham's own Tier-1 signals,
2 general motions from the GTM starter kit) reads *"trigger → situation →
which play to run, in what order → what to say → what not to do"* — human
strategy and talk-track guidance that sequences the plays, same category as
`workflows/` (human-facing), not agent-executed itself. E.g.
`playbooks/renewal-price-shock.md`: confirm the signal → run §8.2 (score
the account) → run §8.1 (research it) → lead with the pitch it specifies →
optionally pull a battlecard. A playbook is where a human decides *which*
play chain applies to a live situation; the plays are what actually run.

### 8.1 Play — Account Research

**Input**
- Account name + domain (from the user).
- `ai-gtm/icp-tiers.md` (fit), `ai-gtm/signal-library.md` (active signals),
  `ai-gtm/battlecards/` (competitive context), `ai-gtm/personas/` (who to
  reach).
- Public web sources: LinkedIn, Crunchbase, BuiltWith, the company's own
  blog/changelog/status page.

**Working flow**
1. Build the snapshot: funding + months since last raise, headcount +
   growth, hires in the last 90 days (GTM, platform, security), recent
   product/infra moves, tech stack.
2. Build the stakeholder map: 2–3 people per `ai-gtm/personas/` — name,
   title, time in role, recent public activity, best channel.
3. Run the signal check: for each Tier-1/Tier-2 signal, is it present, when
   did it fire, what's its decayed score contribution. Run the scoring play
   (§8.2) if not already done.
4. Assess competitive context: evidence of a fixed-7 competitor in the
   stack, job posts, or content; which battlecard applies.
5. Write the angle — the judgement step: why now (a datable event — if none
   exists, don't recommend outreach), why us, the hook (passes PVP), who
   sends it.
6. **Gate:** "why now" is a datable event, not a generic assumption; ≥2
   reachable stakeholders; signal score recorded; competitive context
   checked.

**Output**
- Artifact: `product-os/ai-gtm/outputs/YYYY-MM-DD-research-<account>.md`.
- Feeds: a recommended next action — usually §8.2 (score it) or §8.3 (build
  a sequence) if the account is already in-tier.

### 8.2 Play — Account Scoring

**Input**
- Account name/domain, or a list, plus any known firmographic/technographic
  data.
- `ai-gtm/account-scoring.md` (the point-table model + hard gates),
  `ai-gtm/icp-tiers.md` (criteria), `ai-gtm/signal-library.md` (signal
  points + decay).

**Working flow**
1. Gather firmographic, technographic, and organizational fit data; mark
   any field that's inferred rather than confirmed.
2. Score Part 1 (0–70, fit) and Part 2 (signal points, decayed, capped 30).
3. Apply the hard gates: a suppression rule → Exclude; a disqualifier
   present → cap at Tier 4; a Tier-1 score with no live Tier-1 behavioural
   signal → treat as Tier 2. Never skip a gate because the rest of the
   score looks strong.
4. Assign the tier; write what qualifies, what reduces the score, the next
   action, and the re-score trigger.
5. **Gate:** every account has a tier, a next action, a re-score trigger;
   disqualifiers explicitly checked; inferred fields marked.

**Output**
- Artifact: `product-os/ai-gtm/outputs/YYYY-MM-DD-scoring-<name-or-list>.md`
  — single account or a batch table sorted by score, Tier 1 flagged.
- Feeds: §8.3 (a scored, tiered account is the input a campaign segments
  by); §8.1 (research often runs this play mid-flow to confirm a tier).

### 8.3 Play — Signal to Sequence

**Input**
- The signal(s) + target segment/persona.
- `ai-gtm/icp-tiers.md`, `ai-gtm/personas/`, `ai-gtm/battlecards/` (if a
  competitor is in play), the copy standard
  (`ai-gtm/messaging-by-persona.md` + `messaging.md`).

**Working flow**
1. Write the trigger logic in plain language before any copy: single- or
   multi-signal, minimum score, recency window, suppression conditions
   (from `signal-library.md`).
2. Segment by tier, persona, and account status (cold / previously
   contacted / dark opp).
3. Set sequence structure by tier: Tier 1 → 6–8 touches, all channels,
   manual personalization on 1–3; Tier 2 → 5–7, email + LinkedIn; Tier 3 →
   4–5, email-first, templated.
4. Write every touch. Touch 1 (Tier 1 & 2) must pass PVP (remove the CTA —
   does it still carry value?); honor the metric rules (no "in seconds,"
   time-to-first-hypothesis, "you can check its work," fixed-7 competitors
   only).
5. Write the measurement plan: reply/meeting/pipeline targets by tier,
   what's tracked, review points at 2 and 6 weeks.
6. **Gate:** touch 1 passes PVP; the signal hook is specific and datable;
   one CTA; suppression list applied; targets set before launch.

**Output**
- Artifact: `product-os/ai-gtm/outputs/campaigns/YYYY-MM-DD-<campaign-name>/`
  — `brief.md`, `sequences/tier{1,2,3}.md`, `metrics.md`, `results.md`
  (updated as it runs).
- Feeds: `results.md` back into `signal-library.md`'s Performance Log (via
  §8.4); this is the one play with real-world consequence — **the drafted
  campaign is never loaded into a real send system by this play itself**,
  that's always a separate human action.

### 8.4 Play — Weekly Update

**Input**
- `ai-gtm/README.md` §Status, `ai-gtm/signal-library.md` §Performance Log,
  `ai-gtm/account-scoring.md` §Calibration Log, `ai-gtm/icp-tiers.md`
  §Evolution Log, every `outputs/campaigns/*/results.md`, any
  `outputs/*` from the last 14 days.

**Working flow**
1. Run the staleness check: README priorities untouched 7+ days; a campaign
   live 14+ days with no performance-log row; a results table older than 7
   days; battlecards >60 days old; ICP evolution log >90 days. Print the
   summary before drafting anything.
2. Draft the diff per stale section — CURRENT → PROPOSED → QUESTIONS FOR
   YOU. Signal Performance Log rows get computed from real campaign
   results; battlecards and the ICP Evolution Log get a flag and a
   question instead of a draft — those need real competitive/market
   judgement this play doesn't have.
3. **Apply only on confirm** — write nothing until the user approves the
   diff. Never invent a performance number not already in the repo.
4. Log one line to `outputs/weekly-log.md`.
5. **Gate:** every stale section updated or has a logged open question; no
   invented numbers; changes applied only after confirmation.

**Output**
- Artifacts: edits applied directly to the relevant `ai-gtm/` files, plus
  one line appended to `product-os/ai-gtm/outputs/weekly-log.md`. No
  separate output file — this play's product is the diff, applied in place.
- Feeds: keeps every other play's inputs (the scoring model, signal
  library, battlecards) accurate for next time they run.

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
| `ai-gtm/` | ✅ Completed | Structure + Ockham's own ICP/signals/personas/battlecards populated; execution automation intentionally unpopulated pre-launch |
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

# AI Launch Strategy — the Scale-When-Green Gate

The readiness gate Ockham clears **before putting real GTM spend behind a
launch**. It operationalises Phase 3 of [`ai-pmf-strategy.md`](ai-pmf-strategy.md)
using Product Faculty's **AI Launch Strategy Canvas** — four lenses
(Customer · Product · Company · Competition), three factors each, every factor
scored **Green / Yellow / Red**.

> **Scale when green, not before.** Pouring growth spend in while a factor is red
> is a named PMF failure mode. A red factor doesn't block *shipping* — it blocks
> *scaling*, and it names the work that has to happen first.

---

## When to run it

- After the PRD's Rollout & Launch Plan (`ai-prd/` §13), **before** committing
  GTM budget, sales hiring, or paid acquisition.
- Re-scored at every major launch and every functional milestone
  (Alpha → Beta → GA → expansion).
- Score each cell with one line of evidence, tagged **Measured / Assumed /
  Gated** — same honesty rule as [`ai-prd/citations.md`](ai-prd/citations.md).

### How it differs from the PRD reviewer

| | AI Launch Strategy Canvas | PRD Reviewer |
|---|---|---|
| Scope | A launch / the product line | One PRD |
| Question | Should we *scale* this? | Is this PRD *ready to build*? |
| Cadence | Per launch / milestone | Per PRD |
| Output | 12-cell traffic-light + scale / hold call | Ready / Ready with Caveats / Not Ready |

---

## The canvas

### CUSTOMER — is the demand real and reachable?

| Factor | The question | Green | Yellow | Red |
|---|---|---|---|---|
| **Customer Segments** | Segment size and growth rate | Large, enumerable, growing double digits | Adequate but flat, or hard to enumerate | Small or shrinking; can't name 50 real accounts |
| **Customer Retention** | Organic frequency of how often the product is needed | Needed daily / in every incident; sticky by nature | Needed weekly–monthly; nice-to-have cadence | Occasional; no natural reason to return |
| **Customer Pain** | Magnitude & severity of the pain | Named, quantified, budgeted-for; users are actively looking | Real but tolerated; no active search | Speculative; only *we* think it hurts |

→ **Ockham:** the ICP is deliberately narrow — 100–1,000 employees, IT org
20–80, **no dedicated SOC**, AWS + Kubernetes, one team owning uptime *and*
security. **Segments = Yellow by design** (the wedge is precision, not breadth).
**Retention = Green** — ops + security is a continuous daily job.
**Pain = Yellow** — the unified-budget / unified-team pain is Assumed until
named-customer VoC exists, not Measured.

### PRODUCT — does it work, reach, and stay ours?

| Factor | The question | Green | Yellow | Red |
|---|---|---|---|---|
| **AI Reliability** | Can you consistently deliver quality AI outputs? | Eval suite green across diverse cases; groundedness + accuracy meet the bar; failures degrade safely | Quality holds on the demo path; no broad eval coverage yet | Output varies run-to-run; no evals; hallucinations reach users |
| **Product's Reach** | Strength of the reach of your product | Existing distribution, install base, or channel; users pull others in | Some inbound; reach depends on paid acquisition | Greenfield — no channel, no install base |
| **Product Uniqueness** | Is it likely competitors will copy your feature set? | Structural moat — data / architecture a point vendor can't replicate quickly | Feature lead of a few quarters; copyable with effort | Thin wrapper; a competitor ships it in a sprint |

→ **Ockham:** **AI Reliability = Red → Yellow** — the design stance is strong
(ranked, evidence-backed answers you can check; never a single guess;
time-to-first-hypothesis framing) but actual reliability is **Gated** until the
offline + online eval plan runs (`ai-prd/` stage 06, addendum E).
**Reach = Red** — pre-launch demo, no install base.
**Uniqueness = Green** — one eBPF sensor feeding APM *and* security is the moat;
a vendor running only one side can't replicate it
([`context-hub/ebpf-signal-thesis.md`](context-hub/ebpf-signal-thesis.md)).

### COMPANY — can we operate and sell it at scale?

| Factor | The question | Green | Yellow | Red |
|---|---|---|---|---|
| **AI Infrastructure** | Can you scale AI performance and manage costs effectively? | Cost per run known and sustainable at 10×; latency SLOs hold under load | Unit economics modelled but unproven at volume | Cost per run unknown, or scales worse than linearly |
| **Go-To-Market Viability** | Can you sell it? | Repeatable motion — known buyer, cycle length, price point; 3+ closed the same way | 1–2 design-partner deals; motion not yet repeatable | No closed deals; buyer or pricing still unclear |
| **Supplier Power** | How much power do your suppliers have? | Provider-agnostic; can switch model vendors without a rewrite | One primary provider; migration possible but costly | Locked to one provider's proprietary API / pricing, no fallback |

→ **Ockham:** **AI Infrastructure = Yellow** — LLM cost per investigation at
scale is unmodelled. **GTM Viability = Yellow → Red** — the thesis (sell to the
IT Director / CIO on *one* budget for *one* team, not the CISO) is coherent but
unproven; zero closed deals. **Supplier Power = Yellow** — mitigated by keeping
prompts and the agent graph provider-portable, matching `ai-engine/`'s
provider-agnostic stance.

### COMPETITION — is the space defensible?

| Factor | The question | Green | Yellow | Red |
|---|---|---|---|---|
| **Competitive Rivalry** | Number of competitors in your space | Few, or none positioned the way you are | Crowded but differentiated; you have a clear lane | Many well-funded players doing the same thing |
| **Barriers to Entry** | How easy is it for new competitors to enter? | High — data, integrations, or trust take years to build | Moderate — a funded team could enter within a year | Low — a weekend project clones the core |
| **Brand Power** | How much brand awareness do you have? | Known name; inbound from reputation; category association | Some recognition in a niche; growing | Unknown; every deal starts cold |

→ **Ockham:** **Rivalry = Yellow** — seven named competitors (Datadog,
Dynatrace, Edge Delta, Resolve.ai on ops; Upwind, Wiz, Dropzone.ai on security)
but **none unified across both budgets** — that gap is the entire position
([`context-hub/competitive-landscape.md`](context-hub/competitive-landscape.md)).
**Barriers = Yellow** — the eBPF + dual-domain data position is a real barrier,
but an incumbent (Datadog) bolting on security is the live threat.
**Brand Power = Red** — unknown; expected pre-launch.

*(The Competition lens plus Supplier Power is Porter's Five Forces adapted for
AI — rivalry, new entrants, supplier power, with brand and uniqueness standing
in for buyer power and substitutes.)*

---

## Scoring and the gate

1. Score all 12 cells **Green / Yellow / Red**, one line of tagged evidence each.
2. Apply the gate:

| State | Call |
|---|---|
| All 12 **Green** | **Scale** — full GTM investment. |
| Any **Red** in a **gating** cell — Customer Pain, AI Reliability, Go-To-Market Viability | **Do not scale.** The red cell is the top work item; hold GTM spend at maintenance. |
| **Red** only in non-gating cells | **Scale narrowly** — a bounded segment or motion that doesn't depend on the red cell; each red has an owner + a path to Yellow. |
| Mostly **Yellow** | **Hold** — keep shipping and running design-partner deals; re-score at the next milestone. No growth spend yet. |

3. A gating-cell **Red** maps to a **Not Ready** launch-readiness rating if a PRD
   claims scale-stage outcomes as proven — the reviewer cross-checks
   ([`ai-prd/review-rubric.md`](ai-prd/review-rubric.md), *Metric & Data Rigor*).

---

## Ockham's read today (2026-09-04)

Pre-launch demo — the canvas is **mostly Yellow, with Red on Product's Reach,
Brand Power, and AI Reliability (pending evals)**. That is the expected state; the
value is that it names the pre-scale work precisely:

| Priority | Cell | To move it up |
|---|---|---|
| 1 | AI Reliability | Run the offline + online eval plan; publish groundedness + accuracy against the bar |
| 2 | Go-To-Market Viability | Close 2–3 design-partner deals through the same IT-Director motion |
| 3 | Customer Pain | Named-customer VoC — 5+ interviews confirming the unified-budget pain *and* a fix budget |
| 4 | AI Infrastructure | Model cost per investigation at projected volume |
| — | Product's Reach · Brand Power | Move with GTM over time; not gating for a design-partner launch |

---

## How the Product OS applies this

| Canvas lens | Owned by | Fed by |
|---|---|---|
| Customer — Segments, Retention, Pain | `gtm/` | `context-hub/icp.md`; `ai-feedback/` (signal-scan for Pain, pattern-classification for reach); VoC from `ai-prd/` stage 05 |
| Product — AI Reliability | `ai-prd/` stage 06 + addendum E | eval results |
| Product — Reach, Uniqueness | `ai-product-strategy/` | `context-hub/ebpf-signal-thesis.md`, `positioning.md` |
| Company — AI Infrastructure | `ai-prd/` addendum F + engineering | cost + latency measurements |
| Company — GTM Viability, Supplier Power | `gtm/` (`launch-plan.md`, `account-scoring.md`) + `ai-product-strategy/` | design-partner pipeline; `ai-engine/` provider stance |
| Competition — all three | `ai-product-strategy/` + `gtm/battlecards/` | `context-hub/competitive-landscape.md` |

Re-scored at each major launch — post-launch, `ai-feedback/`'s **launch-feedback**
lens supplies the before/after read. A **Yellow → Red** move on any gating cell
is escalated to `ai-product-strategy/` immediately, not deferred to the next
review.

When `lifecycle/` is built, this doc folds into `lifecycle/release/` alongside
`gtm/`.

---

**Sources:** Product Faculty — *AI Launch Strategy Canvas*; complements
*PMF for AI Products* Phase 3 (productmanagement.ai). Captured 2026-09-04.

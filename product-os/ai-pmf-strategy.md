# AI Product-Market Fit — Strategy for Growth & Success

How Ockham finds, builds, scales, and compounds product-market fit as an
**AI-native** product. Framework from *PMF for AI Products* (productmanagement.ai)
— captured here and mapped onto the Product OS.

> **The AI PMF Paradox** — it's *easier* because AI lets you iterate faster; it's
> *harder* because user expectations have skyrocketed. **PMF is a moving target,
> not a checkbox you clear once.**

---

## AI PMF vs traditional PMF

| Aspect | Traditional | AI era |
|---|---|---|
| **Problem** | Known, stable | Evolves as users learn what AI can do; AI unlocks new workflows |
| **Solution space** | Bounded by dev resources | Bounded by training data + model capability + prompt design |
| **User expectations** | A relatively stable bar | Compounding exponentially — every good AI product raises the bar |
| **Success metrics** | Engagement / conversion | **Dual** — user metrics **and** AI-specific metrics |
| **Competitive advantage** | Product features | Model performance, data quality, user trust |
| **Scaling challenge** | Technical infrastructure | Holding quality across ever more diverse use cases |

> *"Traditional PRDs assume deterministic behavior. AI PRDs assume probabilistic
> behavior."*

---

## The four phases

### Phase 1 — Opportunity spotting: find AI-native pain

Look for **invisible pain points** — friction so embedded in a workflow that
users have stopped calling it a problem (watch for workarounds, not feature
requests).

An **AI-native opportunity** is a pain solvable *only* through AI's unique
capabilities — not one you reach by bolting AI onto an existing solution.

> *"The biggest mistake AI founders make is adding AI on top of existing
> workflows instead of identifying AI-native pain points."*

**Five-question opportunity ranking** (each with its AI angle):

| # | Question | AI angle |
|---|---|---|
| 1 | **Magnitude** — how many people have this pain? | Does it exist across industries where AI applies horizontally? |
| 2 | **Frequency** — how often do they hit it? | Frequent enough to generate the data AI needs to learn and improve? |
| 3 | **Severity** — how bad is it? | Does it involve cognitive load, pattern recognition, or decision-making — where AI excels? |
| 4 | **Competition** — who else solves it? | Are current solutions capped by *human* constraints AI could transcend? |
| 5 | **Contrast** — is there a loud complaint about how competitors solve it? | Do users complain about lack of personalization, speed, or intelligence? |

→ **Ockham:** this is `ai-discovery/` (stages 01–02 + `opportunity-scorecard.md`).

### Phase 2 — Build the MVP: the 4D method

| D | Purpose | Activities |
|---|---|---|
| **Discover** | Understand market / business / product / user context → an **AI Solution Hypothesis** | Map the business value AI creates · identify the target persona + their current journey · spot the pain AI *uniquely* addresses · form a hypothesis for how AI changes the experience |
| **Design** | Define the target-state workflow and UX | Design the future workflow with AI integrated · wireframe the AI interactions clearly · prototype the AI capabilities · draft the initial prompts + interaction patterns |
| **Develop** | Build and refine the AI capability | Select the model for the use case · define input specs + output quality criteria · iterate prompts + system instructions · prepare data for training / RAG · **build evaluation sets** |
| **Deploy** | Launch and scale | Finalize launch + rollout · establish **dual** success metrics (user + AI) · set up monitoring + feedback loops · plan continuous improvement |

→ **Ockham:** Discover → `ai-discovery/` stages 03–05 (Discovery Brief); Design →
`ai-design/`; Develop + Deploy → `ai-prd/` (the PRD's AI addendum: grounding,
prompt strategy, hallucination guardrails, eval strategy) + engineering.

### Phase 3 — Scale: the Launch Strategy Canvas

Four readiness dimensions. **Only scale when all four are green.**

| Dimension | Ready means |
|---|---|
| **Customer readiness** | Target segment is sizeable and growing · retention + organic usage frequency are real · the pain is big enough that users will pay |
| **Product readiness** | The unfair advantage (data, model, or market access) is strong · reach + viral potential exist · the AI capability is genuinely differentiated vs competition |
| **Company readiness** | The AI infrastructure can scale technically · GTM + sales process are validated · the team can absorb rapid growth and AI complexity |
| **Competition readiness** | Few / weak competitors · barriers to entry for new AI entrants · manageable supplier power (dependence on model providers) |

→ **Ockham:** `ai-product-strategy/` (roadmap sequencing, competitive strategy) +
`gtm/` (launch plan). Scaling before all four are green is a named failure mode.

### Phase 4 — Optimize for sustainable growth

| Lever | The idea | Do |
|---|---|---|
| **Data network effects** | Every interaction makes the AI smarter for all users | Feedback loops that improve model performance · use user corrections to fine-tune · learn from successful outcomes |
| **Intelligence moats** | AI *performance* is the competitive advantage | Proprietary datasets competitors can't replicate · AI workflows uniquely valuable in your domain · interfaces that make the AI's capability accessible |
| **Trust compounding** | User confidence drives organic growth | Hold quality standards as you scale · explain AI decisions clearly · handle edge cases gracefully and transparently |

→ **Ockham:** `ai-product-strategy/moat-thesis.md`; feeds back into `context-hub/`.

---

## Dual success metrics

Every AI feature tracks **both**:

| Traditional (user) | AI-specific |
|---|---|
| Engagement | Accuracy (task metric / F1) |
| Retention | Hallucination rate / groundedness |
| Conversion | Response quality |
| | (+ calibration, cost per run, correction rate) |

Ignoring AI-specific metrics in favour of the conversion funnel is a named
failure mode. Same rule as `ai-prd/` stage 06 and the reviewer's *Metric & Data
Rigor* dimension.

---

## Failure modes to avoid

1. **Treating PMF as a checkbox** — it's a moving target; recalibrate continuously.
2. **Adding AI on top of an existing workflow** instead of finding AI-native pain.
3. **Waterfall thinking on a probabilistic system** — plan for iteration and
   evals, not a one-shot spec.
4. **Premature scaling** — before all four readiness dimensions are green.
5. **Letting AI quality slip** as use cases diversify — the real scaling
   challenge is quality, not infrastructure.

---

## Glossary

- **AI PMF Paradox** — easier to iterate, harder to satisfy; expectations keep rising.
- **Invisible pain points** — friction so embedded users no longer call it a problem.
- **AI-native opportunity** — a pain solvable *only* via AI's unique capabilities.
- **Data network effects** — usage → corrections → a better model for everyone.
- **Intelligence moats** — model performance + proprietary data as the durable advantage.
- **Trust compounding** — reliability and transparency turning into organic growth.
- **Probabilistic vs deterministic behaviour** — the core spec difference for AI products.

---

## How the Product OS applies this

| Phase / concept | Owned by |
|---|---|
| Opportunity spotting · 5-question ranking · AI-native check | `ai-discovery/` (`opportunity-scorecard.md`) |
| 4D **Discover** · problem validation | `ai-discovery/` stages 03–05 → Discovery Brief |
| 4D **Design** | `ai-design/` |
| 4D **Develop + Deploy** · dual metrics · grounding / prompts / evals | `ai-prd/` (AI addendum, stage 06) |
| Launch Strategy Canvas · scale-when-green | `ai-product-strategy/` + `gtm/` |
| Data network effects · intelligence moats · trust compounding | `ai-product-strategy/moat-thesis.md` → `context-hub/` |
| Dual-metric enforcement · probabilistic-behaviour check | PRD Reviewer — *AI Readiness* + *Metric & Data Rigor* dimensions |

## Where Ockham already aligns

- **Intelligence moat + data network effects** — the one-sensor eBPF stream and
  ops×security data together (`context-hub/ebpf-signal-thesis.md`,
  `agentic-use-cases.md`) *are* this: a proprietary data position that a
  competitor running only one side can't replicate.
- **Trust compounding** — the "you can check its work" proof-chains line
  (`context-hub/positioning.md`) is trust-as-growth-engine, stated as positioning.
- **Dual metrics** — the metric rules (time-to-first-hypothesis; "say what it
  produces, not how fast") are the user-metric half; the AI-specific half is
  enforced in `ai-prd/`.
- **AI-native check** — Ockham's ICP + positioning wedge means an "existing
  workflow + AI on top" idea also fails *Ockham fit*, not just the AI-native gate.

---

**Source:** *PMF for AI Products* — https://www.productmanagement.ai/p/pmf-for-ai-products
· captured 2026-09-04.

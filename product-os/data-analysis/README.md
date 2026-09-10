# Data Analysis

Market and evidence base for product and GTM decisions. Numbers and sourced
claims live here so other modules can cite instead of restate.

**Quantitative half** of the evidence base — market sizing, pricing, analyst
data, product metrics. The **qualitative half** (what customers *say* — themes,
quotes, feedback volume) is [`../ai-feedback/`](../ai-feedback/). A PRD's §6
pulls from both.

## Built

- [`impact-estimation.md`](impact-estimation.md) — pre-build feature sizing:
  `Impact = Users Affected × Current Action Rate × Expected Lift × Value per
  Action`, run as pessimistic/realistic/optimistic scenarios. The bottom-up
  complement to stage 10's top-down TAM/SAM/SOM once telemetry exists. Adapted
  from the ccforpms.com "analyze data" impact-estimation method.
- [`experiment-analysis.md`](experiment-analysis.md) — post-launch ship /
  iterate / kill framework: topline → statistical significance → segment
  analysis → quality metrics → leading indicators. Adapted from the same
  source's experiment-analysis hierarchy.

## Expected artifacts (built on direction)

- `market-sizing.md` — TAM / SAM / SOM against the ICP (midsize enterprise, no
  SOC, AWS + Kubernetes)
- `analyst-data.md` — Gartner AI SRE Market Guide points, adoption curve
  (<5% 2025 → 85% 2029), AI-caused-outage projection, with dates and sources
- `competitor-pricing.md` — Datadog / Dynatrace / New Relic / Splunk pricing and
  the renewal-shock trigger, quantified
- `poc-metric-framework.md` — time-to-first-hypothesis definition, measurement
  method, what a POC counts as a pass
- `win-loss.md` — template + log
- `icp-sizing.md` — how many accounts actually match the qualifier +
  disqualifier set

## Feeds

Every module. Specifically: `impact-estimation.md` grounds
`ai-discovery/`'s opportunity scoring and `ai-prd/`'s stage 10 / PRD §12.1;
`experiment-analysis.md` grounds `ai-prd/`'s Addendum E online-monitoring plan
and `ai-launch-strategy.md`'s scale-when-green gate.

## Status

Partially built — two of eight artifacts (the product-analytics half:
pre-build sizing + post-launch evaluation). The market/pricing/analyst
evidence-base artifacts above remain scaffold.

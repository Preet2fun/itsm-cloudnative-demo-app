# Opportunity Scorecard

Used by [`discovery-agent.md`](discovery-agent.md) at stage 02. A structured
judgement, not a formula — score each factor 1–5, write the one-line reason and
the AI angle, then read the whole picture against the two gates.

---

## Part A — The five factors  *(PMF for AI Products)*

| Factor | Question | AI angle | 1 | 5 |
|---|---|---|---|---|
| **Magnitude** | How many people / tenants have this pain? | Does it apply horizontally across industries? | niche | broad |
| **Frequency** | How often does it occur? | Does it generate enough data for a model to learn from? | rare | constant |
| **Severity** | How bad is it when it happens? | Does it involve cognitive load, pattern recognition, or a judgement call? | annoyance | costs money / trust / hours |
| **Competition** | Who else solves this, how well? | Are current solutions capped by human constraints — speed, coverage, hours? | solved well | unsolved or badly |
| **Contrast** | What do users complain about vs the alternatives? | Do they want more intelligence / speed / coverage — not just more features? | no gap | loud, specific gap |

Score each 1–5 with a reason + the AI angle. Mostly 3+ leans Pursue; mostly ≤2
leans Kill.

---

## Part B — The AI-native check  *(gate, not a score)*

> The biggest mistake is taking an existing workflow and adding AI on top.

Answer plainly — **does the value require the model, or is the model a garnish?**

- **Native** — the outcome is impractical without the model: reasoning over messy
  signal, correlation at a scale a human can't hold, a judgement call made in the
  time a human couldn't. → proceed.
- **Bolt-on** — a deterministic feature would deliver most of the value; the
  model just makes it sound modern. → Kill, or Park until there's a real angle.

This is the early, coarse version of the PRD Agent's per-component ML-necessity
check.

---

## Part C — Ockham fit  *(gates + note)*

| Check | Source | Pass looks like |
|---|---|---|
| **ICP** | `../context-hub/icp.md` | the pain sits with the target buyer (IT Director / CIO; one team owns uptime + security; no SOC) — not a disqualified segment (staffed SOC, on-prem majority, Azure/GCP-first, 5,000+ employees) |
| **Positioning** | `../context-hub/positioning.md` | it deepens the unified-team / unified-budget wedge — not a feature race with Datadog |
| **Moat** | `../context-hub/agentic-use-cases.md`, `ebpf-signal-thesis.md` | it uses ops **and** security data together, or the one-sensor eBPF advantage |
| **Horizon** | `../ai-product-strategy/` | it's on the current horizon, not two out |

A strong opportunity that fails ICP or positioning is a **Park** or **Kill**, not
a Pursue — say which, and why.

---

## Reading the score

| Lean | When |
|---|---|
| **Pursue** | factors mostly 3+, AI-native = Native, all fit gates pass |
| **Park** | strong opportunity, but a fit gate or a blocking assumption isn't resolvable now |
| **Kill** | AI-native = Bolt-on, or factors mostly ≤2, or a disqualifier |

This is a **lean**, not the decision — stages 03–05 test it before stage 06
commits.

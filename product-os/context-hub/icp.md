# Ideal Customer Profile

## Firmographic

- Midsize enterprise in Gartner's sense — roughly **100–1,000 employees**, under
  about **$1B revenue**
- **IT org of 20–80 people**
- **No dedicated SOC.** The single most important qualifier. If they have a
  staffed SOC, they have a SIEM incumbent and a CISO who buys separately, and the
  convergence wedge stops working.
- Sectors where compliance is mandatory but security headcount isn't: financial
  services, insurance, healthcare, public sector, regulated services

## Technographic

- Cloud-native or cloud-majority on **AWS** (our first-class cloud)
- **Containers and Kubernetes in production** — this is what makes eBPF and CSPM
  worth anything to them
- Currently running **3–6 separate tools** across monitoring, logging, cloud
  posture, and vulnerability scanning
- Often a hyperscaler-native security baseline (AWS Security Hub, GuardDuty)
  they've outgrown

## Organizational — the real qualifier

- **One team owns uptime and security posture.** Not two teams that cooperate.
  One team, one on-call rotation, one budget.
- Economic buyer is **IT Director, Head of Infrastructure, or CIO** — not a CISO
- No dedicated SRE function either; the same engineers do platform work and
  incident response

## Behavioural triggers

- Renewal or price shock on Datadog, New Relic, or Splunk
- A compliance deadline — SOC 2, DORA, a regulator audit, a customer security
  questionnaire
- A recent incident where the ops-versus-attack question took hours to answer
- Cloud migration crossing the point where hyperscaler-native tools stop being
  enough

## Disqualifiers — each is a deal you lose late and expensively

- **Has a staffed SOC with a SIEM incumbent.** You'd be replacing a security
  platform on security terms. Not our fight.
- **Majority on-prem estate.** Our security is cloud-only by design. Say so early.
- **Azure- or GCP-first.** Revisit after CIEM and multi-cloud land.
- **Large enterprise, 5,000+ employees.** Separate budgets, separate teams,
  best-of-breed procurement, competitive bake-offs against vendors with published
  numbers we don't have yet.
- **Wants autonomy on day one.** Only 17% have deployed agents at all; a buyer
  demanding full autonomy immediately will churn when the trust ramp meets
  reality.

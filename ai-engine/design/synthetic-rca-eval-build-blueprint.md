# Synthetic RCA Evaluation — Build Blueprint

Intent: build a scored, adversarial synthetic RCA test suite for our agentic
SRE system, reusing the architecture validated by `Tracer-Cloud/opensre`'s
`tests/synthetic/` but wired to our own environment: kubeadm K8s cluster,
Prometheus + Loki + Jaeger + Grafana observability stack, external
PostgreSQL — and our own telemetry as the evidence source, not AWS
CloudWatch/RDS/Datadog. See `synthetic-rca-eval-design-considerations.md` for
the *why* behind every choice below.

## 1. Folder Layout

```
tests/synthetic/
├── schemas.py                  # TypedDicts + validators for every fixture file
├── score_artifacts.py          # cross-scenario report writer
└── <suite_name>/                # one suite per subsystem under test
    ├── AGENTS.md                 # baseline contract + module layout notes for this suite
    ├── scenario_loader.py        # loads scenario.yml/answer.yml/evidence json → typed dataclasses
    ├── evidence_sources.py       # semantic evidence predicates (Phase 1)
    ├── trajectory_policy.py      # pure trajectory policy evaluator (Phase 2)
    ├── scoring.py                # pure score_result() + gates (Phase 3)
    ├── observations.py           # trajectory metrics + report/artifact builder
    ├── reporting.py              # Axis 1 vs Axis 2 gap report
    ├── run_suite.py              # thin CLI orchestrator — only module allowed to call the real agent
    ├── mock_<backend>_backend/   # fixture-serving mock of each telemetry client the agent calls
    ├── _baseline/                 # committed canonical scoring output per scenario (empty-state)
    ├── test_suite.py              # pytest: Axis 1, all scenarios
    ├── test_suite_axis2.py        # pytest: Axis 2 adversarial scenarios (marker: axis2)
    └── <NNN-scenario-name>/
        ├── scenario.yml            # metadata: component, failure_mode, difficulty, adversarial_signals
        ├── alert.json               # synthetic alert payload that kicks off the investigation
        ├── answer.yml                # graded answer key (schema below)
        └── <evidence>.json           # one file per evidence source declared in scenario.yml
```

Start with **one** suite — pick the subsystem with the most incident history
or highest business risk (likely the K8s workload layer or the Postgres
tenant layer) — and prove the pattern end-to-end before replicating it.

## 2. Evidence Sources — Map to Our Stack, Not AWS

| Reference-repo AWS ID | Our equivalent | Populated from |
|---|---|---|
| `aws_cloudwatch_metrics` | `prometheus_metrics` | Prometheus query API / OTel metrics |
| `aws_rds_events` | `k8s_events` / `postgres_events` | K8s Events API; Postgres logs |
| `aws_performance_insights` | `postgres_pg_stat_activity` | `pg_stat_statements` / `pg_stat_activity` snapshot |
| `ec2_instances_by_tag` | `k8s_pod_topology` | K8s API — pods/deployments by label |
| `elb_target_health` | `istio_endpoint_health` | Istio/Envoy admin or K8s readiness probes |
| `k8s_*` (already generic) | keep as-is | K8s API, kube-state-metrics |
| — (new) | `loki_logs` | Loki query API |
| — (new) | `jaeger_traces` | Jaeger query API |

Define these as a `frozenset` controlled vocabulary in `schemas.py`
(`VALID_EVIDENCE_SOURCES`) — fixture authors can't introduce typo'd or
undocumented sources.

**Evidence predicate rule (keep this from the reference implementation):** a
source counts as "consulted" only if the agent's own evidence state
populated that specific semantic key with real content — never inferred from
the mere presence of a generic/shared transport key. Where two evidence
types can arrive over one channel (e.g. a Prometheus range-query result vs.
an OTel span-derived latency breakdown, both potentially landing in one
`metrics` bucket), write a predicate that inspects payload *shape* to tell
them apart, not just whether the bucket is non-empty.

## 3. Fixture Schema (per scenario)

`scenario.yml`:
```yaml
schema_version: "1.0"
scenario_id: "001-pod-oom-crashloop"
component: "k8s-workload"          # our controlled vocabulary
failure_mode: "oom_killed"
severity: "critical"
available_evidence: [prometheus_metrics, k8s_events, loki_logs]
scenario_difficulty: 1              # 1-4, see design-considerations doc
adversarial_signals: []             # confounding signals present, if any
depends_on: null                    # optional CI dependency/skip flag
```

`answer.yml`:
```yaml
root_cause_category: oom_killed
equivalent_root_cause_categories: []
required_keywords: [OOMKilled, memory limit, container restart]
forbidden_keywords: []
forbidden_categories: []
required_evidence_sources: [prometheus_metrics, k8s_events]
optimal_trajectory: [query_prometheus_metrics, query_k8s_events, describe_pod]
max_investigation_loops: 3
ruling_out_keywords: []             # Axis 2 only
required_queries: []                # Axis 2 only
model_response: |
  ROOT_CAUSE: ...
  ROOT_CAUSE_CATEGORY: oom_killed
  VALIDATED_CLAIMS: ...
```

Every field maps 1:1 to what `scoring.py`'s gates check — don't add fields
the scorer doesn't consume, and don't let the scorer check anything not
declared in this schema.

## 4. Scoring Gates to Implement (build in this order)

1. `category_match` — predicted category ∈ `{root_cause_category}` ∪ `equivalent_root_cause_categories`
2. `required_keyword_match` — semantic match: exact phrase → alias table → token-subset fallback (build the alias table from real recurring rewordings observed in early runs, don't pre-guess it)
3. `forbidden_category_clear` / `forbidden_keyword_clear`
4. `required_evidence_sources` — via the predicates from section 2
5. `trajectory_budget` / `trajectory_policy` — sequencing, loop calibration, extra-action budget
6. Suite-specific gates as needed (the reference repo's "must narrate a specific event sequence in order" gate is a good template for compositional/timeline scenarios)

A scenario passes iff every configured gate passes — report each gate's
pass/fail individually for debuggability, never collapse to one boolean.

## 5. Two-Axis Test Structure

- **Axis 1** (`test_suite.py`, all scenarios): mock backend returns full
  fixture data regardless of query — tests whether the agent reaches the
  right answer efficiently when nothing is hidden.
- **Axis 2** (`test_suite_axis2.py`, marker `axis2`): mock backend is
  *selective* — only returns data matching what the agent explicitly
  queried, and logs every query for audit. Tests whether the agent asks for
  the right things and rules out alternatives in its output.
- Report the Axis 1 → Axis 2 pass-rate gap per difficulty level on every
  run — this is the headline adversarial-robustness number.

## 6. Mock Backend Pattern

One mock backend class per telemetry client the real agent calls
(`mock_prometheus_backend`, `mock_loki_backend`, `mock_jaeger_backend`,
`mock_k8s_backend`), each with two variants:

- **Fixture backend** — returns the full scenario fixture regardless of query (Axis 1)
- **Selective backend** — filters by the query the agent actually issued, records an audit log (Axis 2)

These substitute for the real client at the exact seam used in production —
the agent pipeline code must not be able to tell it's talking to a mock.

## 7. Determinism / Baseline Contract

Commit a `_baseline/<scenario_id>.json` per scenario: the scoring output
produced by running `score_result()` against an **empty agent state** (no LLM
call). Any PR that changes the scoring/report schema must regenerate and
include updated baselines in the same PR. This is a cheap, fast (no LLM
calls) regression check that catches silent schema drift before it reaches a
real run.

## 8. CI Tiering

- **Every commit:** Axis 1, difficulty 1–2 scenarios (cheap, fast, high signal)
- **Nightly:** Axis 1 difficulty 3–4 (indirect inference) + all Axis 2 (adversarial, more LLM calls/cost)
- Report the Axis 1/Axis 2 gap and per-difficulty-level pass rate as the
  nightly summary, not just an aggregate pass count

## 9. Bring-Your-Own-Telemetry

Scenario evidence files are serialized snapshots of our own telemetry APIs'
real response shapes (Prometheus range-query JSON, Loki query JSON, Jaeger
trace JSON, K8s API objects) — captured from real incidents where possible,
hand-authored for the red-herring/adversarial ones. Keep evidence fixtures
schema-validated (`schemas.py`) so hand-authored and captured-from-production
fixtures stay structurally interchangeable.

## 10. Build Order

1. `schemas.py` — controlled vocabularies + validators (nothing else is safe to build without this)
2. One suite's `scenario_loader.py` + 2–3 hand-written scenarios (`000-healthy`, one single-signal failure)
3. `evidence_sources.py` predicates for those scenarios' evidence types
4. `scoring.py` — gates 1–4 from section 4
5. `trajectory_policy.py` + trajectory gates
6. `run_suite.py` wired to the real agent pipeline via the mock fixture backend (Axis 1 only)
7. `_baseline/` generation + baseline-check CI job
8. Selective backends + Axis 2 scenarios, once Axis 1 is stable and green
9. Expand scenario count using the MECE fingerprint rule (design-considerations doc, principle 8) — add difficulty 2 (one confounder) before jumping to 3/4
10. Wire CI tiering once the suite is large enough that "every commit" would be too slow to run in full

Check every stage against
`synthetic-rca-eval-design-considerations.md` before expanding scope — same
governance pattern as `design-considerations.md` / `intent-and-build-guide.md`.

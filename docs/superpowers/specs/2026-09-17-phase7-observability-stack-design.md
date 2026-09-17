# Phase 7 — Observability Stack Design

**Status:** approved-pending-user-review
**Closes:** GitHub #40, #37, #38, #39 (TODO.md Phase 7 — bundled as one phase, per
root CLAUDE.md §11's "one roadmap task at a time" applied to the whole phase,
not sub-issue by sub-issue, since #37/#38's own Done-when needs a live trace
backend and #39 explicitly depends on #40).

## 0. Why this is one plan, not four

- **#40** (deploy the stack) is the foundation everything else needs to be
  *verifiable* against.
- **#37** (manual spans on delivery/payment-service) and **#38** (`tenant.id`
  on all 4 customer-app services) are, in the actual code, the same change:
  order-service and catalog-service already set `tenant.id` on every manual
  span they create (confirmed live in `orders.go`/`router.py`); delivery- and
  payment-service (Java) have **zero** manual spans today — grep for
  `Tracer`/`@WithSpan`/`tenant.id` under their `src/main` trees returns
  nothing. Adding the missing manual spans to those two services closes both
  issues in the same commit.
- **#39** (wire customer-app into the stack) is **mostly already done** —
  every service in both apps already points `OTEL_EXPORTER_OTLP_ENDPOINT` at
  `otel-collector.itsm-dev:4317` (confirmed in both Helm values files). That
  endpoint currently resolves to nothing. The moment #40 stands up a Service
  named `otel-collector` in `itsm-dev` on port 4317, telemetry from every
  already-running pod starts flowing with **zero further app changes** —
  #39 becomes a verification task, not new code.

## 1. Scope

In scope: deploy OTel Collector, Prometheus, Loki, Jaeger, Grafana into
`itsm-dev`; add manual spans + `tenant.id` to delivery-service and
payment-service; confirm both apps' telemetry reaches all three signal
backends, tagged by tenant; make all UIs reachable through the existing
Istio Gateway.

**Explicitly out of scope** (flagging rather than silently adding):
- Custom Grafana dashboards. #40's Done-when is "dashboards/UIs are
  reachable" — read as the tools' own UIs being reachable, not pre-authored
  dashboard JSON. Datasources are provisioned so a dashboard is a few clicks
  away, but none are built here.
- Persistent storage for Prometheus/Loki/Jaeger (see §3 — ephemeral, per the
  user's explicit choice).
- Auth in front of the observability UIs. They go behind the existing
  IngressGateway the same way both apps' own frontends do — reachable to
  anyone who can reach the cluster's NodePort, no additional login. This
  matches the existing trust model (nothing else behind that gateway
  requires a VPN either) and is a deliberate demo-scope simplification, not
  a production practice.
- Routing application **logs** through the OTel Collector. Neither app's
  code sends log records via an OTel SDK log exporter today (only traces +
  metrics — confirmed against root CLAUDE.md §5's documented conventions and
  the actual span/metric code read while investigating #37/#38). Getting
  logs into Loki uses a Promtail DaemonSet tailing container stdout instead
  — standard, and needs zero application code changes.
- Alertmanager, node-exporter, or anything from the full
  `kube-prometheus-stack` bundle. Just the Prometheus server.
- Istio/Envoy metrics scraping. Prometheus scrapes exactly one target for
  v1: the OTel Collector's own Prometheus exporter endpoint. More scrape
  targets are a cheap follow-up, not required to close these 4 issues.

## 2. Capacity (measured live, 2026-09-17 — INFRA-INVENTORY.md's 2026-09-01
snapshot predates customer-app going live, so this re-measurement matters)

`kubectl top nodes` (metrics-server is now deployed, wasn't at the last
snapshot):

| Node | CPU used | CPU % | Mem used | Mem % |
|---|---|---|---|---|
| k8s-worker-2 | 336m | 8% | 1385Mi | 36% |
| kubernetes-master | 718m | 17% | 2403Mi | 62% |
| kubernetes-worker | 117m | 2% | 1312Mi | 34% |

`kubectl describe nodes`' allocated-resources (requests/limits already
committed, same node order):

| Node | CPU req | CPU lim | Mem req | Mem lim |
|---|---|---|---|---|
| k8s-worker-2 | 1150m (28%) | 2800m (70%) | 1222Mi (32%) | 3242Mi (84%) |
| kubernetes-master | 1400m (35%) | 1800m (45%) | 996Mi (26%) | 2432Mi (63%) |
| kubernetes-worker | 800m (20%) | 1400m (35%) | 846Mi (22%) | 1706Mi (44%) |

`free -mh` on kubernetes-master directly: 3.8Gi total, 2.8Gi used, **1.1Gi
available**.

**This stack's request/limit footprint**, per root CLAUDE.md §4's existing
table (unchanged, that table was already sized for exactly this):

| Component | CPU req | CPU lim | Mem req | Mem lim |
|---|---|---|---|---|
| OTel Collector | 100m | 300m | 128Mi | 256Mi |
| Prometheus | 150m | 400m | 256Mi | 512Mi |
| Loki | 100m | 300m | 128Mi | 256Mi |
| Jaeger (all-in-one) | 100m | 300m | 128Mi | 256Mi |
| Grafana | 100m | 300m | 128Mi | 256Mi |
| Promtail (DaemonSet ×3 nodes, ~30m/64Mi each) | 90m | 150m | 192Mi | 320Mi |
| **Total** | **~640m** | **~1.75 vCPU** | **~960Mi** | **~1.85 GiB** |

**Verdict:** CPU is nowhere close to binding (every node under 35% even at
committed limits). Memory requests (~960Mi total, spread across pods the
scheduler will bin-pack onto whichever node has room) fit easily against the
~1.1–2Gi available per node measured above. The limit ceiling is tighter on
kubernetes-master specifically (only 1.1Gi available there right now) — the
default scheduler already favors less-loaded nodes, but if anything lands
awkwardly during rollout, the fix is a `kubectl cordon` nudge, not a redesign.
Proceeding with root CLAUDE.md §4's existing sizing table as-is.

## 3. Components

All five (plus Promtail) deploy into **`itsm-dev`** — zero config changes to
either app, since both already point `OTEL_EXPORTER_OTLP_ENDPOINT` at
`otel-collector.itsm-dev:4317`. All storage is **ephemeral** (`emptyDir` or
each chart's in-memory mode) — this is a demo/observation cluster, not a
system with a retention SLA, and avoids adding PVCs on an already
memory-constrained cluster (the redis STS precedent showed PVCs are annoying
to resize/migrate later).

### OTel Collector
Official `open-telemetry/opentelemetry-collector` Helm chart, `mode:
deployment`, single replica. Pipeline:
- `receivers: [otlp]` (grpc :4317, http :4318) — every app service already
  targets this.
- `processors: [batch]`.
- `exporters:`
  - `prometheus` (metrics) — exposes a `/metrics` endpoint Prometheus scrapes.
  - `otlp` → Jaeger's own OTLP receiver (modern Jaeger ingests OTLP
    natively; no separate `jaeger` exporter type needed).
- Service name **must be exactly `otel-collector`** in `itsm-dev` — that's
  the DNS name both apps already resolve.

### Prometheus
Official `prometheus-community/prometheus` chart (the lean server chart, not
`kube-prometheus-stack` — no Alertmanager/node-exporter/Operator needed here).
Single scrape target for v1: the OTel Collector's Prometheus exporter. Short
retention (e.g. `--storage.tsdb.retention.time=6h`) since storage is
ephemeral — no point retaining data past a pod restart anyway.

### Loki
Official `grafana/loki` chart, `SingleBinary`/monolithic mode, filesystem
storage (backed by `emptyDir`, per the ephemeral decision). Fed by:

### Promtail (new — not one of the 5 named in #40, but required to get any
logs into Loki without touching application code)
Official `grafana/promtail` chart, DaemonSet, scoped to tail pod logs only
in `itsm-dev` and `customer-app-dev` (not cluster-wide — keeps volume down
given the short retention anyway). Flagging this addition explicitly since
it's not literally one of the five components #40 names, but #40 is
meaningless for logs without it.

### Jaeger
Hand-written Deployment + Service (not the official `jaegertracing/jaeger`
chart — that chart's complexity is aimed at Cassandra/Elasticsearch-backed
production deployments; wildly oversized for a single all-in-one demo
instance). Image: `jaegertracing/all-in-one`, in-memory storage
(`SPAN_STORAGE_TYPE=memory`), OTLP receiver enabled. This is Jaeger's own
documented quick-start pattern, not a shortcut invented here.

### Grafana
Official `grafana/grafana` chart. Datasources provisioned via the chart's
`datasources` values block (Prometheus, Loki, and Jaeger — Grafana's Jaeger
datasource plugin is built in): zero manual click-through setup needed after
deploy. No dashboards authored (see §1's non-goals).

## 4. Exposure

A `VirtualService` per UI (`grafana.dev.local`, `jaeger.dev.local`,
`prometheus.dev.local`), routed through the existing `itsm-dev/itsm-gateway`
— the same IngressGateway both apps' own traffic already goes through, on
the same NodePort 30080. No new Gateway, no new external entry point. No
auth in front of them (see §1's non-goals).

## 5. Instrumentation — delivery-service & payment-service (closes #37, #38)

Both are Spring Boot + the OTel Java agent (auto-instrumentation only
today). Add manual spans following the exact convention order-service/
catalog-service already use — `customer.<service>.<operation>`, with
`tenant.id` set from the already-available `X-Tenant-ID` header (both
services already read it for `search_path` resolution; this is reading the
same value into a span attribute, not plumbing anything new):

- **delivery-service**: `customer.delivery.list`, `customer.delivery.get`,
  `customer.delivery.create`, `customer.delivery.update_status` (match
  whatever its actual handler set turns out to be once the plan reads the
  real file — this list is provisional).
- **payment-service**: `customer.payment.list`, `customer.payment.get`,
  `customer.payment.create` (same caveat).

Use the OTel Java SDK's manual `Tracer` (`@WithSpan` annotation where a
whole method maps 1:1 to an operation is fine; explicit `tracer.spanBuilder`
where a span needs to wrap only part of a handler, matching how
`orders.go`/`router.py` scope their spans to the request-handling logic, not
the whole HTTP method).

**Done when** (matching #37/#38's own literal text): a live order flow
through delivery-service and payment-service produces spans visible in
Jaeger, and every span from all 4 customer-app services carries `tenant.id`.

## 6. Verification (closes #39)

1. Deploy the stack (§3), confirm all 5 (+Promtail) pods `Running`/`Ready`
   within the budget in §2.
2. Confirm each UI is reachable through its VirtualService.
3. Confirm Grafana's Prometheus/Loki/Jaeger datasources connect (Grafana's
   own datasource test, or a trivial query against each).
4. Drive one real request through customer-app (e.g. the existing
   `tenant-isolation-smoke-test.sh`, or a manual order-creation call) and
   confirm: a trace appears in Jaeger tagged with the right `tenant.id`; the
   corresponding custom metric appears in Prometheus; the service's log
   lines appear in Loki.
5. Do the same for a platform-app request, confirming both apps' telemetry
   lands in the same backend, distinguishable by `tenant.id` (customer-app)
   vs. its absence (platform-app staff — consistent with root CLAUDE.md §3's
   identity model, where an absent tenant claim is a valid state, not an
   error).

## 7. Rollback

Each component is its own Helm release (or plain manifest, for Jaeger) —
`helm uninstall <name> -n itsm-dev` / `kubectl delete -f
<jaeger-manifest>.yaml` removes it independently. Removing the stack doesn't
touch either app: their `OTEL_EXPORTER_OTLP_ENDPOINT` config stays pointed
at a Service that no longer exists, and OTel SDKs already handle an
unreachable collector by dropping/buffering-and-dropping telemetry, not
crashing (this is already true today, before this stack exists, and both
apps have been running fine).

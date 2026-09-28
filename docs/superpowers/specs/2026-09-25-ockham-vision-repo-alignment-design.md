# Ockham Vision & Repo Alignment

**Status:** Draft — under review. This is the master alignment doc for how
the whole repo's purpose, structure, and development process map to the
Ockham company vision. It supersedes the old "ITSM CloudNative Demo App"
framing at the vision level; it does **not** replace or restate root
`CLAUDE.md`'s technical rules, which stay in force until explicitly revised
to match this doc.

**Not the engineering roadmap.** Delivery status lives in the GitHub
Project (root `CLAUDE.md` §11), same as `product-os/README.md` already
states. This doc is the "why this structure, in this order" — the
roadmap itself is tracked elsewhere.

---

## 1. Identity

**Ockham** — a unified observability and security operations platform.
Marketed "AI-powered"; actually built AI-native (agentic, not a bolted-on
chatbot). Named for Occam's Razor: root cause analysis *is* finding the
simplest explanation the evidence supports and discarding the rest.

Full context: `product-os/context-hub/company-brief.md` (and its sibling
docs — `positioning.md`, `icp.md`, `ebpf-signal-thesis.md`,
`competitive-landscape.md`, `agentic-use-cases.md`).

**Rebrand scope (decided):** UI copy, marketing/doc language →
"Ockham." Folder names (`platform-app/`, `customer-app/`, `ai-engine/`,
`product-os/`) and internal service names (`user-service`,
`incident-service`, etc.) **stay as they are** — they're infrastructure
labels, not customer-facing brand. No folder/service renames as part of
this alignment.

---

## 2. Repo structure — confirmed mapping

| Folder | Role under Ockham |
|---|---|
| **`platform-app/`** | Ockham itself — the product being sold. UI, design, code, infra, and hosting for the observability + security platform. |
| **`ai-engine/`** | The one shared agentic AI + RAG layer. Serves both `platform-app` (observing customer telemetry) and `customer-app` (future AI-native features on the customer side). Not duplicated per-app. |
| **`customer-app/`** | The illustrative multi-tenant "customer" whose real, tenant-tagged telemetry (via the existing OTel pipeline) is what `platform-app` observes and investigates. Backend is functionally complete (Phases 1-10 done, this session). A frontend/UI phase is still planned (sequencing: open, see §5). |
| **`product-os/`** | The mandatory front door for **all** feature work in this repo — AI or not, either app. Idea validation through a reviewed PRD. See §4 for exactly how far it reaches today and what happens after. |

**Existing platform-app services** (`incident-service`, `asset-service`,
`user-service`, `notification-service`): **evolve in place**, not rebuilt.
Root `CLAUDE.md` already documents the direction this was heading —
`incident-service` becoming "incidents an AI agent investigated" rather
than manually-filed tickets, `asset-service` becoming a topology-graph
source. This alignment confirms that direction continues; it does not
restart it.

---

## 3. Roadmap sequencing

1. **Near-term (now):** Observability + agentic AI only. Security work
   (CDR, VM, CSPM, eBPF-driven prioritization, agentic security use
   cases) is explicitly **not** started yet, even though
   `company-brief.md` names it as the near-term security focus once
   underway — sequencing is observability-and-agentic-AI-first, security
   second.
2. **Pivot trigger — the "working model" milestone:** Security work
   starts once `platform-app`'s AI layer can investigate a real
   incident/anomaly end-to-end from `customer-app`'s live OTel data —
   hypothesis, evidence, explanation — visible in some UI, even a
   minimal one. Polish is not the bar; a real, working, evidence-based
   RCA loop is.
3. **Mid-term (post-pivot):** CDR → VM → CSPM → eBPF-based runtime
   signal → agentic security use cases, in that order (per
   `company-brief.md`'s own stated sequencing).
4. **Far-future:** AI observability & security for the AI stack itself
   (per `company-brief.md`) — not planned in any detail yet.

---

## 4. Process going forward

**product-os is the mandatory front door for every feature**, in either
app, AI-related or not. Concretely, given what's actually built today:

- **Built and used as-is:** `ai-discovery/` (idea → Pursue/Park/Kill →
  Discovery Brief) → `ai-prd/` (12-stage PRD Agent → PRD Reviewer Agent →
  Ready / Ready-with-Caveats / Not-Ready scorecard). This is real
  business/product validation that this whole session's work skipped —
  going forward, it runs first, for every feature.
- **The gap, and how we bridge it:** `ai-prd/README.md`'s own documented
  downstream is `ai-design/` (status: **"Scaffold only"** — a list of
  expected future artifacts, none built) and then "engineering."
  `product-os/lifecycle/` (which would hold real Design and Planning
  phase agents) is explicitly marked "planned," not built. So today,
  nothing in product-os itself turns a validated PRD into an HLD/LLD,
  task breakdown, or code.
  **Decision:** the validated PRD becomes the input to the existing
  `superpowers` brainstorming (serving as the technical-design step) →
  `writing-plans` → `executing-plans` flow, which still does the
  technical design, planning, and build. `ai-design/` and
  `product-os/lifecycle/` get built out **later, organically** — not as
  an upfront blocking project before any real feature work can start.
- **Net effect on this session's own working pattern:** every future
  "let's build X" starts with a Discovery Brief + PRD in `product-os/`,
  not straight into `superpowers:brainstorming`. `brainstorming` still
  runs, but now consuming a reviewed PRD as its input instead of an
  ad hoc chat description.

---

## 5. Build sequencing — decided

**customer-app's frontend/UI phase goes first**, ahead of platform-app's
agentic RCA capability. Decided 2026-09-25, on review of this doc. Gives a
complete, demoable multi-tenant app before layering the AI story on top.
Agentic RCA (and the §3 pivot-trigger milestone) follows once the
frontend phase is done.

---

## 6. Explicitly deferred (not starting yet)

- **Repo staleness/prune audit.** Originally requested alongside this
  doc, but doing it well requires the target architecture to be settled
  first (this doc). Follow-up pass, once §5 is resolved and this doc is
  agreed — will check `product-os/ai-product-strategy/`,
  `product-os/ai-design/`, `product-os/data-analysis/` (all partial
  scaffolds) and any other now-stale content against the confirmed
  vision, not before.
- **`ai-design/` and `product-os/lifecycle/` build-out** — per §4,
  deferred, built organically as real features need them rather than
  as upfront infrastructure work.
- **`ai-engine`'s existing 3-track governance** (SRE / ITSM / Security,
  per its own `CLAUDE.md`) — the "ITSM" track name may need reframing
  under the non-ITSM Ockham vision. Flagged, not resolved here; revisit
  when `ai-engine/CLAUDE.md` itself is next touched.
- **Folder/service renames** — explicitly out of scope per §1's
  rebrand-scope decision.

## 7. Explicit non-goals for now

- No CDR/VM/CSPM/eBPF work until the §3 pivot trigger is met.
- No literal folder/service renaming.
- No product-os `lifecycle/` build-out as a prerequisite to feature work.

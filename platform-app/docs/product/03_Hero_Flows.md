# Hero Flows

Synap is built around three end-to-end "wow" flows. These are the product's most important demonstrations of value. Every sprint must keep them working.

---

## Overview

```mermaid
graph LR
    HF1["Hero Flow 1<br/>Zero-Ticket Self-Service<br/>portal.jsx"]
    HF2["Hero Flow 2<br/>AI-Assisted Agent Resolution<br/>incidents.jsx"]
    HF3["Hero Flow 3<br/>AIOps Nervous-System Loop<br/>aiops.jsx → incidents.jsx"]

    HF3 -->|creates incident| HF2
    HF2 -->|auto-drafts KB| KB[Knowledge Base]
    HF1 -->|deflects ticket| ZERO[Zero tickets created]
```

---

## Hero Flow 1 — Zero-Ticket Self-Service

**Persona:** End User (employee, not IT staff)  
**Frontend:** `reference/portal.jsx` → Sprint 7  
**Backend:** ai-service (Phase 7)  
**Value proposition:** Deflect L1 support tickets entirely. Employee resolves own issue in ~40 seconds.

### Flow

```mermaid
sequenceDiagram
    participant E as Employee (End User)
    participant P as Synap Portal
    participant AI as ai-service
    participant D as Device Agent

    E->>P: Describe issue: "My Wi-Fi keeps dropping"
    P->>AI: POST /api/v1/ai/diagnose { description, device_id }
    AI->>D: Run device diagnostics (network adapters, DNS, drivers)
    D-->>AI: Diagnostic report
    AI-->>P: Diagnosis + proposed fix<br/>"Network adapter driver outdated.<br/>Suggested: update driver v21.3 → v22.1"
    P->>E: Show diagnosis + "Apply fix automatically" button

    E->>P: Clicks "Apply fix automatically"
    P->>AI: POST /api/v1/ai/remediate { fix_id }
    AI->>D: Apply driver update
    D-->>AI: Remediation result: success
    AI-->>P: "Fixed! Wi-Fi connectivity restored."
    P->>E: ✓ Resolved in 40 seconds. No ticket created.
```

### Success Criteria
- Issue resolved without an IT agent
- No incident ticket created in the system
- Resolution time < 60 seconds (demo target: ~40 seconds)
- Employee satisfaction: one-click experience

### Integration Seams (Sprint 7 → Sprint 11)
```typescript
// Sprint 7: faked latency
const result = await new Promise(resolve =>
  setTimeout(() => resolve(MOCK_DIAGNOSIS), 1800)
);
// TODO: real API — POST /api/v1/ai/diagnose
```

---

## Hero Flow 2 — AI-Assisted Agent Resolution

**Persona:** IT Agent / SRE  
**Frontend:** `reference/incidents.jsx` → Sprint 4  
**Backend:** incident-service (Phase 4) + ai-service (Phase 7)  
**Value proposition:** Reduce MTTR from hours to minutes. AI generates a runbook and agent approves + executes it inline.

### Flow

```mermaid
sequenceDiagram
    participant A as IT Agent
    participant I as Incident Detail Screen
    participant IS as incident-service
    participant AI as ai-service
    participant AS as asset-service

    A->>I: Open incident INC-0042<br/>"Production DB — 500ms latency spike"

    I->>IS: GET /api/v1/incidents/i1000042
    IS-->>I: Incident data + event trail

    I->>AS: GET /api/v1/assets/{related_asset_id}
    AS-->>I: Asset: db-prod-01, CPU 94%, Disk 87%

    I->>AI: POST /api/v1/ai/triage { incident_id }
    AI-->>I: Priority: P1 (Critical)<br/>Root cause: disk I/O saturation<br/>Confidence: 0.91

    I->>AI: POST /api/v1/ai/runbook { incident_id }
    AI-->>I: Resolution runbook:<br/>1. Kill long-running queries<br/>2. Clear temp tables<br/>3. Restart connection pool<br/>4. Monitor for 5 min

    A->>I: Reviews runbook + live telemetry chart
    A->>I: Clicks "Approve & Run"

    I->>IS: PUT /api/v1/incidents/i1000042 { status: "in_progress" }
    I->>AI: POST /api/v1/ai/execute { runbook_id }

    loop Each runbook step
        AI-->>I: Step N ✓ complete
    end

    AI-->>I: All steps complete — latency restored to 12ms
    A->>I: Marks incident resolved
    IS-->>I: Incident closed; incident_events appended

    I->>AI: POST /api/v1/ai/kb-draft { incident_id }
    AI-->>I: Draft KB article ready for review
```

### Key UI Moments
1. **AI triage badge** — P1 suggested priority shown inline on incident card
2. **Live telemetry charts** — CPU, disk, response time for the related asset (sourced from Prometheus via OTel)
3. **AI timeline** — chronological AI analysis events alongside human actions
4. **Numbered runbook stepper** — each step shows: queued → running (typing dots) → ✓ done
5. **Similar incidents panel** — top 3 semantically similar past incidents with resolution time

### Success Criteria
- MTTR target: < 15 minutes from incident open to resolved
- Runbook accuracy: AI-suggested steps result in resolution ≥ 80% of the time
- KB article auto-drafted for every resolved P1/P2 incident

---

## Hero Flow 3 — AIOps Nervous-System Loop

**Persona:** NOC Operator / SRE  
**Frontend:** `reference/aiops.jsx` → Sprint 6  
**Backend:** incident-service + ai-service (Phase 7)  
**Value proposition:** Turn a 47-alert storm into 1 actionable incident with root cause. 96% noise reduction.

### Flow

```mermaid
sequenceDiagram
    participant N as NOC Operator
    participant AE as AIOps Event Console
    participant AI as ai-service
    participant IS as incident-service

    Note over AE: 47 alerts fire in 3 minutes
    AE->>N: Shows alert table: 47 rows, multiple severities
    N->>AE: Clicks "Correlate with Synap"

    AE->>AI: POST /api/v1/ai/correlate { alert_ids: [...47 ids] }

    Note over AE: Correlation animation:<br/>47 dots converge to 1 center node

    AI-->>AE: Correlation result:<br/>Root cause: network switch SW-CORE-01 degraded<br/>Affected services: 12<br/>All 47 alerts explained by 1 root cause

    AE->>IS: POST /api/v1/incidents { title: "SW-CORE-01 degraded", priority: "P1", ... }
    IS-->>AE: Incident i1000099 created

    AE->>N: "47 alerts → 1 P1 incident (96% noise reduction)"
    N->>AE: "Open incident" → redirects to incident detail (Hero Flow 2)
```

### Key UI Moments
1. **Alert storm table** — 47 rows with severity, service, source, time
2. **Correlation button** — "Correlate with Synap" with AI gradient styling
3. **Correlation animation** — scattered dots converge to center (0.9s cubic-bezier, 18ms stagger)
4. **Impact panel** — "12 services affected" topology mini-map
5. **Noise reduction badge** — "96% reduction" shown prominently
6. **Auto-created incident card** — slides in after correlation completes

### Success Criteria
- Correlation completes in < 3 seconds
- All related alerts are linked to the single created incident
- Root cause identified with ≥ 85% accuracy
- Operator takes ≤ 2 clicks to go from alert storm to incident detail

---

## Hero Flow Status by Sprint

| Hero Flow | Key Screens | Build Sprints | Backend Phases | Status |
|---|---|---|---|---|
| HF1 — Zero-Ticket Self-Service | Portal | Sprint 7 | Phase 7 | 🔲 Pending |
| HF2 — AI-Assisted Resolution | Incident Detail | Sprint 4 + Phase 7 | Phase 4 + 7 | 🔲 Partial (backend only) |
| HF3 — AIOps Correlation | AIOps Console | Sprint 6 | Phase 7 | 🔲 Pending |

> Hero Flow 2 has partial backend support (incident CRUD + events from Phase 4). The AI triage, runbook, and execution components require Phase 7.

---

## Integration with SDLC

Each hero flow follows the full SDLC gate before being marked complete:

```
Design prototype (reference/*.jsx)
  → UI development (Vite + React sprint)
    → Backend development + integration
      → Infra deployment (K8s + Istio)
        → E2E testing (all steps above work together)
          → Mark sprint + phase complete
            → Move to next hero flow
```

No hero flow is considered done until it has been tested end-to-end in the live K8s cluster with real JWT, real API calls, and real tenant data.

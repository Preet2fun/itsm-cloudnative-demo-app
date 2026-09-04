# Stage 03 — Knowledge Gathering

**Purpose:** know what already exists before designing anything new — so the PRD
reuses what it can and names what it will disturb.

**Inputs:** `02-requirements.md`; `knowledge-hub/` (shipped features + their
dependencies); linked specs; prior PRDs / experiments.
*If from a Discovery Brief: its candidate-solutions table already carries a
feasibility read and its "what we know" table names some adjacent systems —
extend those, don't restart.*

**Do:**
1. **What already ships** near this problem — features, surfaces, data models,
   runtimes. What's reusable.
2. **Adjacent systems** this feature would read from, write to, or sit beside.
   For each: the dependency direction, and **what breaks if this changes**.
3. **Blast radius** — the second-order effects: load, cost, on-call surface,
   incentives, permissions/RBAC, tenant isolation.
4. **Prior attempts** — has this been tried? What happened? What was learned.
5. **Open technical unknowns** — things engineering will need to answer.

**Produce — `03-knowledge-gathering.md`:** Existing capability map · Adjacent-
systems table (system · direction · breaks-if) · Blast radius · Prior attempts ·
Technical unknowns.

**Gate:** the adjacent-systems table is complete enough that the reviewer's
dimension 5 can be checked against it. Unknowns flow to §15 Open Questions.

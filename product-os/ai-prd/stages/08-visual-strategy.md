# Stage 08 — Visual Strategy

**Purpose:** define the surfaces, screens, and states — enough for design and
engineering to see the same picture.

**Inputs:** `02` (chosen framing), `03` (where it lives), `06` (what's shown);
`ai-design/` principles; root `CLAUDE.md` §10 (UI is drafted in Claude Design
first).

**Do:**
1. **Surfaces** — where the feature lives (module, nav entry, embedded vs
   standalone), and what it does not replace.
2. **Screen list** — each screen, its primary job, its key widgets.
3. **States for every screen** — default, loading, **empty / zero-data**,
   **first-run**, **error**, **unauthorized**. For AI features: the state when
   the model / telemetry is unavailable = show empty / error, **never invent
   metrics**.
4. **Information architecture** — nav order, drill paths, what's advisory vs
   actionable.
5. **Claude Design draft** — start the artboards; link them; note what's still
   open for design.
6. **Acceptance-criteria states** — for each stage-02 user story, list the
   concrete negative / edge / cross-system cases its screens must handle (drawn
   from the state matrix). These become §7's acceptance criteria at assembly.

**Produce — `08-visual-strategy.md`:** Surfaces · Screen list · State matrix ·
IA · link to the Claude Design draft · acceptance-criteria states per user story.

**Gate:** every screen has its non-happy states defined. Prototype path noted for
stage 09.

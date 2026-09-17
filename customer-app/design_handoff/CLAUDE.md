# CLAUDE.md — Hearth frontend (customer-app)

## What this is
Hearth is customer-app's B2B back-office console for restaurant groups —
owners/managers manage menus, watch orders and deliveries, and reconcile
payments across two or more locations under one account. Not a diner-facing
ordering app. Sibling product to platform-app's Synap: same design system,
same multi-tenant backend conventions, different audience and domain.

## Design source of truth
The folder `design_handoff/` contains the design handoff:
- `HANDOFF.md` — archive contents and where to start.
- `design_handoff_hearth/README.md` — product overview, screen inventory,
  design tokens, interactions, state shape, auth contract, mock-data
  contract.
- `design_handoff_hearth/BUILD_PLAN.md` — the iteration-by-iteration build
  order with a concrete prompt per iteration. Iterations 1-4 are built;
  5-8 are specced.
- `design_handoff_hearth/reference/*.jsx` + `styles.css` — the working,
  framework-agnostic HTML/React-via-Babel prototype. This is the **pixel +
  interaction spec**. Match it exactly; implement in the real stack.
- `Hearth.dc.html` + `_ds/design-system-f13b1973-4aad-41f0-b2b7-d87df36276fc/`
  — the design-review prototype; mounts the real bound "Aurora" design-system
  components. Needs `_ds/` alongside it to render.
- `github.md` — sync history / screen-to-repo-doc map from the Claude
  Design session that produced this bundle.

**Always read `design_handoff/design_handoff_hearth/README.md` before
building customer-app UI.** When a design changes, the corresponding
`reference/*.jsx` file is updated — treat it as the new spec.

## Decision on record (2026-09-17)
The original brief asked for a distinct "warm editorial hospitality"
direction (cream surfaces, terracotta accent, serif display) so Hearth
would read as visually separate from Synap. Claude Design applied the
pre-existing **Aurora** design system instead — dark surfaces, a green/
cyan/blue signature gradient, Space Grotesk / Inter Tight / JetBrains Mono
— the same system Synap uses. Reviewed and **kept as-is**: Hearth is
deliberately Synap's visual sibling, not a distinct brand. Do not
reintroduce the warm/cream direction without asking first — it would mean
replacing the token layer and the two font families; nothing in the
component anatomy changes.

## Stack
Vite + React 18 + TypeScript · React Router · CSS variables (Aurora
tokens, dark theme; a light theme exists at parity via `[data-theme="light"]`
if ever wanted) · TanStack Query for server state · Zustand for session +
selected location. Icons: port `icons.jsx` (Lucide-style inline SVG, 1.5px
stroke, 24px grid) or use `lucide-react` directly.

## Conventions
- Aurora tokens only — never invent a color, spacing, or type value; write
  the token name, never the literal.
- The signature gradient (`#22E06B → #21D0C4 → #2AA5F5`) is reserved for at
  most one element per screen — the wordmark. Never a background wash, body
  text, a table cell, or a chart line.
- Sentence case everywhere; numbers stay numeric ("3 alerts", never
  "three"); never print a bare `0` — write "None".
- Sidebar nav rows are 32px (the design system's own density) — a known
  tension with the tablet-at-the-counter use case. Raise as a
  design-system change rather than a local override if it needs revisiting.
- Call it "Location", never "workspace" — that word is reserved for
  tenant-level concepts elsewhere in this system.
- Centralize mock data as a typed module (port of `reference/mockData.js`)
  — it's the API contract until real endpoints exist.
- 44px minimum interactive height everywhere except the sidebar nav rows
  noted above. Tables stay tables and scroll horizontally below 1024px —
  they do not reflow into cards.

## Open items to resolve before later phases close out
- **No settings screen exists.** Location open/closed state is shown in
  the switcher but not editable anywhere, and "Pause online orders" on the
  dashboard is the product's only store-state control. Needs a decision
  before Iteration 8 (Payments) closes.
- **Product name undecided.** "Hearth" is a working name; alternatives
  considered were "Counterpane" and "Mise". It's a single `BRAND` constant
  in `reference/mockData.js` and a single `brandName` prop in
  `Hearth.dc.html` — renaming is a one-line change in each whenever this
  is decided.

## Screens in this bundle (see `BUILD_PLAN.md` for the rest)
1. Foundations + primitives — built
2. Login + 6-digit verify — built; **customer-app Phase 5/6 priority
   (issue #45)**
3. App shell (sidebar, location switcher, top bar) — built
4. Dashboard — built
5. Orders, 6. Menu management, 7. Deliveries, 8. Payments — specced only in
   `BUILD_PLAN.md`; build each as its own roadmap task, one at a time, per
   root `CLAUDE.md` §11.

## Running the reference prototype locally
`reference/index.html` fetches the other `.jsx` files and imports
`mockData.js` as an ES module — opening it directly via `file://` will hit
CORS restrictions in most browsers. Serve the folder instead, e.g.:
```bash
cd customer-app/design_handoff/design_handoff_hearth/reference
python3 -m http.server 8000
# open http://localhost:8000/
```
It needs a network connection either way — React, Babel, and webfonts load
from CDN.

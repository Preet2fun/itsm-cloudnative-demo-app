# Hearth Dashboard + AI Copilot — Design

**Status:** Approved for planning
**Tracking:** GitHub issue [#54](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/54)
**Supersedes:** nothing — this is the first real-stack build of screens 02 (App Shell) and 03/04 (Dashboard) from `customer-app/design_handoff/design_handoff_hearth/BUILD_PLAN.md`.

## 1. Goal

Build Hearth's Dashboard + AI Copilot screen in the real frontend stack
(`customer-app/services/frontend`, package `hearth-ui`), matching the design
handoff at `customer-app/design_handoff/design_handoff_hearth/DASHBOARD_COPILOT.md`
and `customer-app/design_handoff/Hearth Dashboard.dc.html` pixel- and
behavior-accurately. Everything on this screen is explicitly mocked per the
design spec — no real backend wiring, no real LLM calls.

This is the screen a tenant owner/manager sees immediately after login. It
replaces the current placeholder (`Welcome.tsx`, "You're signed in") as the
post-auth landing route.

## 2. Context

- Login + 6-digit MFA verify are the only screens built in the real stack
  today (issue #45, closed). Aurora design tokens are already fully ported
  into `src/index.css` — no token work needed.
- **No App Shell exists in the real stack.** `App.tsx` has only
  `/login`, `/login/verify`, and a bare `/` → `Welcome.tsx`. There is no
  TopBar, no Sidebar, no authenticated layout route. The Dashboard screen's
  own layout spec requires both, so building Dashboard requires building a
  minimal App Shell first — confirmed as the right scope by the user
  (App Shell ships as part of this task, not a separate prior one).
- The design handoff was just updated: two new files,
  `design_handoff_hearth/DASHBOARD_COPILOT.md` (74-line behavior spec) and
  `Hearth Dashboard.dc.html` (672-line Claude Design canvas — the canonical
  prototype, markup, and the `SCRIPT` object with all 10 starter-question
  conversation flows). This **supersedes** the old `Hearth.dc.html`'s
  dashboard and the stale `reference/Dashboard.jsx` / `reference/AppShell.jsx`
  / `reference/mockData.js` prototype files (confirmed via `grep -ri copilot`
  returning nothing in `reference/` — those files predate this update and
  are not touched by this work).
- `customer-app/design_handoff/CLAUDE.md` was deleted locally, uncommitted.
  Its content (retrieved via `git show HEAD:...`) carried conventions not
  written down anywhere else, and `App.tsx`'s own code comment still
  references it by path. It is restored and updated as part of this work
  (§6).
- `customer-app/design_handoff/github.md` (the screen→repo-doc sync map) is
  stale — last sync 2026-09-17, predates this handoff update, and still
  says "Hearth 03 Dashboard | none — new surface, no repo counterpart."
  Updated as part of this work (§6).

## 3. Decisions (made during brainstorming, user-approved)

| Decision | Choice | Why |
|---|---|---|
| Deleted `design_handoff/CLAUDE.md` | Restore, updated | Real code (`App.tsx`) already references it by path; its conventions (Aurora decision-on-record, icon rule, 44px/no-bare-0/no-reflow rules, two open items) aren't duplicated elsewhere. |
| Icon sourcing | Add `lucide-react` as a new dependency | ~13 icons needed beyond the 11 already hand-ported into `reference/icons.jsx`; Aurora's own icon convention is explicitly "Lucide-style." Avoids hand-drawing icons that risk drifting from the spec. `reference/icons.jsx` is left untouched — nothing live uses it. |
| App Shell scope | Build minimal App Shell (TopBar + Sidebar + authenticated layout route) as part of this task | Dashboard's own layout spec requires it; there's no way to deliver Dashboard without some shell. `BUILD_PLAN.md` already sequences App Shell immediately before Dashboard (iterations 3→4). Not speculative — it's the minimum the current task needs. |
| Issue tracking | Create a tracking issue before starting, matching #45's pattern | Done — issue #54. |
| Component architecture | Shared component primitives (Card, Button, StatusBadge, KpiTile, Sparkline, DataTable), not bespoke per-screen styling | The `.dc.html` itself models these as a reusable `DesignSystem_f13b19.*` namespace, and `BUILD_PLAN.md`'s remaining iterations (Orders, Menu, Deliveries, Payments) will reuse every one of them. Building once now avoids four future screens re-deriving the same styling. |
| Copilot engine architecture | Direct 1:1 port of the `.dc.html`'s `SCRIPT` object + `Component` class logic, not a generic reusable "flow engine" | Nothing else on the roadmap needs a generic scripted-conversation abstraction yet (YAGNI). `DASHBOARD_COPILOT.md` explicitly says to "treat [SCRIPT] as the content and tone spec for real responses" — a close port is the most faithful and lowest-risk option. |

## 4. Architecture

### 4.1 Routing & App Shell

`App.tsx`'s route tree changes from one flat `RequireAuth` wrapper around
`Welcome` to a nested layout route:

```tsx
<Route element={<RequireAuth><AppShellLayout /></RequireAuth>}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
<Route path="/" element={<Navigate to="/dashboard" replace />} />
```

`AppShellLayout` renders `TopBar` (wordmark, location switcher, Ask/Hide
Copilot toggle, user name, sign-out) + `Sidebar` (Dashboard active; Orders,
Menu, Deliveries, Payments present but disabled/non-navigable — they are not
routes yet) + a `<main>` containing `<Outlet/>`. This matches the `.dc.html`'s
`TopBar`/`Sidebar`/`main` structure (`Hearth Dashboard.dc.html:27-34`).

`Welcome.tsx` and `Welcome.module.css` are deleted — Dashboard is now the
real post-login landing, which is exactly what `Welcome.tsx`'s own comment
says this task is for ("The real dashboard is a later roadmap task... see
BUILD_PLAN.md, iteration 4").

Location switching (the `TopBar`'s environment/location selector) is local
UI state only — three hardcoded location names (`Northside Trattoria`,
`Harbourline Kitchen`, `Eastgate Counter`, per the `.dc.html`'s
`renderVals()`), no real multi-location backend. Switching location does not
change any displayed data in this iteration (the mock data is single-location);
this matches the `.dc.html` itself, which also doesn't vary data by location.

### 4.2 Component library (`src/components/`)

All CSS-Modules-styled, built from the existing Aurora tokens in
`index.css`. No component here is speculative — each is used by this screen
today and is named/shaped to match the `.dc.html`'s own component set so
future screens (which reuse the same `.dc.html` component vocabulary) can
reuse them unchanged:

- **`Icon`** — thin wrapper resolving a kebab-case name (`"trending-up"`,
  `"sparkles"`, etc., matching the spec's icon names verbatim) to a
  `lucide-react` component, rendered with `strokeWidth={1.5}` (overriding
  `lucide-react`'s default of 2, to match `reference/icons.jsx`'s existing
  1.5px-stroke convention), plus `aria-hidden="true"` and
  `focusable={false}` defaults (every usage on this screen is decorative;
  interactive controls get their accessible name from the surrounding
  `Button`/`IconButton`, never the icon itself).
- **`Button`** — `variant`: `primary | secondary | ghost`; `size`:
  `sm | md`. Matches the `.dc.html`'s `Button` usages (e.g. "Today",
  "Pause online orders", "Approve changes", "Not now").
- **`IconButton`** — icon-only button with a required `label` prop (renders
  `aria-label`), `variant`/`size` matching `Button`. Used for "Close
  Copilot" and the composer's send button.
- **`Input`** — text input, `size`: `sm | md | lg`, used by the Copilot
  composer only in this task (`"Ask about sales, orders, menu,
  deliveries…"`).
- **`Card`** — bordered panel with optional `eyebrow`, `title`, `action`
  slot (top-right), and children. Used by the AI business brief, Deliveries
  in flight, and Top items today.
- **`StatusBadge`** — `tone`: `info | warning | success | danger | neutral`,
  optional leading dot. Used by the orders table's status column and the
  deliveries list.
- **`KpiTile`** — `label`, `value`, `delta`, `tone` (`up | down`), `trend`
  (7-point sparkline). The four dashboard KPI tiles.
- **`Sparkline`** — small inline SVG polyline, `values: number[]`, `width`,
  `height`. No charting library — a plain SVG `<polyline>` computed from the
  min/max of `values`, matching the `.dc.html`'s own `Sparkline` component's
  visual role (used by both `KpiTile` and the Copilot's `spark` answer
  block).
- **`DataTable`** — generic `columns`/`rows`, a `render` function per column
  for custom cells (status badges, mono-styled IDs). Used by Orders in
  progress.

### 4.3 Mock data (`src/lib/mockDashboardData.ts`)

A typed module holding everything the `.dc.html`'s `renderVals()` currently
inlines as JS literals: the 4 KPI tile values + 7-day trends, the 5 order
rows, the 3 in-flight deliveries, the 5 top items, and the AI business
brief's three tiles (Sales / Needs attention / Insight) and suggested-action
labels. Ported verbatim — values, labels, and deltas unchanged from
`Hearth Dashboard.dc.html:620-646`.

### 4.4 Copilot subsystem (`src/copilot/`)

- **`copilotScript.ts`** — the `SCRIPT` object (all 10 starter-question
  entries plus their follow-ups: `performance`, `revenue`, `orders`,
  `payments`, `payments_card`, `payments_act`, `delivery`, `delivery_items`,
  `kitchen`, `delivery_recommend`, `delivery_act`, `delivery_act_one`,
  `menu`, `trends`, `anomalies`, `eastgate`, `focus`, `forecast`,
  `forecast_conf`, `ack`) and the `PROMPTS` array (10 starter questions:
  area, question text, icon name), typed, ported close to verbatim from
  `Hearth Dashboard.dc.html:305-458`. Per `DASHBOARD_COPILOT.md`: "Treat it
  as the content and tone spec for real responses" — content/wording is not
  rewritten, only typed and restructured as TS.
- **`useCopilot.ts`** — a hook owning thread state: `messages` (user /
  pending / copilot roles), `draft`, `approvals` (keyed by message id). Core
  methods mirror the `.dc.html`'s `Component` class:
  - `respond(key, userText?)` — pushes a user message (if given), then a
    pending message, then (after a short delay, matching the `.dc.html`'s
    900ms `setTimeout` — this is a deliberate UX pause representing "the
    copilot thinking," not a network call) replaces the pending message
    with the scripted `SCRIPT[key]` answer.
  - `send(text)` — matches `text` case-insensitively against `PROMPTS`; on a
    hit, calls `respond()`; on a miss, shows the spec's fixed fallback
    message ("We couldn't reach the analysis service just now. Try one of
    the suggested questions...") — **no LLM call is made**, per
    `DASHBOARD_COPILOT.md`'s explicit "Not built yet: real data and real
    LLM tool-calls."
  - `resolveApproval(msgId, key, decision)` — on `"approved"`, pushes the
    scripted confirmation message for that `key` (ported from
    `Hearth Dashboard.dc.html:534-541`); on `"dismissed"`, just records the
    decision (no follow-up message), matching the DC.
  - `newThread()` — clears `messages`/`approvals`.
  - On mount, pre-seeds the same default conversation the `.dc.html` uses
    (`startConversation: 'Delivery deep-dive'`): user asks "Why are
    deliveries delayed?", scripted `delivery` answer, user says "Yes",
    scripted `delivery_items` answer — this is the DC's own documented
    default first-load state, not an arbitrary choice.
- **`CopilotPanel.tsx`** — header (Copilot label, New / Close buttons),
  scrollable thread (auto-scrolls to bottom on new messages, matching the
  `.dc.html`'s `componentDidUpdate` scroll behavior), empty-state starter
  questions (only shown when `messages.length === 0` — reachable via "New
  thread"), pinned composer (Input + send IconButton, Enter-to-send,
  disabled when draft is empty). Collapses by default below a 1200px
  viewport width (`copilotOpen` defaults per the `.dc.html`'s
  `narrow` check), width `clamp(320px, 30vw, 400px)`.
- **`CopilotMessage.tsx`** — renders one thread entry: user bubble, pending
  (icon + status text), or a full copilot answer (stage label, paragraphs,
  `AnswerBlock`s, optional second paragraph, action buttons, quick-reply
  chips — chips only render on the latest message, matching the DC's
  `isLast` check).
- **`AnswerBlock.tsx`** — dispatches on `block.type` to one of:
  - **`CompareBlock`** — label / from → to rows, colored by tone
    (`up`/`down`/`neutral`).
  - **`BarsBlock`** — label/value rows with a proportional bar on
    `--viz-1`.
  - **`SparkBlock`** — a `Sparkline` plus a 3-stat grid.
  - **`ListBlock`** — numbered or `!`-marked rows.
  - **`ApprovalBlock`** — rows plus, depending on `approvals[msgId]`,
    either "Approve changes"/"Not now" buttons (pending) or a resolved
    `StatusBadge` ("Approved by Rosa · just now" / "Dismissed").

### 4.5 Data flow

All state is local React state (`useCopilot`) plus the static
`mockDashboardData` module — no TanStack Query, no `api.ts` calls, since
there is no real backend for this screen yet (explicitly out of scope,
§4.4). This is a deliberate asymmetry from Login/MFA (which does call real
endpoints) — the Dashboard screen's own design spec is mocked-by-design,
not an oversight.

## 5. File structure

**Create:**
- `src/layout/AppShellLayout.tsx` + `.module.css`
- `src/layout/TopBar.tsx` + `.module.css`
- `src/layout/Sidebar.tsx` + `.module.css`
- `src/components/Icon.tsx`
- `src/components/Button.tsx` + `.module.css`
- `src/components/IconButton.tsx` + `.module.css`
- `src/components/Input.tsx` + `.module.css`
- `src/components/Card.tsx` + `.module.css`
- `src/components/StatusBadge.tsx` + `.module.css`
- `src/components/KpiTile.tsx` + `.module.css`
- `src/components/Sparkline.tsx`
- `src/components/DataTable.tsx` + `.module.css`
- `src/lib/mockDashboardData.ts`
- `src/copilot/copilotScript.ts`
- `src/copilot/useCopilot.ts`
- `src/copilot/useCopilot.test.ts`
- `src/copilot/CopilotPanel.tsx` + `.module.css`
- `src/copilot/CopilotMessage.tsx`
- `src/copilot/AnswerBlock.tsx`
- `src/copilot/blocks/CompareBlock.tsx`
- `src/copilot/blocks/BarsBlock.tsx`
- `src/copilot/blocks/SparkBlock.tsx`
- `src/copilot/blocks/ListBlock.tsx`
- `src/copilot/blocks/ApprovalBlock.tsx`
- `src/copilot/blocks.module.css` (shared block container styling)
- `src/pages/Dashboard.tsx` + `.module.css`
- `src/pages/Dashboard.test.tsx`

**Modify:**
- `src/App.tsx` — route tree (§4.1)
- `package.json` — add `lucide-react` (exact version pinned at
  implementation time via `npm view lucide-react version`, not guessed)
- `customer-app/design_handoff/CLAUDE.md` — restore (from
  `git show HEAD:customer-app/design_handoff/CLAUDE.md`), then update: the
  "Screens in this bundle" list's item 3 ("App shell... built") and item 4
  ("Dashboard... built") both already say "built" referring to the
  *design-handoff prototype*, not the real stack — add a note clarifying
  real-stack status, and point item 4 at `DASHBOARD_COPILOT.md` as the
  current source of truth (superseding the plain "Dashboard — built" line).
- `customer-app/design_handoff/github.md` — update the screen map's
  Dashboard row and append a new "Sync history" entry for this handoff
  update.
- Root `.claude/CLAUDE.md` §6 Customer App tech-stack table — Frontend row:
  extend "Login + 6-digit MFA verify are built" to also note Dashboard +
  Copilot (App Shell) once built, same pattern as the existing edit for
  Login.

**Delete:**
- `src/pages/Welcome.tsx`
- `src/pages/Welcome.module.css`

## 6. Testing

- `useCopilot.test.ts` — exercises the reference conversation from
  `DASHBOARD_COPILOT.md` §"Reference conversation": starter question →
  scripted `delivery` answer → "Yes" follow-up → `delivery_items` answer →
  "What should I do about it?" → `delivery_recommend` → "Go ahead and make
  those changes" → `delivery_act` approval card → `resolveApproval(...,
  'approved')` → confirmation message. Also covers: free-text miss → fixed
  fallback message (no network call); `newThread()` clears state.
- `Dashboard.test.tsx` — smoke test: renders without crashing inside
  `AppShellLayout` + a mock session, asserts the greeting, all 4 KPI
  labels, and the Copilot panel's default pre-seeded thread are present.
  Follows the existing `Login.test.tsx` / `LoginVerify.test.tsx` pattern
  (Vitest + Testing Library, already configured in `vitest.config.ts`).
- Manual live-browser verification (the actual Done-when, per issue #54):
  load `/dashboard` after a real login, open Copilot, run a starter
  question through to an approved mock action, confirm the Sidebar's
  inactive items don't navigate, confirm the panel collapses below 1200px.

## 7. Explicitly out of scope

Per `DASHBOARD_COPILOT.md`'s own "Not built yet" list, carried into issue
#54 verbatim:
- Undo after an approved change.
- "View affected orders" and "View all payments" buttons (render but are
  inert, matching the `.dc.html`'s own `null` click handlers).
- Real data and real LLM tool-calls — Copilot is 100% scripted/mocked.
- Orders, Menu, Deliveries, Payments screens — each is its own future
  roadmap task; Sidebar links to them exist but are disabled, not routed.
- A settings screen (still an open item carried from the restored
  `design_handoff/CLAUDE.md`).
- Deciding the product's final name (still "Hearth," still undecided per
  the restored `design_handoff/CLAUDE.md`).

## 8. Acceptance criteria (issue #54's Done-when)

The screen matches the design draft, verified live in a browser — including
a full Copilot conversation (a starter question through to an approved mock
change).

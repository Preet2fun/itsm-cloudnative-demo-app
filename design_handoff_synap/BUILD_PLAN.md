# Synap — Claude Code Build Plan (iterative)

This is your **step-by-step playbook** for building the Synap frontend with Claude Code, one iteration at a time. Each step has a **goal**, the **reference files** to point Claude at, and a **copy-paste prompt**.

> **Golden rules for every prompt**
> - Always tell Claude: *"The HTML files in `design_handoff_synap/reference/` are the design source of truth. Match them pixel-for-pixel, but implement in our real stack with proper components."*
> - Build **foundation first** (tokens + primitives). Don't start screens until Iter 0 is solid.
> - One iteration per PR. Review the running UI against the prototype before moving on.
> - Keep `data.jsx` as your API/model contract until real endpoints exist.

---

## Step 0 — What to commit

Commit the whole handoff folder into your repo so Claude Code can read it:

```
git checkout -b synap-frontend
mkdir -p design_handoff_synap
# copy the design_handoff_synap/ folder (README.md, BUILD_PLAN.md, reference/*) into the repo
git add design_handoff_synap
git commit -m "Add Synap design handoff + HTML prototype reference"
git push -u origin synap-frontend
```

**Files to commit (all in `reference/`):**

| Commit it? | File | Why |
|---|---|---|
| ✅ | `styles.css` | Design tokens — port directly into your token layer |
| ✅ | `data.jsx` | Mock data = your API/model contract |
| ✅ | `icons.jsx` | Icon path set (or switch to lucide-react) |
| ✅ | `ui.jsx` | Primitive components spec |
| ✅ | `auth.jsx`, `shell.jsx`, `dashboard.jsx`, `aiops.jsx`, `incidents.jsx`, `inventory.jsx`, `modules.jsx`, `portal.jsx`, `copilot.jsx` | One per screen — the visual + interaction spec |
| ✅ | `Synap.html` | Shows load order + font setup |
| ⚠️ | `synap-tweaks.jsx`, `tweaks-panel.jsx` | Reference only — **do not port**, replace with real Settings |
| ✅ | `README.md`, `BUILD_PLAN.md` | This handoff |

Also drop the `CLAUDE.md` (below) at the **repo root** so every Claude Code session has context.

---

## Step 1 — Iteration 0: Scaffold + design system

**Goal:** Vite + React + TS project; port tokens; build primitive components with a Storybook-style preview page.

> **Prompt to Claude Code:**
> "Read `design_handoff_synap/README.md` and `reference/styles.css`. Scaffold a Vite + React + TypeScript app. Port `styles.css` verbatim into our global token layer (keep the OKLCH variables and the `[data-theme="dark"]` overrides; keep light/dark working). Set up Google Fonts: Space Grotesk, Hanken Grotesk, JetBrains Mono. Then implement these primitive components as typed React components, matching `reference/ui.jsx` and `reference/icons.jsx` exactly: `Icon`, `Button` (variants: default/primary/ai/ghost/danger, sizes sm/lg), `Badge`/`SevBadge`, `Card`, `Avatar`, `HealthDot`, `Sparkline`, `StatCard`, `Segmented`, `AiOrb`, `AiChip`, `Empty`, `CountUp`. Build a `/dev/components` preview route rendering all of them in light and dark. Don't build any product screens yet."

**Done when:** the preview page matches the prototype's buttons/badges/cards in both themes.

---

## Step 2 — Iteration 1: Authentication

**Goal:** Login + SSO + MFA, plus the two screens that were only stubs in the prototype.

> **Prompt:**
> "Using `reference/auth.jsx` as the pixel spec, build the auth flow: split-screen login (brand panel left with the synapse `BrandMark` SVG + the 'nervous system of your enterprise' copy and the 96%/41min/64% stats; form panel right). Include: email+password, SSO buttons (Okta, Azure AD, Google) with their loading→redirect states, and the 6-digit MFA step. Then **build out two screens that are only stubbed in the prototype**: 'Create workspace' (sign-up) and 'Forgot password / reset', matching the same visual language. Wire routing between them. Use placeholder auth logic with a clear seam for real OIDC/SAML later."

**Done when:** all auth screens navigate correctly; matches prototype; create-workspace + forgot-password are real screens.

---

## Step 3 — Iteration 2: App shell + routing + theme

> **Prompt:**
> "Using `reference/shell.jsx` and `reference/app.jsx`, build the app shell: left sidebar (Synap mark, workspace switcher, grouped nav: Operate / Self-Service / Inventory / Insights, with badges, plus the 'Synap is listening' footer card) and the topbar (page title, ⌘K search trigger, 'Ask Synap' button, theme toggle, notification bell, persona segmented control Agent/Employee, avatar menu). Set up React Router with a route per nav item. Implement light/dark theme toggle persisted to localStorage. Implement the persona switch (Agent console vs Employee portal). Keep the per-route error boundary from `app.jsx`. Render placeholder pages for each route for now."

---

## Step 4 — Iterations 3–8: Screens (one per PR)

For each, the prompt pattern is the same — swap the file + screen name:

> **Prompt template:**
> "Build the **\<SCREEN\>** screen from `reference/\<FILE\>`, matching it pixel-for-pixel. Use our primitive components from Iter 0. Pull mock data from a typed port of `reference/data.jsx` (don't hardcode in the component). Preserve all interactions and motion described in README §8. Flag every `setTimeout`-faked AI call with a `// TODO: real API` seam."

Run them in this order:

| Iter | Screen | File |
|---|---|---|
| 3 | Ops Dashboard | `dashboard.jsx` |
| 4 | **AIOps Event Console** (correlation animation — hero #3) | `aiops.jsx` |
| 5 | **Incidents** list + detail (hero #2) | `incidents.jsx` |
| 6 | **End-user Portal** (hero #1) | `portal.jsx` |
| 7 | CMDB, Service Map, Cloud, Assets | `inventory.jsx` |
| 8 | Monitoring, Knowledge, Analytics, Admin | `modules.jsx` |

> **Tip:** Do the **three hero flows (Iter 4–6) carefully** — they're the demo and the differentiation. Verify each end-to-end interaction against the prototype before merging.

---

## Step 5 — Iteration 9: Global Copilot + ⌘K palette

> **Prompt:**
> "Build the global 'Ask Synap' copilot side panel and the ⌘K command palette from `reference/copilot.jsx`. Match the panel (orb header, message bubbles, AI block types: text/actions/rca/plan/summary, typing indicator, input). Wire ⌘K to open the palette with AI suggestions + navigation commands. For now keep the scripted replies from `COPILOT_REPLIES`, but structure the message handler so a real streaming LLM endpoint can drop in. Make copilot open/close state global (Zustand)."

---

## Step 6 — Iteration 10: Real data + APIs

> **Prompt:**
> "Replace the mock layer (`data.jsx` port) with real API calls using TanStack Query. Turn each collection (incidents, events, services, CIs, knowledge, metrics…) into a typed model + endpoint. Replace scripted copilot/portal/analytics `setTimeout` fakes with real backend calls (streaming where the prototype streams). Wire SSO to our IdP. Keep all components unchanged — only swap the data source."

---

## Per-sprint loop (after the base is built)

You mentioned you'll add things each sprint. Repeatable loop:

1. **Prototype the new screen/change here** (in this design tool) → I update the relevant `reference/*.jsx`.
2. **Re-export** the handoff (or just the changed file) and commit it.
3. **Prompt Claude Code:** *"The design for \<X\> changed — see updated `reference/\<file\>`. Update the \<X\> component to match; keep our data/API wiring intact."*
4. Review running UI vs prototype → merge.

This keeps the HTML prototype as the **living spec** and the codebase as the **implementation**, sprint over sprint.

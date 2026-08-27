# Handoff: Synap — AI-native ITOM + ITSM Platform

> **Read me first.** The files in `reference/` are a **working HTML/React-via-Babel prototype** — they show the intended look, layout, copy, and interactions. They are **design references, not production code to ship as-is.** Your job is to **recreate these designs in a real frontend codebase** (Vite + React + TypeScript recommended below) using proper components, routing, and a real design-token system. Match the prototype pixel-for-pixel; re-architect everything underneath.

---

## 1. Overview

Synap is an **AI-native** IT Operations (ITOM) + IT Service Management (ITSM) SaaS platform. Tagline: *"The nervous system of your enterprise — instantly routing ITOM alerts to automated fixes."* It is an international B2B SaaS, self-hosted on the customer's Kubernetes.

The product has **two surfaces**:
- **Agent / Ops console** (primary) — for SREs, NOC, L1/L2 agents, IT managers.
- **End-user self-service portal** — for employees to resolve their own IT issues with AI, with zero tickets.

There are **three hero "wow" flows** the whole product is built to demonstrate (see §5).

## 2. Fidelity

**High-fidelity.** Final colors, typography, spacing, copy, and interactions are all defined. Recreate the UI pixel-perfectly. The visual language is inspired by **Datadog** (telemetry density) and **DevRev** (clean AI-native feel): calm enterprise surfaces, a violet/indigo AI accent, an "AI gradient" used only for AI affordances, and restrained motion.

## 3. Recommended tech stack

The prototype is framework-agnostic React. Recommended production stack:

| Concern | Recommendation |
|---|---|
| Build | **Vite** |
| Language | **React 18 + TypeScript** |
| Routing | **React Router** (the prototype's `view` state → real routes) |
| Styling | **CSS variables + CSS Modules** (or Tailwind w/ the tokens in §7). Keep the `styles.css` token layer — it already supports light/dark + theming.) |
| Icons | Port `icons.jsx` to a typed `<Icon>` component, or swap for **lucide-react** (the paths are lucide-style) |
| State | Local state + **TanStack Query** for server data; **Zustand** for cross-cutting UI (copilot open, theme, persona) |
| Charts | The prototype hand-rolls SVG sparklines/telemetry. For production use **Recharts** or **visx**, or keep the lightweight SVG components |
| Auth | Wire SSO (OIDC/SAML) to your IdP; the screens for password + Okta/Azure/Google + MFA are designed |

> If the repo already has a frontend stack, **use that** instead — these designs should adopt the existing component library and conventions.

## 4. Module / screen inventory

Each prototype file maps to a feature area. Build them in the order in §6.

| # | Screen | Reference file | Purpose |
|---|---|---|---|
| 0 | Design tokens + primitives | `styles.css`, `ui.jsx`, `icons.jsx` | Foundation: colors, type, buttons, badges, cards, avatars, sparklines, stat cards |
| 1 | **Login / SSO / MFA / workspace** | `auth.jsx` | Split-screen: brand panel + password, Okta/Azure/Google SSO, 6-digit MFA step |
| 2 | **App shell** (sidebar + topbar) | `shell.jsx` | Persistent nav, workspace switcher, ⌘K search, Ask-Synap button, theme toggle, persona switch |
| 3 | **Ops Dashboard** | `dashboard.jsx` | Home: KPI stat cards, hero active-incident card, service health, AI activity feed, predictive alerts |
| 4 | **AIOps Event Console** | `aiops.jsx` | The correlation hero: 47-alert storm → "Correlate with Synap" → collapses into 1 incident w/ animated topology viz |
| 5 | **Incidents** (list + detail) | `incidents.jsx` | List table; detail with AI resolution runbook (approve & run), live asset telemetry charts, AI timeline, similar/related |
| 6 | **End-user Portal** | `portal.jsx` | Zero-ticket self-service: chat → AI device diagnostics → "Apply fix automatically" → resolved |
| 7 | **CMDB / Discovery** | `inventory.jsx` → `Cmdb` | Auto-discovered CIs table with health + AI discovery banner |
| 8 | **Service Map** | `inventory.jsx` → `ServiceMap` | SVG dependency topology, click node → impact/blast-radius panel |
| 9 | **Cloud & Infra** | `inventory.jsx` → `CloudInventory` | Multi-cloud inventory w/ cost + health |
| 10 | **Assets** | `inventory.jsx` → `Assets` | Managed-asset table linked to owners/CMDB |
| 11 | **Monitoring** | `modules.jsx` → `Monitoring` | Golden-signals charts + predictive-alert banner |
| 12 | **Knowledge Base** | `modules.jsx` → `Knowledge` | Article grid + reader; AI-drafted articles |
| 13 | **Analytics (NL query)** | `modules.jsx` → `Analytics` | Natural-language → report/chart generator |
| 14 | **Admin & Settings** | `modules.jsx` → `Admin` | Integrations, Users & Roles, AI Governance toggles |
| 15 | **Global Copilot** | `copilot.jsx` | Right-side "Ask Synap" panel + ⌘K command palette; scripted AI responses |
| 16 | **Tweaks panel** | `synap-tweaks.jsx`, `tweaks-panel.jsx` | **Prototype-only** demo theming. Do NOT port — replace with real Settings. |

## 5. The three hero flows (must work end-to-end)

1. **Zero-ticket self-service** (`portal.jsx`): Employee describes an issue → AI reads device diagnostics → proposes a fix → "Apply fix automatically" → resolved in ~40s, **no ticket created**. Value: deflect L1 entirely.
2. **AI-assisted agent resolution** (`incidents.jsx`): Agent opens an incident → sees AI resolution runbook + live telemetry for the affected asset inline → "Approve & run" → resolves in minutes → AI auto-drafts a KB article. Value: MTTR from days → minutes.
3. **AIOps nervous-system loop** (`aiops.jsx` → `incidents.jsx`): Alert storm (47 events) → "Correlate with Synap" collapses them into 1 incident with root cause → remediation runbook → human approves → auto-remediate → draft KB. Value: 96% noise reduction.

## 6. Suggested build order (iterations)

Build foundation-first so every later screen reuses primitives. Detailed per-iteration prompts are in **`BUILD_PLAN.md`**.

```
Iter 0  Project scaffold + design tokens + primitive components (Icon, Button, Badge, Card, StatCard, Avatar, Sparkline)
Iter 1  Auth: Login + SSO + MFA  (+ create-workspace & forgot-password, which are stubs in the prototype)
Iter 2  App shell: sidebar, topbar, routing, theme (light/dark), persona switch
Iter 3  Ops Dashboard
Iter 4  AIOps Event Console (hero flow #3, correlation animation)
Iter 5  Incidents list + detail (hero flow #2)
Iter 6  End-user Portal (hero flow #1)
Iter 7  Inventory: CMDB, Service Map, Cloud, Assets
Iter 8  Monitoring, Knowledge, Analytics, Admin
Iter 9  Global Copilot panel + ⌘K command palette
Iter 10 Wire real data/APIs, replace mock layer, auth integration
```

## 7. Design tokens (source of truth: `styles.css`)

Colors use **OKLCH** so the accent hue can be themed from one variable. Light values shown; dark overrides live under `[data-theme="dark"]` in `styles.css`.

### Accent (themeable via `--accent-h` hue, default 280 = violet)
- `--accent` `oklch(0.56 0.17 280)` · `--accent-strong` `oklch(0.48 0.17 280)`
- `--accent-soft` / `--accent-softer` — tints for AI surfaces
- **AI gradient** `--ai-grad`: `linear-gradient(120deg, oklch(0.6 0.19 280), oklch(0.62 0.18 320))` — **reserve strictly for AI affordances** (copilot orb, AI badges, "resolve with Synap")

### Neutrals (light)
- `--bg` `oklch(0.985 0.003 270)` · `--surface` `#fff` · `--surface-2` `oklch(0.985 …)`
- `--border` `oklch(0.915 0.005 270)` · `--ink` `oklch(0.24 0.013 270)` · `--muted` `oklch(0.56 …)`

### Semantic
- critical `oklch(0.57 0.21 25)` · high `oklch(0.66 0.18 50)` · warn `oklch(0.76 0.15 80)` · ok `oklch(0.6 0.13 155)` · info `oklch(0.6 0.13 245)` — each has a `-soft` background variant.

### Typography
- Display: **Space Grotesk** (headings, metrics) · UI: **Hanken Grotesk** (body/labels) · Mono: **JetBrains Mono** (IDs, telemetry numbers, CI names)
- Slide/heading scale lives in components; body base 14px (density-adjustable 13/14/15).

### Radius
`--r-xs 6 · sm 8 · md 11 · lg 16 · xl 22 · full 999` (px)

### Shadows
`--shadow-xs/sm/md/lg` + `--shadow-glow` (accent glow, AI buttons only). All in `styles.css`.

### Spacing
Utility gap classes `.gap-1..6` = 4/8/12/16/24 px. Card padding 14–18px. Page max-width 1320px, padding 24px.

## 8. Interactions & motion

- **Entrance:** `.fade-in` = 0.4s ease, translateY(6px)→0. Keep subtle.
- **AIOps correlation:** dots scattered → converge to center node (0.9s cubic-bezier, staggered 18ms); event rows slide out + fade as they're absorbed. See `CorrelationViz` in `aiops.jsx`.
- **Remediation / fix:** stepper with numbered → check states; "running" shows typing dots; "done" reveals a success card with metrics. See `incidents.jsx` / `portal.jsx`.
- **AI "thinking":** 3-dot typing indicator (`.typing`), shimmer skeletons (`.shimmer`).
- **Critical health:** pulsing ring (`.pulse-dot`, SVG `<animate>` in service map).
- Respect `prefers-reduced-motion` in production.

## 9. State (per the prototype, see `app.jsx`)

- `authed` (gate), `view` (route), `persona` `agent|enduser`, `theme` `light|dark`, `copilotOpen`, `paletteOpen`, `copilotSeed`.
- Copilot/Portal/Analytics use scripted async timeouts to fake AI latency — **replace with real streaming API calls.** Look for `setTimeout(...)` blocks; those are the integration seams.
- Error boundary (`Boundary` in `app.jsx`) isolates per-view crashes — keep this pattern.

## 10. Mock data → real APIs

All mock data is centralized in **`data.jsx`** (`window.HELIX_DATA`): people, services, CIs, incidents, events, timeline, changes, catalog, requests, knowledge, metrics. **This is your API contract sketch** — turn each collection into a typed model + endpoint. Replace the scripted copilot replies (`COPILOT_REPLIES` in `copilot.jsx`) with your LLM backend.

## 11. Assets

No external image assets — the logo is an inline SVG synapse mark (`BrandMark` in `auth.jsx`), all icons are inline SVG (`icons.jsx`). Fonts load from Google Fonts. No licensed assets to procure.

## 12. Files in this bundle (`reference/`)

`Synap.html` (entry/loader) · `styles.css` (tokens) · `data.jsx` (mock data/API contract) · `icons.jsx` · `ui.jsx` (primitives) · `auth.jsx` · `shell.jsx` · `copilot.jsx` · `dashboard.jsx` · `aiops.jsx` · `incidents.jsx` · `inventory.jsx` · `modules.jsx` · `portal.jsx` · `synap-tweaks.jsx` + `tweaks-panel.jsx` (prototype theming — don't port).

To run the reference locally: serve the folder and open `Synap.html` (it loads the `.jsx` via Babel in-browser). Sign in with any SSO button or email→MFA.

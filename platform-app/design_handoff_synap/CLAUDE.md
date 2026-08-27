# CLAUDE.md — Synap frontend

## What this is
Synap is an **AI-native ITOM + ITSM** SaaS platform ("the nervous system of your enterprise — instantly routing ITOM alerts to automated fixes"). International B2B SaaS, self-hosted on customer Kubernetes.

## Design source of truth
The folder **`design_handoff_synap/`** contains the design handoff:
- `README.md` — product overview, screen inventory, design tokens, interactions, state, data contract.
- `BUILD_PLAN.md` — the iterative build order with per-step prompts.
- `reference/*.jsx` + `styles.css` — the **working HTML prototype**. This is the **pixel + interaction spec**. Match it exactly; implement in our real stack.

**Always read `design_handoff_synap/README.md` before building UI.** When a design changes, the corresponding `reference/*.jsx` file is updated — treat it as the new spec.

## Stack
Vite + React 18 + TypeScript · React Router · CSS variables (OKLCH tokens from `styles.css`, light+dark) · TanStack Query for data · Zustand for cross-cutting UI state. Icons: port `icons.jsx` or use lucide-react.

## Conventions
- Keep the **OKLCH token layer** and `[data-theme="dark"]` theming from `styles.css`. Never hardcode colors in components — use tokens.
- The **AI gradient** (`--ai-grad`) and glow are reserved strictly for AI affordances (copilot, AI badges, "resolve with Synap").
- Fonts: Space Grotesk (display), Hanken Grotesk (UI), JetBrains Mono (IDs/telemetry).
- Centralize mock data as a typed module (port of `reference/data.jsx`) — it's the API contract until real endpoints exist.
- Every faked AI call (`setTimeout` in the prototype) gets a `// TODO: real API` seam.
- Keep a per-route error boundary (see `app.jsx`).
- Do **not** port `synap-tweaks.jsx` / `tweaks-panel.jsx` — those are prototype-only theming; build a real Settings page instead.

## Three hero flows (must always work end-to-end)
1. Zero-ticket self-service portal (`reference/portal.jsx`).
2. AI-assisted incident resolution with live telemetry (`reference/incidents.jsx`).
3. AIOps alert-storm correlation → remediation (`reference/aiops.jsx`).

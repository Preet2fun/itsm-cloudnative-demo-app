# Hearth — handoff contents

Everything the dev team needs, in one archive.

## Start here

1. `design_handoff_hearth/README.md` — product overview, screen inventory, design tokens
   (literal hex + OKLCH), interactions, state shape, mock-data contract.
2. `design_handoff_hearth/BUILD_PLAN.md` — eight iterations in build order, with a concrete
   prompt for each. Iterations 1–4 are built; 5–8 are specced.
3. `design_handoff_hearth/reference/index.html` — open directly in a browser (no build step)
   to click through login → 6-digit verify → dashboard, switch locations, and see the
   iteration stubs. Needs a network connection: React, Babel, and webfonts load from CDN.

## What's in the archive

| Path | What it is |
| --- | --- |
| `design_handoff_hearth/` | The handoff bundle — docs plus the framework-agnostic prototype |
| `design_handoff_hearth/reference/` | One file per screen, a token layer, mock data, inline SVG icons |
| `Hearth.dc.html` | The reviewable prototype used for design review. Composes the bound design system's own components; needs `_ds/` beside it to render |
| `_ds/design-system-f13b1973-4aad-41f0-b2b7-d87df36276fc/` | The Aurora design system — token CSS files and the component bundle |
| `github.md` | Association with `Preet2fun/itsm-cloudnative-demo-app` (the sibling ITSM platform, Synap) and a screen → source map |

The two prototypes are the same screens twice over, on purpose: `Hearth.dc.html` is the
design-review artifact and mounts the real design-system components; `reference/` is the
dependency-free version to read and port, with no design-system runtime required.

## Production stack

Vite + React 18 + TypeScript, React Router, TanStack Query (server state), Zustand
(session + selected location), CSS-variable tokens, inline SVG icons. Nothing beyond that
list is used or recommended.

## Two open decisions

1. **Sidebar nav rows are 32px**, the design system's own density, which sits against the
   tablet-at-the-counter use case. Raise as a design-system change rather than a local
   override if taller rows are wanted.
2. **No settings screen**, so store open/closed state is displayed in the location switcher
   but not editable anywhere, and "Pause online orders" on the dashboard is the product's
   only store-state control. Needs a call before iteration 8 closes.

## Not yet decided

The product name. `Hearth` is a working name — alternatives on the table are `Counterpane`
and `Mise`. It is a single `brandName` prop in the DC and a single `BRAND` constant in
`reference/mockData.js`, so renaming is a one-line change in each.

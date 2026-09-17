# Hearth — design handoff

Back-office console for restaurant groups. Operators (owners/managers) manage menus,
watch orders and deliveries, and reconcile payments across two or more physical
locations under one account. **Not** a diner-facing ordering product — there is no
browse-and-order consumer flow anywhere in this bundle.

- **Audience:** restaurant owners and managers. Non-technical, often on a tablet at a
  front counter between tasks.
- **Platform:** desktop-first, tablet-safe. Design target 1440; every layout reflows
  intact to 1024 and degrades gracefully to 768 (tables scroll horizontally, they do
  not become cards).
- **Density:** balanced. 44px minimum interactive height, 12px/16px table cell padding,
  14/20 body. Full column sets stay visible at 1024.
- **Visual system:** **Aurora** (`DesignSystem_f13b19`) — applied strictly, per decision
  in section "Decisions on record". Hearth is Synap's visual sibling.

## Sibling product

Hearth sits alongside **Synap**, the ITSM platform in `Preet2fun/itsm-cloudnative-demo-app`.
Same design system, same multi-tenant backend conventions, different audience and domain.

## Screen inventory

| # | Screen | Status in this bundle | Purpose |
|---|--------|----------------------|---------|
| 00 | Foundations + primitives | **Built** | Colors, type scale, buttons, inputs, badges, cards, empty state |
| 01 | Login + 6-digit verify | **Built** | Email/password -> MFA code -> authenticated |
| 02 | App shell | **Built** | Sidebar nav, location switcher, account block, sign-out |
| 03 | Dashboard | **Built** | Today's orders, deliveries in flight, payments snapshot, recent activity |
| 04 | Orders | Specced only | List (filter by status) + detail with line items, linked delivery and payment |
| 05 | Menu management | Specced only | Per-location item list, inline price edit, availability toggle |
| 06 | Deliveries | Specced only | List + detail, courier assignment, status tracking |
| 07 | Payments | Specced only | List + detail, reconciliation against orders |

Screens 04-07 are reachable in the prototype as labelled iteration stubs in the real
shell, so the navigation model is testable end to end. Build order and per-iteration
prompts are in `BUILD_PLAN.md`.

**No screens were added beyond the requested inventory.** Two things flagged rather than
built: (1) there is no settings/admin screen, so "pause online orders" on the dashboard is
the only store-state control in the product — confirm that is enough; (2) location
open/closed state is displayed in the switcher but has no screen that edits it.

## Fidelity note

The prototype is **interaction-complete, data-mocked**. Real: the full auth sequence
including per-digit code entry with focus advance and backspace, resend cooldown, error
states, location switching, and navigation. Mocked: all data (one tenant, three
locations), all network calls (450ms timeouts standing in for fetches), and search/⌘K,
which is rendered as an affordance only. Nothing persists across reload.

## Design tokens

Aurora ships hex. OKLCH equivalents are given because the production stack specifies
OKLCH tokens — they are conversions of the same colors, not a second palette. **The hex
values are canonical**; if the two ever disagree, the design system wins.

### Surfaces (dark, primary theme)

| Token | Hex | OKLCH |
|---|---|---|
| `--bg-canvas` | `#050810` | `oklch(0.132 0.021 271.5)` |
| `--bg-surface` | `#0B111C` | `oklch(0.182 0.021 268.9)` |
| `--bg-elevated` | `#141924` | `oklch(0.229 0.019 267.3)` |
| `--bg-inset` | `#030509` | `oklch(0.113 0.014 272.0)` |

### Text

| Token | Hex | OKLCH |
|---|---|---|
| `--text-primary` | `#F2F5FA` | `oklch(0.967 0.005 259.0)` |
| `--text-secondary` | `#8892A3` | `oklch(0.646 0.024 263.4)` |
| `--text-tertiary` | `#5C6675` | `oklch(0.484 0.024 263.8)` |
| `--text-disabled` | `#3E4653` | `oklch(0.359 0.021 265.2)` |
| `--text-inverse` | `#050810` | `oklch(0.132 0.021 271.5)` |

### Semantic

| Token | Hex | OKLCH | Soft fill |
|---|---|---|---|
| `--success` | `#22C55E` | `oklch(0.727 0.198 145.2)` | `rgba(34,197,94,0.12)` |
| `--info` | `#2AA5F5` | `oklch(0.694 0.153 248.6)` | `rgba(42,165,245,0.12)` |
| `--warning` | `#F5A524` | `oklch(0.782 0.157 71.4)` | `rgba(245,165,36,0.14)` |
| `--danger` | `#F5385E` | `oklch(0.630 0.230 15.6)` | `rgba(245,56,94,0.14)` |
| `--neutral` | `#8892A3` | `oklch(0.646 0.024 263.4)` | `rgba(136,146,163,0.12)` |

Spacing, radii, control heights, and layout widths are tokens too — `--space-1…24`,
`--radius-xs/sm/md/lg/full`, `--control-sm/md/lg`, `--row-h-compact/row-h/row-h-comfortable`,
`--sidebar-w` (240px), `--topbar-h` (56px), `--max-app` (1440px). Write the token, never the
literal; the reference layer in `reference/styles.css` mirrors the design system's names
exactly so the two stay swappable.

Motion: `--duration-fast` 120ms, `--duration-base` 180ms, `--duration-slow` 240ms on
`--ease-standard` `cubic-bezier(0.2, 0.8, 0.2, 1)`.

Borders: `--border-subtle` `rgba(255,255,255,0.06)`, `--border-default`
`rgba(255,255,255,0.10)`, `--border-strong` `rgba(255,255,255,0.18)`.
Focus ring: `#22E06B`, 2px, 2px offset, on every interactive element.

### Signature gradient

`linear-gradient(90deg, #22E06B 0%, #21D0C4 50%, #2AA5F5 100%)`

**At most one element per screen.** In Hearth that is the wordmark — the auth panel mark
and the sidebar mark. Never a background wash, never body text, never a table cell,
never a chart line.

### Type

| Role | Family | Size/LH | Weight | Tracking |
|---|---|---|---|---|
| Display lg | Space Grotesk | 40/44 | 700 | -0.025em |
| Display md | Space Grotesk | 32/36 | 600 | -0.02em |
| Heading lg | Space Grotesk | 24/30 | 600 | -0.015em |
| Heading sm | Space Grotesk | 16/22 | 600 | -0.005em |
| Body md | Inter Tight | 14/20 | 400 | — |
| Body sm | Inter Tight | 13/18 | 400 | — |
| Label | Inter Tight | 12/16 | 500 | 0.02em, uppercase |
| Mono md | JetBrains Mono | 13/18 | 400 | — |

Order IDs, ETAs, timestamps, and endpoint hints are mono. Every numeric cell uses
`font-variant-numeric: tabular-nums`. No italics in UI, no weights below 400 or above 700.

Sentence case everywhere. Numbers stay numeric ("3 alerts", never "three"). Never print a
bare `0` — write "None". Errors own the problem: "We couldn't sign you in with those
details", never "You have an error".

### Radii and spacing

Radii: 2 chips/badges, 4 inputs/buttons, 6 cards/panels, 8 dialogs. 4px spacing base;
16/20/24 card padding; 24px page gutters; 240px sidebar; 56px top bar; max 1440 content.

## Design-system components

Every primitive comes from the bound design system — nothing is re-created as raw HTML:
`Wordmark`, `Button`, `IconButton`, `Field`, `Input`, `Card`, `KpiTile`, `Table`,
`StatusBadge`, `Sidebar`, `TopBar`, `Breadcrumbs`, `EmptyState`, and `Icon`.

Two consequences of using them as shipped rather than restyling them:

- **Icons are `Icon` (Lucide, 1.5px on a 24px grid), never unicode glyphs or emoji.**
  The nav uses `gauge`, `receipt-text`, `book-open`, `truck`, `credit-card`; sign-out uses
  `power`; empty states use `inbox`.
- **Sidebar nav rows are the design system's 32px, not the 44px used elsewhere.** That is
  the component's own density. If tablet use argues for taller nav rows, raise it as a
  change to the design system rather than a local override here.

The location switcher is `TopBar`'s scope select, which is what that control is for. It is
labelled by the restaurant's own name — never "workspace", which is reserved for
tenant-level concepts elsewhere in this system.

## Interactions and motion

120/180/240ms on `cubic-bezier(0.2, 0.8, 0.2, 1)`. Hover, focus, disclosure, tabs,
tooltip, toast only. Dark mode elevates by background step, never shadow.

| Element | Behavior |
|---|---|
| Hover (row, nav, secondary button) | One background step up + `--border-default` -> `--border-strong` |
| Hover (solid button) | `filter: brightness(1.08)` — no scale, no press-shrink |
| Active nav / selected row | 2px `#22E06B` left rail + elevated fill |
| Focus | 2px `#22E06B` ring at 2px offset |
| Disabled | 45% opacity, `--text-disabled`, cursor default |
| Code input | Filled digit takes `--border-strong`; focus advances on entry, backspace on empty steps back |
| Resend | Disabled with live `Resend in {n}s` countdown, 30s cooldown |
| Submit in flight | Label swaps to `Sending code…` / `Verifying…`, button disabled |

`prefers-reduced-motion` is honored globally by the design system's `tokens/base.css`.

## Auth contract

Email + password, then a 6-digit emailed code. **No SSO, no tenant or workspace-slug
field, no account chooser.** The tenant is resolved server-side from the authenticated
user and is invisible to the UI.

1. `POST /api/v1/auth/login` `{email, password}` -> `{session_id}`
2. `POST /api/v1/auth/mfa/send` `{session_id}` -> fires on arrival at the verify screen,
   no visible step of its own
3. `POST /api/v1/auth/mfa/verify` `{session_id, code}` -> `{token}`; store the JWT and
   land on the dashboard

Verify screen carries a resend affordance on a 30s cooldown and a "use a different
account" link that returns to login and clears `session_id` and any entered code.
One practical role today: a single tenant-scoped `admin` per restaurant group. The
schema allows `agent` and `viewer`; nothing in this bundle branches on role.

Prototype shortcut: entering `000000` shows the invalid-code error state. Any other
complete code succeeds.

## State shape

```ts
type Session = { token: string | null; sessionId: string | null; email: string | null };
type UiState = { locationId: string; locationsOpen: boolean };

type Restaurant = { id: string; name: string; address: string; status: 'open' | 'closed' };
type MenuItem = { id: string; restaurantId: string; name: string; description: string;
                  price: number; category: string; available: boolean };
type Order = { id: string; restaurantId: string; lineItems: LineItem[];
               status: 'received' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
               total: number; placedAt: string };
type LineItem = { menuItemId: string; name: string; qty: number; unitPrice: number };
type Delivery = { id: string; orderId: string; status: 'pending' | 'on_route' | 'delivered' | 'delayed';
                  courierName: string | null; assignedAt: string | null; deliveredAt: string | null };
type Payment = { id: string; orderId: string; amount: number;
                 status: 'paid' | 'pending' | 'failed'; method: string; processedAt: string };
```

Ownership: `Session` in Zustand (persisted), `UiState` in Zustand (not persisted),
every entity list in TanStack Query keyed `[entity, locationId]` so switching location
refetches rather than filtering client-side. Deliveries and payments are 1:1 with orders.

## Mock-data contract

One tenant, **Northside Hospitality**, three locations: Northside Trattoria (open),
Harbourline Kitchen (open), Eastgate Counter (closed). Admin user Rosa Medina,
`rosa@northsidehospitality.com`. Orders `#ORD-48xx`. Dashboard figures — 218 orders,
$6,420 net, 7 in flight, 3 failed payments totalling $142 — are internally consistent
with the order and payment fixtures. Relative timestamps are computed from load time so
"2m ago" stays true.

## Files in this bundle

| Path | What it is |
|---|---|
| `README.md` | This file |
| `BUILD_PLAN.md` | Iteration-by-iteration build order with a prompt per iteration |
| `reference/index.html` | Entry point — open directly in a browser, loads everything via Babel |
| `reference/styles.css` | Token layer: CSS variables, resets, focus ring, keyframes |
| `reference/mockData.js` | Centralized fixtures — the single source for all screen data |
| `reference/icons.jsx` | Inline SVG icon set, 1.5px stroke on a 24px grid |
| `reference/Login.jsx` | Screens 01 + 01b — login and 6-digit verify |
| `reference/AppShell.jsx` | Screen 02 — sidebar, location switcher, top bar, stubs |
| `reference/Dashboard.jsx` | Screen 03 |
| `reference/Foundations.jsx` | Screen 00 |
| `reference/app.jsx` | Root router and session state |
| `../Hearth.dc.html` | The reviewable prototype in this workspace (same screens, same data) |

## Production stack

Vite + React 18 + TypeScript, React Router, TanStack Query for server state, Zustand for
session and location state, CSS-variable tokens, inline SVG icons. No icon font, no emoji
as UI icons. **No dependencies beyond that list are used or recommended.** Dark theme is
what Aurora leads with and what this bundle implements; Aurora also ships a light theme at
parity via `[data-theme="light"]` if a light default is wanted later.

## Decisions on record

1. **Aurora applied strictly.** The brief proposed a "warm editorial hospitality"
   direction — cream surfaces, terracotta accent, serif display. That was overridden in
   favor of the bound design system, so Hearth reads as Synap's sibling. The warm
   direction is recoverable: it would mean replacing the token layer and the two font
   families, and nothing in the component anatomy.
2. **Fraunces/Public Sans not used.** That pairing was chosen for the warm direction; it
   is incompatible with decision 1. Aurora's Space Grotesk / Inter Tight / JetBrains Mono
   stands.
3. **Working name "Hearth" retained** pending the alternatives proposed separately. It is
   a single `brandName` prop in the prototype and a single constant in the reference —
   renaming is a one-line change in both.

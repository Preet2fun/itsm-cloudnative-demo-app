# Hearth — build plan

Eight iterations. Each is independently shippable and reviewable. Iterations 1-4 are
built in `reference/`; 5-8 are specced here and appear as labelled stubs in the shell.

Standing rules for every iteration: Aurora tokens only (no invented colors, type, or
spacing); sentence case; 44px minimum interactive height; desktop-first, intact at 1024;
one gradient element per screen maximum; focus ring on every interactive element; no
emoji, no icon fonts; tables stay tables and scroll horizontally rather than reflowing
into cards.

---

## Iteration 1 — Foundations and tokens (screen 00)

**Done when:** every token is expressed as a CSS variable, and a specimen screen renders
the full palette, type scale, and primitive set.

> Build the token layer and primitive specimen for Hearth, a restaurant back-office
> console on the Aurora design system. Write `styles.css` with CSS variables for the dark
> surface ramp (canvas #050810, surface #0B111C, elevated #141924, inset #030509), four
> text steps, five semantic roles each with a strong and soft variant, three border
> alphas, and the signature gradient. Load Space Grotesk, Inter Tight, and JetBrains Mono.
> Set a global 2px #22E06B focus ring at 2px offset and honor prefers-reduced-motion.
> Then build a Foundations screen showing color swatches with hex labels, the type scale
> from display 40/44 down to mono 13/18, button variants (primary solid, secondary
> outline, ghost, disabled at 45% opacity), a text input, the six order/payment status
> badges, and one empty state with a heading, explanatory line, and single action.
> Radii: 2 badges, 4 inputs and buttons, 6 cards.

## Iteration 2 — Login + 6-digit verify (screens 01, 01b) — **current priority**

**Done when:** the full auth sequence runs end to end against mocks, including every
error and cooldown state.

> Build the Hearth auth flow as two screens sharing a split layout: left panel with the
> gradient wordmark, a 40/44 Space Grotesk headline, a supporting line, and three small
> stat cards; right panel holding the active form at max-width 380.
>
> Login: email and password fields with uppercase 12px labels, a primary Continue button,
> and a Forgot password link. Submitting calls POST /api/v1/auth/login with {email,
> password}, receives {session_id}, then immediately fires POST /api/v1/auth/mfa/send with
> {session_id} and advances to verify with no visible intermediate step. While in flight
> the button reads "Sending code…" and is disabled. On failure show an inline danger-soft
> error: "We couldn't sign you in with those details. Check the email and password and try
> again."
>
> Verify: six single-character inputs, 56px tall, centered 22px JetBrains Mono, in a flex
> row with 8px gaps. Typing a digit advances focus; backspace on an empty input steps back;
> non-numeric input is rejected. A filled input takes --border-strong. The submit button is
> disabled until all six are filled, then reads "Verify and sign in" and calls POST
> /api/v1/auth/mfa/verify with {session_id, code}; on success store the returned JWT and go
> to the dashboard. On rejection show "That code didn't match. 2 attempts left before we
> send a new one." and tint the inputs' borders danger. Below a subtle divider: "Didn't get
> it?" with a resend control disabled on a 30s cooldown counting down live as "Resend in
> 28s", and a "Use a different account" link that clears session_id and entered code and
> returns to login.
>
> No SSO buttons. No tenant, workspace, or account-slug field anywhere. The tenant is
> resolved server-side.

## Iteration 3 — App shell (screen 02)

**Done when:** the shell hosts any screen, and switching location refetches that screen's
data.

> Build the Hearth app shell: a 240px sidebar and 56px top bar in a CSS grid with
> minmax(0,1fr) content so wide tables cannot blow out the layout.
>
> Sidebar top to bottom: gradient wordmark in a 56px header; a Location block with an
> uppercase label and a 44px switcher button showing a status dot and the current
> restaurant name, opening a small panel listing all three locations with their
> open/closed status; an "Operate" nav group with Dashboard, Orders, Menu, Deliveries,
> Payments, each 44px with a 2px #22E06B left rail and elevated fill when active; and a
> bottom account block with initials, name, role, and an icon-only sign-out button
> carrying an aria-label.
>
> Top bar: a mono breadcrumb reading tenant › location › screen, and a search affordance
> with a ⌘K hint. Call it "Location", never "workspace" — that word is reserved for
> tenant-level concepts elsewhere in this system. Selected location lives in Zustand and
> is part of every TanStack Query key.

## Iteration 4 — Dashboard (screen 03)

**Done when:** every figure traces to the mock fixtures and reflows intact at 1024.

> Build the Hearth dashboard inside the shell. Header: uppercase date label, a 32/36
> "Good afternoon, Rosa" greeting, and right-aligned Today and "Pause online orders"
> buttons. Then a row of four KPI cards — orders today 218, net sales $6,420, in flight 7,
> failed payments 3 — each with an uppercase label, a 32/36 tabular figure, and a
> semantically colored delta line. Then a two-column region that collapses to one at
> 1024: left, an "Orders in progress" table with columns Order, Items, Total, Status,
> Placed, mono order IDs, status badges, 12px/16px cell padding, and horizontal scroll
> below 1024; right, a stack of three cards — deliveries in flight with courier, order ID,
> ETA and status badge; payments today split paid/pending/failed with a reconciliation
> count; and recent activity as timestamp-plus-event rows. Every number tabular. No bare
> zeros — write "None".

---

## Iteration 5 — Orders (screen 05 in the inventory)

**Done when:** an operator can find any order by status and see its delivery and payment
without leaving the detail view.

> Build Orders as list plus detail. List: status filter chips (All, Received, Preparing,
> Out for delivery, Delivered, Cancelled) with counts, a table of order ID, items summary,
> total, status, placed time, and a sticky header. Detail: a slide-in panel or route
> showing line items with quantity and unit price, an order total, a status timeline
> across the five states, and two linked cards — the 1:1 delivery with courier and
> timestamps, and the 1:1 payment with amount, method, and status. Actions: advance
> status, cancel order. Scope every query to the selected location.

## Iteration 6 — Menu management (screen 04 in the inventory)

**Done when:** an operator can toggle an item unavailable in one tap and see it reflected
immediately.

> Build Menu management for the selected location: items grouped by category, each row
> showing name, description, price, and an availability toggle at least 44px in its hit
> area that writes through optimistically and rolls back on failure. Inline price editing
> on click. An "Add item" action opening a form with name, description, price, category,
> and availability. Empty state per category. Items belong to one restaurant — never show
> another location's menu.

## Iteration 7 — Deliveries (screen 06)

**Done when:** every in-flight delivery's state and courier are visible at a glance, and
late ones are obvious.

> Build Deliveries as list plus detail, 1:1 with orders. List: courier name or
> "Unassigned", linked order ID, status (pending, on route, delivered, delayed), ETA, and
> elapsed time, with delayed rows carrying a warning badge. Detail: status timeline with
> assigned and delivered timestamps, courier contact if present, the linked order summary,
> and an assign-courier action for pending deliveries.

## Iteration 8 — Payments and reconciliation (screen 07)

**Done when:** the reconciliation queue can be driven to zero.

> Build Payments as list plus reconciliation detail. List: payment ID, linked order ID,
> amount, method, status (paid, pending, failed), processed time, with a filter for
> unreconciled. Detail: the payment beside its 1:1 order with a clear match-or-mismatch
> verdict on the amounts, a retry action for failed captures, and a mark-reconciled
> action. Surface the daily totals — paid, pending capture, failed — so they tie back to
> the dashboard's payments card.

---

## Not in scope

No staff/roles management, no analytics or reporting module, no settings/admin screen.
Two gaps this creates, flagged rather than filled: store open/closed state is displayed
but not editable anywhere, and "pause online orders" on the dashboard is the product's
only store-state control. Both need a decision before iteration 8 closes.

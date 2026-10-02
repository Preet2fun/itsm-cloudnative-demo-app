# Hearth — Dashboard + Copilot spec

Source of truth for this screen: `../Hearth Dashboard.dc.html` (open it beside `_ds/`).
It replaces screen 03 in README.md. Everything here is mocked; nothing is wired to real data.

## What it's for

This is the first screen a tenant owner/manager sees after login. It answers one question:
**"What is happening in my restaurant business, why, and what should I do about it?"**
Copilot behaves like a business operations analyst, not a support bot. It is scoped to the
selected location and reads orders, menu, deliveries, and payments.

## Layout (one screen, no tabs)

- **TopBar.** Wordmark, location switcher (scope select), "Ask/Hide Copilot" toggle, user name, sign out.
- **Sidebar.** Dashboard, Orders, Menu, Deliveries, Payments.
- **Main column, scrolls independently.**
  1. Greeting: "Good afternoon, Rosa" plus "Here's how {location} is doing today."
  2. **AI business brief** card. It has a one-line verdict and three tiles: Sales, Needs attention, Insight. A "Suggested" row of actions below them opens Copilot with that question pre-asked.
  3. Four KPI tiles with 7-day sparklines: orders, net sales, avg delivery time, failed payments.
  4. Orders in progress (Table) beside Deliveries in flight and Top items today.
- **Copilot panel, right side.** Width `clamp(320px, 30vw, 400px)`. Starts collapsed below a 1200px viewport. The thread scrolls independently and the input is pinned to the bottom.

## Copilot behavior

- **Empty state.** One line explaining what Copilot reads, then 10 starter questions. Each shows an area label and a Lucide icon (no emoji):
  performance, revenue, orders, payments, delivery, menu, trends, anomalies, recommendations, forecasting.
- **Answer anatomy.** In order:
  1. Lead sentence that answers the question.
  2. Supporting blocks.
  3. Optional follow-up question.
  4. Action buttons.
  5. Quick-reply chips. These appear on the latest answer only.
- **Block types.**
  - `compare`: label, from → to, colored by tone.
  - `bars`: share or ranking bars on `--viz-1`.
  - `spark`: Sparkline plus 3 stats.
  - `list`: numbered steps, or `!` for anomalies.
  - `approval`: see below.
- **Correct the premise.** If the user's question assumes something the data contradicts (e.g. "why are sales lower" when they're up 8.1%), say so first, then point to the real dip.
- **Act requires approval.** Copilot never changes anything on its own. It shows an approval card listing the exact changes, with "Approve changes" and "Not now" buttons. After the user decides, the card shows who approved and when. The next message confirms what changed, and Undo stays available.
- **Free-text questions.** Anything not in the starter list goes to the LLM with today's location data as context. The prompt asks for under 80 words, plain text: lead with the answer, then the why, then one next step, and say what data is missing when it can't answer. If the call fails, show "We couldn't reach the analysis service…" and point the user back to the starter questions.
- **Pending state.** Show an icon plus a status line ("Reading orders, menu, and payments…").

## Reference conversation (delivery delays)

Owner: "Why are deliveries delayed?" → Copilot says delays clustered 12:30–1:30 PM. 17 orders
came in, 32% above normal, and prep time rose 14 → 21 min. It offers to break that down by item.
→ "Yes" → Margherita + Lasagne make up 61% of delayed orders. Lasagne prep rose 18 → 27 min.
Actions shown: View affected orders, Analyze kitchen performance.
→ "What should I do about it?" → Copilot recommends a second lasagne tray at 11:30 and quoting 38 min for lunch delivery.
→ "Go ahead and make those changes" → approval card → Approve → confirmation message.

The full mock script (all 10 starter flows and their follow-ups) is the `SCRIPT` object in
the DC's logic class. Treat it as the content and tone spec for real responses.

## Data the backend must expose to Copilot (per location, per day)

- **Orders.** Count, revenue, avg basket, and per-daypart breakdown, plus the same day last week.
- **Order prep time.** Per order and per item. Station load where available.
- **Deliveries.** Status, ETA vs actual, courier.
- **Payments.** Status, failure reason, method, and whether a retry is safe.
- **Menu.** Items, availability changes with timestamps, revenue per item.
- **History.** 30-day daily sales. Forecast inputs: last 12 weekends, pre-orders, weather.
- **Writable actions, all behind approval.** Prep-list entries, delivery quote windows, payment capture retry, menu availability.

## Not built yet

- Undo after an approved change.
- "View affected orders" and "View all payments".
- Real data and real LLM tool-calls.

Conversation history isn't persisted, and a new thread clears it.

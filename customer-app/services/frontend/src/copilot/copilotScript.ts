// src/copilot/copilotScript.ts
//
// Typed port of Hearth Dashboard.dc.html's SCRIPT object (lines 320-458),
// PROMPTS array (lines 305-316), and SPARK_30 data (line 318). Per
// DASHBOARD_COPILOT.md: "Treat it as the content and tone spec for real
// responses" — content is ported verbatim, not reworded.

import type { IconName } from '@/components/Icon'

export type Tone = 'up' | 'down' | 'neutral'

export interface CompareRow {
  label: string
  from: string
  to: string
  tone: Tone
}

export interface BarsRow {
  label: string
  value: string
  pct: number
}

export interface ListRow {
  mark: string
  label: string
}

export interface ApprovalRow {
  mark: string
  label: string
}

export type AnswerBlockData =
  | { type: 'compare'; title?: string; rows: CompareRow[] }
  | { type: 'bars'; title?: string; rows: BarsRow[] }
  | { type: 'spark'; title?: string; values: number[]; stats: { label: string; value: string }[] }
  | { type: 'list'; title?: string; rows: ListRow[] }
  | { type: 'approval'; title?: string; rows: ApprovalRow[] }

export interface ScriptAction {
  label: string
  next: string | null
}

export interface ScriptReply {
  label: string
  next: string
}

export interface ScriptEntry {
  stage: 'Ask' | 'Understand' | 'Explain' | 'Recommend' | 'Act'
  p: string[]
  p2?: string
  blocks?: AnswerBlockData[]
  actions?: ScriptAction[]
  replies?: ScriptReply[]
}

export interface PromptDef {
  key: string
  area: string
  question: string
  icon: IconName
}

export const PROMPTS: PromptDef[] = [
  { key: 'performance', area: 'Business performance', question: 'How is my business performing today?', icon: 'activity' },
  { key: 'revenue', area: 'Revenue', question: 'Why are sales lower than last Thursday?', icon: 'banknote' },
  { key: 'orders', area: 'Orders', question: 'Why did order volume drop during lunch?', icon: 'receipt-text' },
  { key: 'payments', area: 'Payments', question: 'Why have failed payments increased today?', icon: 'credit-card' },
  { key: 'delivery', area: 'Delivery', question: 'Why are deliveries taking longer today?', icon: 'truck' },
  { key: 'menu', area: 'Menu performance', question: 'Which menu items generate the most revenue?', icon: 'book-open' },
  { key: 'trends', area: 'Trends', question: 'Show me the sales trend for the last 30 days.', icon: 'line-chart' },
  { key: 'anomalies', area: 'Anomalies', question: 'Anything unusual happening today?', icon: 'search' },
  { key: 'focus', area: 'Recommendations', question: 'What should I focus on today?', icon: 'lightbulb' },
  { key: 'forecast', area: 'Forecasting', question: 'What order volume should I expect this weekend?', icon: 'calendar-clock' },
]

export const SPARK_30: number[] = [
  5120, 4890, 5300, 5610, 6980, 8420, 6110, 3410, 4720, 5050, 5480, 5900, 7210, 8940, 6400, 3720, 4980, 5160, 5390,
  6020, 7350, 8610, 6230, 3890, 5010, 5310, 5640, 5939, 7480, 6420,
]

export const SCRIPT: Record<string, ScriptEntry> = {
  performance: {
    stage: 'Understand',
    p: [
      'Business is performing well today. Sales and order volume are both ahead of last Thursday; the two weak spots are lunch delivery times and three failed payments.',
    ],
    blocks: [
      {
        type: 'compare',
        title: 'Today vs last Thursday',
        rows: [
          { label: 'Net sales', from: '$5,939', to: '$6,420', tone: 'up' },
          { label: 'Orders', from: '204', to: '218', tone: 'up' },
          { label: 'Avg basket', from: '$29.11', to: '$29.45', tone: 'up' },
          { label: 'Avg delivery time', from: '31 min', to: '38 min', tone: 'down' },
        ],
      },
    ],
    replies: [
      { label: 'Why are deliveries slower?', next: 'delivery' },
      { label: 'What should I focus on?', next: 'focus' },
    ],
  },
  revenue: {
    stage: 'Explain',
    p: [
      "Sales aren't lower — they're 8.1% higher than last Thursday ($6,420 vs $5,939).",
      "The one soft window was 3:00–5:00 PM, down 18%, which matches last Thursday's pattern after the lunch rush. Dinner pre-orders are already 11% ahead.",
    ],
    blocks: [
      {
        type: 'compare',
        title: 'By daypart',
        rows: [
          { label: 'Lunch 11:30–2:30', from: '$2,310', to: '$2,590', tone: 'up' },
          { label: 'Afternoon 3:00–5:00', from: '$640', to: '$525', tone: 'down' },
          { label: 'Dinner so far', from: '$2,989', to: '$3,305', tone: 'up' },
        ],
      },
    ],
    replies: [
      { label: 'Show the 30-day trend', next: 'trends' },
      { label: 'Which items drove it?', next: 'menu' },
    ],
  },
  orders: {
    stage: 'Explain',
    p: [
      "Lunch volume didn't drop overall — it rose 12%. There was a 25-minute dip from 11:45 to 12:10 when online orders fell to 2.",
      'That window lines up with Margherita being marked unavailable at Eastgate Counter, which pushed its online menu below the 3-item minimum and hid the store from delivery apps.',
    ],
    blocks: [
      {
        type: 'list',
        title: 'Timeline',
        rows: [
          { mark: '11:44', label: 'Margherita marked unavailable at Eastgate Counter' },
          { mark: '11:45', label: 'Online orders paused automatically' },
          { mark: '12:10', label: 'Margherita restored, orders resumed' },
        ],
      },
    ],
    replies: [{ label: 'How do I stop that happening?', next: 'focus' }],
  },
  payments: {
    stage: 'Explain',
    p: ['3 payments failed today for $142 in total — about 3× your usual Thursday rate. Two have the same cause.'],
    blocks: [
      {
        type: 'list',
        title: 'Failed payments',
        rows: [
          { mark: '$57.50', label: '#ORD-4819 · processor timeout at 12:41 · safe to retry' },
          { mark: '$66.50', label: '#ORD-4806 · card declined · Visa ···3302' },
          { mark: '$18.00', label: '#ORD-4817 · same Visa ···3302 · order cancelled' },
        ],
      },
    ],
    actions: [
      { label: 'Retry #ORD-4819 capture', next: 'payments_act' },
      { label: 'View all payments', next: null },
    ],
    replies: [{ label: 'Why the same card twice?', next: 'payments_card' }],
  },
  payments_card: {
    stage: 'Explain',
    p: [
      'Visa ···3302 belongs to a returning customer with 14 past orders. Both declines returned "insufficient funds", so this is the card, not your setup.',
      "I wouldn't block the card. Asking the customer to update their payment method usually recovers it.",
    ],
    replies: [{ label: 'Retry the timeout payment', next: 'payments_act' }],
  },
  payments_act: {
    stage: 'Act',
    p: ["I can retry the capture for #ORD-4819. The processor timeout means the customer was never charged, so a retry won't double-bill."],
    blocks: [
      {
        type: 'approval',
        title: 'Proposed change',
        rows: [{ mark: '1', label: 'Retry capture of $57.50 for #ORD-4819 (Mastercard ···1180)' }],
      },
    ],
  },
  delivery: {
    stage: 'Explain',
    p: [
      'Most delays happened between 12:30 and 1:30 PM.',
      '17 orders were placed in that hour, 32% above your normal Thursday lunch volume. The largest contributor was preparation time, not courier travel.',
    ],
    blocks: [
      {
        type: 'compare',
        title: '12:30–1:30 PM vs usual',
        rows: [
          { label: 'Orders placed', from: '13', to: '17', tone: 'down' },
          { label: 'Prep time', from: '14 min', to: '21 min', tone: 'down' },
          { label: 'Courier travel', from: '15 min', to: '16 min', tone: 'neutral' },
        ],
      },
    ],
    p2: 'Want me to identify which menu items contributed most to the longer prep time?',
    replies: [
      { label: 'Yes', next: 'delivery_items' },
      { label: 'No, thanks', next: 'ack' },
    ],
  },
  delivery_items: {
    stage: 'Explain',
    p: [
      "Margherita and Lasagne accounted for 61% of delayed orders. Lasagne had the largest prep-time increase: 18 min → 27 min, because it's baked to order once the morning tray runs out.",
    ],
    blocks: [
      {
        type: 'bars',
        title: 'Share of delayed orders',
        rows: [
          { label: 'Margherita', value: '34%', pct: 34 },
          { label: 'Lasagne', value: '27%', pct: 27 },
          { label: 'Carbonara', value: '14%', pct: 14 },
          { label: 'Other', value: '25%', pct: 25 },
        ],
      },
    ],
    actions: [
      { label: 'View affected orders', next: null },
      { label: 'Analyze kitchen performance', next: 'kitchen' },
    ],
    replies: [{ label: 'What should I do about it?', next: 'delivery_recommend' }],
  },
  kitchen: {
    stage: 'Understand',
    p: ['Your oven station hit capacity at 12:40 — 9 pizzas and 4 lasagne trays were queued at once. Prep and pass stations stayed under 70% load.'],
    blocks: [
      {
        type: 'compare',
        title: 'Peak station load',
        rows: [
          { label: 'Oven', from: '78%', to: '100%', tone: 'down' },
          { label: 'Prep', from: '55%', to: '64%', tone: 'neutral' },
          { label: 'Pass', from: '48%', to: '61%', tone: 'neutral' },
        ],
      },
    ],
    replies: [{ label: 'What should I do about it?', next: 'delivery_recommend' }],
  },
  delivery_recommend: {
    stage: 'Recommend',
    p: ["Two changes would have recovered most of today's delay:"],
    blocks: [
      {
        type: 'list',
        rows: [
          {
            mark: '1',
            label:
              'Bake a second lasagne tray at 11:30 on weekdays. It frees the oven for pizzas at peak and would have saved about 9 minutes per delayed order.',
          },
          {
            mark: '2',
            label:
              "Quote 38 min for delivery between 12:15 and 1:45 PM instead of 30 min, so customers aren't told an ETA you can't hit.",
          },
        ],
      },
    ],
    p2: 'Estimated effect: on-time deliveries at lunch from 71% to 90%.',
    replies: [
      { label: 'Go ahead and make those changes', next: 'delivery_act' },
      { label: 'Just the first one', next: 'delivery_act_one' },
    ],
  },
  delivery_act: {
    stage: 'Act',
    p: ["Here's exactly what I'll change. Nothing is applied until you approve."],
    blocks: [
      {
        type: 'approval',
        title: 'Proposed changes',
        rows: [
          { mark: '1', label: 'Add "Lasagne tray #2 — 11:30" to the weekday prep list' },
          { mark: '2', label: 'Set lunch delivery quote to 38 min, 12:15–1:45 PM, Mon–Fri' },
        ],
      },
    ],
  },
  delivery_act_one: {
    stage: 'Act',
    p: ['Just the prep change, then. Nothing is applied until you approve.'],
    blocks: [
      {
        type: 'approval',
        title: 'Proposed change',
        rows: [{ mark: '1', label: 'Add "Lasagne tray #2 — 11:30" to the weekday prep list' }],
      },
    ],
  },
  menu: {
    stage: 'Understand',
    p: [
      "Margherita is your top earner today at $1,148, followed by Lasagne. Together they're 32% of today's sales.",
      "Tiramisu is worth a look: it's in only 6% of orders but attaches to 1 in 3 pasta orders when it's offered at checkout.",
    ],
    blocks: [
      {
        type: 'bars',
        title: 'Revenue today',
        rows: [
          { label: 'Margherita', value: '$1,148', pct: 100 },
          { label: 'Lasagne', value: '$912', pct: 79 },
          { label: 'Carbonara', value: '$703', pct: 61 },
          { label: 'Calzone', value: '$495', pct: 43 },
          { label: 'Tiramisu', value: '$288', pct: 25 },
        ],
      },
    ],
    replies: [{ label: 'How do I sell more tiramisu?', next: 'focus' }],
  },
  trends: {
    stage: 'Understand',
    p: ['Sales are up 6% over the last 30 days. Your week has a steady shape: Saturdays peak, Mondays are your quietest day.'],
    blocks: [
      {
        type: 'spark',
        title: 'Net sales · last 30 days',
        values: SPARK_30,
        stats: [
          { label: 'Daily avg', value: '$5,880' },
          { label: 'Best day', value: '$8,940 Sat' },
          { label: 'Quietest', value: '$3,410 Mon' },
        ],
      },
    ],
    replies: [{ label: 'What about this weekend?', next: 'forecast' }],
  },
  anomalies: {
    stage: 'Understand',
    p: ['Three things are outside your normal range today:'],
    blocks: [
      {
        type: 'list',
        rows: [
          { mark: '!', label: 'Lunch prep time ran 7 minutes above your Thursday average.' },
          { mark: '!', label: 'Failed payments are 3× your usual rate — 2 of 3 from one card.' },
          { mark: '!', label: 'Eastgate Counter received 4 online orders while marked closed.' },
        ],
      },
    ],
    replies: [
      { label: 'Why did Eastgate get orders?', next: 'eastgate' },
      { label: 'Explain the prep delay', next: 'delivery' },
    ],
  },
  eastgate: {
    stage: 'Explain',
    p: [
      "Eastgate Counter's hours were updated to closed on Thursdays, but the delivery-app listing still shows the old hours. The 4 orders were auto-rejected and refunded, so no customer was charged.",
    ],
    actions: [{ label: 'Review Eastgate hours', next: null }],
  },
  focus: {
    stage: 'Recommend',
    p: ['Three things, in order of impact:'],
    blocks: [
      {
        type: 'list',
        rows: [
          { mark: '1', label: "Fix lunch prep — a second lasagne tray at 11:30 addresses most of today's late deliveries." },
          { mark: '2', label: "Retry the $57.50 timeout payment on #ORD-4819. It's recoverable today." },
          { mark: '3', label: 'Offer tiramisu at checkout on pasta orders. Likely +$180 a day.' },
        ],
      },
    ],
    replies: [
      { label: 'Start with the prep change', next: 'delivery_recommend' },
      { label: 'Retry the payment', next: 'payments_act' },
    ],
  },
  forecast: {
    stage: 'Recommend',
    p: [
      "Expect about 820 orders across the weekend, 7% above last weekend, with Saturday the busiest day. Saturday dinner is where you're most likely to run short.",
    ],
    blocks: [
      {
        type: 'bars',
        title: 'Forecast orders',
        rows: [
          { label: 'Friday', value: '262 (240–285)', pct: 82 },
          { label: 'Saturday', value: '318 (290–345)', pct: 100 },
          { label: 'Sunday', value: '241 (220–265)', pct: 76 },
        ],
      },
    ],
    p2: "I'd add one courier for Saturday 6:00–9:00 PM.",
    replies: [{ label: 'How confident is that?', next: 'forecast_conf' }],
  },
  forecast_conf: {
    stage: 'Explain',
    p: [
      "Reasonably. It's based on your last 12 weekends, current pre-orders, and the local weather forecast. Over the past 8 weekends the forecast landed within ±9% each time.",
    ],
  },
  ack: {
    stage: 'Understand',
    p: ["No problem. I'll flag it if lunch delays continue tomorrow."],
  },
}

// src/lib/mockDashboardData.ts
//
// Fixed mock data for the Dashboard + AI Copilot screen, ported verbatim
// from `customer-app/design_handoff/Hearth Dashboard.dc.html`'s
// renderVals(). Per DASHBOARD_COPILOT.md: "Everything here is mocked;
// nothing is wired to real data" — this is the whole data layer for now.

import type { StatusTone } from '@/components/StatusBadge'

export interface KpiDatum {
  label: string
  value: string
  delta: string
  tone: 'up' | 'down'
  trend: number[]
}

export const KPIS: KpiDatum[] = [
  { label: 'Orders today', value: '218', delta: '+14', tone: 'up', trend: [168, 182, 175, 204, 196, 211, 218] },
  { label: 'Net sales', value: '$6,420', delta: '+8.1%', tone: 'up', trend: [5120, 5480, 5300, 5939, 5760, 6100, 6420] },
  { label: 'Avg delivery', value: '38m', delta: '+7m', tone: 'down', trend: [30, 31, 29, 31, 32, 34, 38] },
  { label: 'Failed payments', value: '3', delta: '$142', tone: 'down', trend: [1, 0, 1, 1, 0, 1, 3] },
]

export interface OrderRow {
  id: string
  items: string
  total: string
  status: string
  tone: StatusTone
  placed: string
}

const RAW_ORDER_ROWS: [string, string, string, string, StatusTone, string][] = [
  ['#ORD-4821', '2 × Margherita, Garlic knots', '$34.20', 'Preparing', 'info', '2m ago'],
  ['#ORD-4820', 'Carbonara, House red', '$41.00', 'Out for delivery', 'warning', '9m ago'],
  ['#ORD-4819', 'Lasagne ×3', '$57.50', 'Received', 'neutral', '11m ago'],
  ['#ORD-4818', 'Calzone, Tiramisu', '$28.75', 'Delivered', 'success', '24m ago'],
  ['#ORD-4817', 'Focaccia board', '$18.00', 'Cancelled', 'danger', '38m ago'],
]

export const ORDER_ROWS: OrderRow[] = RAW_ORDER_ROWS.map(([id, items, total, status, tone, placed]) => ({
  id,
  items,
  total,
  status,
  tone,
  placed,
}))

export interface Delivery {
  courier: string
  meta: string
  status: string
  tone: StatusTone
}

export const DELIVERIES: Delivery[] = [
  { courier: 'Dani Okafor', meta: '#ORD-4820 · ETA 12 min', status: 'On route', tone: 'info' },
  { courier: 'Sam Whitfield', meta: '#ORD-4814 · 6 min late', status: 'Delayed', tone: 'warning' },
  { courier: 'Lee Brandt', meta: '#ORD-4812 · 3 min late', status: 'Delayed', tone: 'warning' },
]

export interface TopItem {
  label: string
  value: string
  pct: number
}

export const TOP_ITEMS: TopItem[] = [
  { label: 'Margherita', value: '$1,148', pct: 100 },
  { label: 'Lasagne', value: '$912', pct: 79 },
  { label: 'Carbonara', value: '$703', pct: 61 },
  { label: 'Calzone', value: '$495', pct: 43 },
  { label: 'Tiramisu', value: '$288', pct: 25 },
]

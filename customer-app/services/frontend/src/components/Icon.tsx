// src/components/Icon.tsx
//
// Thin wrapper over lucide-react, exposing only the icon names this app
// actually uses (matching the design handoff's icon-name strings verbatim).
// Every usage on Hearth's screens is decorative — interactive controls get
// their accessible name from the surrounding Button/IconButton, never the
// icon itself — so this always renders aria-hidden.

import {
  Activity,
  ArrowUp,
  Banknote,
  BookOpen,
  CalendarClock,
  ChevronDown,
  CreditCard,
  Gauge,
  Lightbulb,
  LineChart,
  Loader,
  PanelRightClose,
  Power,
  ReceiptText,
  Search,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Truck,
} from 'lucide-react'

const ICONS = {
  activity: Activity,
  'arrow-up': ArrowUp,
  banknote: Banknote,
  'book-open': BookOpen,
  'calendar-clock': CalendarClock,
  'chevron-down': ChevronDown,
  'credit-card': CreditCard,
  gauge: Gauge,
  lightbulb: Lightbulb,
  'line-chart': LineChart,
  loader: Loader,
  'panel-right-close': PanelRightClose,
  power: Power,
  'receipt-text': ReceiptText,
  search: Search,
  sparkles: Sparkles,
  'trending-up': TrendingUp,
  'triangle-alert': TriangleAlert,
  truck: Truck,
} as const

export type IconName = keyof typeof ICONS

interface IconProps {
  name: IconName
  size?: number
}

export default function Icon({ name, size = 16 }: IconProps) {
  const Component = ICONS[name]
  return <Component size={size} strokeWidth={1.5} aria-hidden="true" focusable={false} />
}

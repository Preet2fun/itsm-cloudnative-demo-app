import type { ReactNode } from 'react'

export type Severity = 'critical' | 'high' | 'medium' | 'warn' | 'low' | 'ok' | 'info'

const SEV_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  warn: 'Warning',
  low: 'Low',
  ok: 'OK',
  info: 'Info',
}

interface BadgeProps {
  children?: ReactNode
  variant?: 'default' | 'ai' | 'ghost'
  className?: string
  style?: React.CSSProperties
}

interface SevBadgeProps {
  sev: Severity
  children?: ReactNode
}

export function Badge({ children, variant = 'default', className = '', style }: BadgeProps) {
  const cls = ['badge', variant !== 'default' ? variant : '', className].filter(Boolean).join(' ')
  return <span className={cls} style={style}>{children}</span>
}

export function SevBadge({ sev, children }: SevBadgeProps) {
  return (
    <span className={`badge sev-${sev}`}>
      <span className="dot" />
      {children ?? SEV_LABELS[sev]}
    </span>
  )
}

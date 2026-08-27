import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { Sparkline } from './Sparkline'

interface StatCardProps {
  label: string
  value: ReactNode
  sub?: string
  trend?: number
  trendGood?: boolean
  icon?: IconName
  accent?: string
  spark?: number[]
}

export function StatCard({ label, value, sub, trend, trendGood, icon, accent, spark }: StatCardProps) {
  const up = trend != null && trend > 0
  const good = trendGood != null ? trendGood : !up
  return (
    <div className="card pad col gap-3" style={{ minHeight: 116, justifyContent: 'space-between' }}>
      <div className="spread">
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: accent ?? 'var(--accent)' }}>
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className="row gap-3" style={{ alignItems: 'flex-end' }}>
        <div className="display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {spark && (
          <div style={{ marginBottom: 2 }}>
            <Sparkline data={spark} color={accent ?? 'var(--accent)'} />
          </div>
        )}
      </div>
      <div className="row gap-2" style={{ fontSize: 12 }}>
        {trend != null && (
          <span className="row gap-1" style={{ color: good ? 'var(--ok)' : 'var(--critical)', fontWeight: 700 }}>
            <Icon name={up ? 'arrowUp' : 'arrowDown'} size={13} stroke={2.5} />
            {Math.abs(trend)}%
          </span>
        )}
        {sub && <span className="muted">{sub}</span>}
      </div>
    </div>
  )
}

import { Icon } from './Icon'
import type { IconName } from './Icon'

interface EmptyProps {
  icon?: IconName
  title: string
  sub?: string
}

export function Empty({ icon = 'grid', title, sub }: EmptyProps) {
  return (
    <div className="col center" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)', gap: 10 }}>
      <span style={{ color: 'var(--faint)' }}>
        <Icon name={icon} size={34} stroke={1.6} />
      </span>
      <div style={{ fontWeight: 700, color: 'var(--ink-2)', fontSize: 15 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, maxWidth: 360 }}>{sub}</div>}
    </div>
  )
}

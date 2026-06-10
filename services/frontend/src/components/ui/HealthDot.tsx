export type Health = 'critical' | 'degraded' | 'healthy'

const HEALTH: Record<Health, { c: string; l: string }> = {
  critical: { c: 'var(--critical)', l: 'Critical' },
  degraded: { c: 'var(--warn)',     l: 'Degraded' },
  healthy:  { c: 'var(--ok)',       l: 'Healthy'  },
}

interface HealthDotProps {
  health?: Health
  label?: boolean
}

export function HealthDot({ health = 'healthy', label = false }: HealthDotProps) {
  const h = HEALTH[health]
  return (
    <span className="row gap-2" style={{ color: h.c, fontWeight: 600, fontSize: 12.5 }}>
      <span
        className={health === 'critical' ? 'pulse-dot' : undefined}
        style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}
      />
      {label && <span style={{ color: 'var(--ink-2)' }}>{h.l}</span>}
    </span>
  )
}

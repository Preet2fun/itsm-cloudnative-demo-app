// src/components/KpiTile.tsx
import Sparkline from './Sparkline'
import styles from './KpiTile.module.css'

interface KpiTileProps {
  label: string
  value: string
  delta: string
  tone: 'up' | 'down'
  trend: number[]
}

export default function KpiTile({ label, value, delta, tone, trend }: KpiTileProps) {
  return (
    <div className={styles.tile}>
      <div className={styles.label}>{label}</div>
      <div className={styles.row}>
        <div className={styles.value}>{value}</div>
        <Sparkline values={trend} width={64} height={28} color={tone === 'up' ? 'var(--success)' : 'var(--warning)'} />
      </div>
      <div className={`${styles.delta} ${tone === 'up' ? styles.up : styles.down}`}>{delta}</div>
    </div>
  )
}

// src/copilot/blocks/BarsBlock.tsx
import type { BarsRow } from '../copilotScript'
import styles from '../blocks.module.css'

export default function BarsBlock({ rows }: { rows: BarsRow[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((r) => (
        <div key={r.label} className={styles.barRow}>
          <div className={styles.barLabelRow}>
            <span>{r.label}</span>
            <span className={styles.barValue}>{r.value}</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

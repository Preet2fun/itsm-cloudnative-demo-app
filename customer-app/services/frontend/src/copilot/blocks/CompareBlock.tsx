// src/copilot/blocks/CompareBlock.tsx
import type { CompareRow } from '../copilotScript'
import styles from '../blocks.module.css'

const TONE_COLOR: Record<CompareRow['tone'], string> = {
  up: 'var(--success)',
  down: 'var(--warning)',
  neutral: 'var(--text-primary)',
}

export default function CompareBlock({ rows }: { rows: CompareRow[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((r) => (
        <div key={r.label} className={styles.compareRow}>
          <span className={styles.compareLabel}>{r.label}</span>
          <span className={styles.compareFrom}>{r.from}</span>
          <span className={styles.compareArrow}>→</span>
          <span className={styles.compareTo} style={{ color: TONE_COLOR[r.tone] }}>
            {r.to}
          </span>
        </div>
      ))}
    </div>
  )
}

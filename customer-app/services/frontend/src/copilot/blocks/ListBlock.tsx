// src/copilot/blocks/ListBlock.tsx
import type { ListRow } from '../copilotScript'
import styles from '../blocks.module.css'

export default function ListBlock({ rows }: { rows: ListRow[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((r, i) => (
        <div key={i} className={styles.listRow}>
          <span className={`${styles.listMark} ${r.mark === '!' ? styles.listMarkWarn : ''}`}>{r.mark}</span>
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  )
}

// src/copilot/blocks/SparkBlock.tsx
import Sparkline from '@/components/Sparkline'
import styles from '../blocks.module.css'

interface SparkBlockProps {
  values: number[]
  stats: { label: string; value: string }[]
}

export default function SparkBlock({ values, stats }: SparkBlockProps) {
  return (
    <div className={styles.sparkBlock}>
      <Sparkline values={values} width={300} height={56} color="var(--info)" />
      <div className={styles.sparkStats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.sparkStat}>
            <span className={styles.sparkStatLabel}>{s.label}</span>
            <span className={styles.sparkStatValue}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

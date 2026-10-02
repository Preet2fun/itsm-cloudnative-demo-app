// src/components/StatusBadge.tsx
import type { ReactNode } from 'react'
import styles from './StatusBadge.module.css'

export type StatusTone = 'info' | 'warning' | 'success' | 'danger' | 'neutral'

interface StatusBadgeProps {
  tone: StatusTone
  dot?: boolean
  children: ReactNode
}

export default function StatusBadge({ tone, dot = false, children }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  )
}

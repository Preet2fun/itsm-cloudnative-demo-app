// src/components/Card.tsx
import type { ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps {
  eyebrow?: string
  title?: string
  action?: ReactNode
  children: ReactNode
}

export default function Card({ eyebrow, title, action, children }: CardProps) {
  const hasHeader = Boolean(eyebrow || title || action)
  return (
    <div className={styles.card}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.headerText}>
            {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
            {title && <div className={styles.title}>{title}</div>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  )
}

import type { ReactNode } from 'react'
import styles from './AuthLayout.module.css'

const BRAND = 'Hearth'

const STATS: Array<[string, string]> = [
  ['LOCATIONS', 'Multi-site'],
  ['ORDERS', 'Live tracking'],
  ['PAYMENTS', 'Auto-reconciled'],
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <div className={`dotgrid ${styles.panel}`}>
        <div className={`wordmark ${styles.wordmark}`}>{BRAND}</div>
        <div className={styles.copy}>
          <h1 className={styles.headline}>Every order, every location, one console.</h1>
          <p className={styles.subline}>
            Menus, orders, deliveries, and payment reconciliation for restaurant groups
            running more than one kitchen.
          </p>
        </div>
        <div className={styles.stats}>
          {STATS.map(([label, value]) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statLabel}>{label}</span>
              <span className={`tabular ${styles.statValue}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.formSide}>
        <div className={styles.formSlot}>{children}</div>
      </div>
    </div>
  )
}

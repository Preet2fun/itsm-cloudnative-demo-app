// src/layout/Sidebar.tsx
import Icon, { type IconName } from '@/components/Icon'
import styles from './Sidebar.module.css'

interface NavItem {
  id: string
  label: string
  icon: IconName
  enabled: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'gauge', enabled: true },
  { id: 'orders', label: 'Orders', icon: 'receipt-text', enabled: false },
  { id: 'menu', label: 'Menu', icon: 'book-open', enabled: false },
  { id: 'deliveries', label: 'Deliveries', icon: 'truck', enabled: false },
  { id: 'payments', label: 'Payments', icon: 'credit-card', enabled: false },
]

interface SidebarProps {
  activeId: string
}

export default function Sidebar({ activeId }: SidebarProps) {
  return (
    <nav className={styles.sidebar} aria-label="Primary">
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Operate</div>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeId
          return (
            <span
              key={item.id}
              className={[styles.navItem, isActive && styles.active, !item.enabled && styles.disabled].filter(Boolean).join(' ')}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={!item.enabled || undefined}
              title={item.enabled ? undefined : 'Coming soon'}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </span>
          )
        })}
      </div>
      <div className={styles.footer}>
        <div className={styles.avatar}>RM</div>
        <div>
          <div className={styles.footerName}>Rosa Medina</div>
          <div className={styles.footerRole}>Admin</div>
        </div>
      </div>
    </nav>
  )
}

// src/pages/Dashboard.tsx
import { useOutletContext } from 'react-router-dom'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import KpiTile from '@/components/KpiTile'
import DataTable, { type DataTableColumn } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import type { DashboardOutletContext } from '@/layout/AppShellLayout'
import { KPIS, ORDER_ROWS, DELIVERIES, TOP_ITEMS, type OrderRow } from '@/lib/mockDashboardData'
import styles from './Dashboard.module.css'

const ORDER_COLUMNS: DataTableColumn<OrderRow>[] = [
  { key: 'id', label: 'Order', mono: true, muted: true },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total', numeric: true },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <StatusBadge tone={row.tone} dot>
        {row.status}
      </StatusBadge>
    ),
  },
  { key: 'placed', label: 'Placed', muted: true },
]

export default function Dashboard() {
  const { askCopilot } = useOutletContext<DashboardOutletContext>()

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <div className={styles.date}>Thursday, 1 October</div>
          <h1 className={styles.greeting}>Good afternoon, Rosa</h1>
          <p className={styles.subtitle}>Here&apos;s how Northside Trattoria is doing today.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm">
            Today
          </Button>
          <Button variant="primary" size="sm">
            Pause online orders
          </Button>
        </div>
      </div>

      <Card
        eyebrow="AI business brief"
        title="Business is performing well today"
        action={<span className={styles.briefMeta}>UPDATED 2M AGO</span>}
      >
        <div className={styles.briefGrid}>
          <div className={styles.briefTile}>
            <div className={`${styles.briefTileLabel} ${styles.good}`}>
              <Icon name="trending-up" size={14} />
              <span>Sales</span>
            </div>
            <div className={styles.briefTileValue}>$6,420</div>
            <div className={styles.briefTileNote}>+8.1% vs last Thursday</div>
          </div>
          <div className={styles.briefTile}>
            <div className={`${styles.briefTileLabel} ${styles.warn}`}>
              <Icon name="triangle-alert" size={14} />
              <span>Needs attention</span>
            </div>
            <div className={styles.briefTileNote}>2 deliveries are past ETA</div>
            <div className={styles.briefTileNote}>3 payments ($142) need review</div>
          </div>
          <div className={styles.briefTile}>
            <div className={`${styles.briefTileLabel} ${styles.info}`}>
              <Icon name="lightbulb" size={14} />
              <span>Insight</span>
            </div>
            <div className={styles.briefTileNote}>
              Lunch orders rose 12%, but average delivery time grew 7 minutes during the lunch peak.
            </div>
          </div>
        </div>
        <div className={styles.suggestedRow}>
          <span className={styles.suggestedLabel}>Suggested</span>
          <Button variant="secondary" size="sm" onClick={() => askCopilot('delivery')}>
            Investigate delivery delays
          </Button>
          <Button variant="secondary" size="sm" onClick={() => askCopilot('payments')}>
            Review failed payments
          </Button>
          <Button variant="secondary" size="sm" onClick={() => askCopilot('menu')}>
            Analyze today&apos;s best sellers
          </Button>
        </div>
      </Card>

      <div className={styles.kpiGrid}>
        {KPIS.map((kpi) => (
          <KpiTile key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.lowerGrid}>
        <div className={styles.ordersCol}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Orders in progress</div>
            <a href="#" className={styles.sectionLink}>
              All orders
            </a>
          </div>
          <DataTable<OrderRow> columns={ORDER_COLUMNS} rows={ORDER_ROWS} />
        </div>

        <div className={styles.sideCol}>
          <Card title="Deliveries in flight">
            <div className={styles.deliveryList}>
              {DELIVERIES.map((d) => (
                <div key={d.courier} className={styles.deliveryRow}>
                  <div className={styles.deliveryInfo}>
                    <div className={styles.deliveryCourier}>{d.courier}</div>
                    <div className={styles.deliveryMeta}>{d.meta}</div>
                  </div>
                  <StatusBadge tone={d.tone} dot>
                    {d.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Top items today">
            <div className={styles.topItemsList}>
              {TOP_ITEMS.map((item) => (
                <div key={item.label} className={styles.topItemRow}>
                  <div className={styles.topItemLabelRow}>
                    <span>{item.label}</span>
                    <span className={styles.topItemValue}>{item.value}</span>
                  </div>
                  <div className={styles.topItemBarTrack}>
                    <div className={styles.topItemBarFill} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

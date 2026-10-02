import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from './Card'
import StatusBadge from './StatusBadge'
import KpiTile from './KpiTile'
import DataTable, { type DataTableColumn } from './DataTable'

describe('display primitives', () => {
  it('Card renders eyebrow, title, action, and children', () => {
    render(
      <Card eyebrow="AI business brief" title="Business is performing well today" action={<span>UPDATED 2M AGO</span>}>
        <div>body content</div>
      </Card>
    )
    expect(screen.getByText('AI business brief')).toBeInTheDocument()
    expect(screen.getByText('Business is performing well today')).toBeInTheDocument()
    expect(screen.getByText('UPDATED 2M AGO')).toBeInTheDocument()
    expect(screen.getByText('body content')).toBeInTheDocument()
  })

  it('StatusBadge renders its tone and label text', () => {
    render(
      <StatusBadge tone="warning" dot>
        Delayed
      </StatusBadge>
    )
    expect(screen.getByText('Delayed')).toBeInTheDocument()
  })

  it('KpiTile renders label, value, and delta', () => {
    render(<KpiTile label="Orders today" value="218" delta="+14" tone="up" trend={[168, 182, 175, 204, 196, 211, 218]} />)
    expect(screen.getByText('Orders today')).toBeInTheDocument()
    expect(screen.getByText('218')).toBeInTheDocument()
    expect(screen.getByText('+14')).toBeInTheDocument()
  })

  interface Row {
    id: string
    name: string
    total: string
  }

  it('DataTable renders columns and rows, using a custom render function when given', () => {
    const columns: DataTableColumn<Row>[] = [
      { key: 'id', label: 'Order', mono: true },
      { key: 'name', label: 'Items' },
      { key: 'total', label: 'Total', numeric: true, render: (row) => `$${row.total}` },
    ]
    const rows: Row[] = [{ id: '#ORD-1', name: 'Margherita', total: '34.20' }]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('Order')).toBeInTheDocument()
    expect(screen.getByText('#ORD-1')).toBeInTheDocument()
    expect(screen.getByText('Margherita')).toBeInTheDocument()
    expect(screen.getByText('$34.20')).toBeInTheDocument()
  })
})

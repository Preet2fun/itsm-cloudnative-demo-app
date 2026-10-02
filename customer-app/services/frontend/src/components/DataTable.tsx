// src/components/DataTable.tsx
import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

export interface DataTableColumn<T> {
  key: keyof T & string
  label: string
  numeric?: boolean
  mono?: boolean
  muted?: boolean
  render?: (row: T) => ReactNode
}

interface DataTableProps<T extends { id: string | number }> {
  columns: DataTableColumn<T>[]
  rows: T[]
}

export default function DataTable<T extends { id: string | number }>({ columns, rows }: DataTableProps<T>) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.numeric ? styles.numeric : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[col.numeric && styles.numeric, col.mono && styles.mono, col.muted && styles.muted]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {col.render ? col.render(row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

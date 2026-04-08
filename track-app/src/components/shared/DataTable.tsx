import React from 'react'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T extends object> {
  columns: Column<T>[]
  rows: T[]
  onDelete?: (row: T) => void
  emptyMessage?: string
}

function DataTable<T extends object>({
  columns,
  rows,
  onDelete,
  emptyMessage = 'No items yet.'
}: DataTableProps<T>) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 'var(--space-12) var(--space-4)',
        color: 'var(--color-text-muted)'
      }}>
        <p style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>📭</p>
        <p style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{emptyMessage}</p>
      </div>
    )
  }

  const getRowKey = (row: T, i: number): string | number => {
    const r = row as Record<string, unknown>
    return (r['_id'] as string) || (r['id'] as string) || i
  }

  return (
    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={String(col.key)}>{col.label}</th>
              ))}
              {onDelete && <th style={{ width: '80px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={getRowKey(row, i)}>
                {columns.map(col => (
                  <td key={String(col.key)}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                  </td>
                ))}
                {onDelete && (
                  <td>
                    <button
                      className="button is-danger is-small is-outlined is-rounded"
                      onClick={() => onDelete(row)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable

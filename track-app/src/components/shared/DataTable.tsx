import React from 'react'
import { useEffect, useMemo, useState } from 'react'

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
  pageSize?: number
  serverPagination?: {
    enabled: boolean
    currentPage: number
    totalCount: number
    onPageChange: (nextPage: number) => void
  }
}

function DataTable<T extends object>({
  columns,
  rows,
  onDelete,
  emptyMessage = 'No items yet.',
  pageSize = 20,
  serverPagination
}: DataTableProps<T>) {
  const resolvedPageSize = Math.max(1, Math.min(20, pageSize))
  const isServerPagination = Boolean(serverPagination?.enabled)
  const [currentPage, setCurrentPage] = useState(1)

  const localTotalPages = Math.max(1, Math.ceil((rows?.length || 0) / resolvedPageSize))
  const totalRows = isServerPagination ? (serverPagination?.totalCount || 0) : (rows?.length || 0)
  const totalPages = Math.max(1, Math.ceil(totalRows / resolvedPageSize))
  const effectivePage = isServerPagination ? (serverPagination?.currentPage || 1) : currentPage

  useEffect(() => {
    if (!isServerPagination && currentPage > localTotalPages) setCurrentPage(localTotalPages)
  }, [isServerPagination, currentPage, localTotalPages])

  const localPagedRows = useMemo(() => {
    const start = (currentPage - 1) * resolvedPageSize
    const end = start + resolvedPageSize
    return rows.slice(start, end)
  }, [rows, currentPage, resolvedPageSize])
  const displayedRows = isServerPagination ? rows : localPagedRows

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

  const startIndex = totalRows > 0 ? ((effectivePage - 1) * resolvedPageSize + 1) : 0
  const endIndex = Math.min(effectivePage * resolvedPageSize, totalRows)

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
            {displayedRows.map((row, i) => (
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
      {totalRows > resolvedPageSize && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <small style={{ color: 'var(--color-text-muted)' }}>
            Showing {startIndex}-{endIndex} of {totalRows}
          </small>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="button is-small is-rounded"
              onClick={() => {
                if (isServerPagination && serverPagination) {
                  serverPagination.onPageChange(Math.max(1, effectivePage - 1))
                } else {
                  setCurrentPage(p => Math.max(1, p - 1))
                }
              }}
              disabled={effectivePage === 1}
              type="button"
            >
              Previous
            </button>
            <small style={{ minWidth: 70, textAlign: 'center' }}>
              Page {effectivePage}/{totalPages}
            </small>
            <button
              className="button is-small is-rounded"
              onClick={() => {
                if (isServerPagination && serverPagination) {
                  serverPagination.onPageChange(Math.min(totalPages, effectivePage + 1))
                } else {
                  setCurrentPage(p => Math.min(totalPages, p + 1))
                }
              }}
              disabled={effectivePage >= totalPages}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable

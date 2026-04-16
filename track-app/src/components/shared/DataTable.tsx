import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T extends object> {
  columns: Column<T>[]
  rows: T[]
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  emptyMessage?: string
  pageSize?: number
  variant?: 'default' | 'flat'
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
  onEdit,
  onDelete,
  emptyMessage,
  pageSize = 20,
  variant = 'default',
  serverPagination
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const resolvedEmptyMessage = emptyMessage ?? t('table.noItems')
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
        <p style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{resolvedEmptyMessage}</p>
      </div>
    )
  }

  const startIndex = totalRows > 0 ? ((effectivePage - 1) * resolvedPageSize + 1) : 0
  const endIndex = Math.min(effectivePage * resolvedPageSize, totalRows)

  const getRowKey = (row: T, i: number): string | number => {
    const r = row as Record<string, unknown>
    return (r['_id'] as string) || (r['id'] as string) || i
  }
  const headerClass = variant === 'flat'
    ? 'border-b px-3 py-2 text-left align-middle text-[var(--text-secondary)]'
    : 'border-b px-3 py-2 text-left align-middle'
  const rowClass = variant === 'flat'
    ? 'hover:bg-white/10 dark:hover:bg-slate-700/20'
    : 'odd:bg-white/10 hover:bg-white/20 dark:odd:bg-slate-700/20 dark:hover:bg-slate-700/35'

  return (
    <div className="data-table-shell">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} className={headerClass} style={{ borderColor: 'var(--border-default)' }}>{col.label}</th>
              ))}
              {(onEdit || onDelete) && <th style={{ width: '140px', borderColor: 'var(--border-default)' }} className={headerClass}>{t('ui.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row, i) => (
              <tr key={getRowKey(row, i)} className={rowClass}>
                {columns.map(col => (
                  <td key={String(col.key)} className="border-b px-3 py-2 align-middle" style={{ borderColor: 'var(--border-default)' }}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="border-b px-3 py-2 align-middle" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <button
                          className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--glass-input)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:brightness-105"
                          onClick={() => onEdit(row)}
                          type="button"
                        >
                          {t('ui.edit')}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="inline-flex items-center justify-center rounded-full border border-red-700 bg-transparent px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          onClick={() => onDelete(row)}
                          type="button"
                        >
                          {t('ui.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalRows > resolvedPageSize && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <small style={{ color: 'var(--color-text-muted)' }}>
            {t('table.showing', { start: startIndex, end: endIndex, total: totalRows })}
          </small>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} className="flex-wrap">
            <button
              className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--glass-input)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
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
              {t('table.previous')}
            </button>
            <small style={{ minWidth: 70, textAlign: 'center' }}>
              {t('table.page', { current: effectivePage, total: totalPages })}
            </small>
            <button
              className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--glass-input)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
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
              {t('table.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable

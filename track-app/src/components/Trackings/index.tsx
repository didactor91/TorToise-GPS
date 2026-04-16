import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { useTrackers, Tracker } from '../../hooks/useTrackers'
import { Map, Eye, Trash } from 'iconoir-react'
import { useTranslation } from 'react-i18next'

type TrackerRow = Tracker & {
  status: string
}

function Trackings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<TrackerRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { trackers, totalCount, loading, deleteTracker, statusBySerial } = useTrackers(page, 20)

  const rows: TrackerRow[] = trackers.map(tracker => {
    const status = statusBySerial.get(tracker.serialNumber) || 'OFF'
    return {
      ...tracker,
      status
    }
  })

  const TRACKER_COLUMNS: Column<TrackerRow>[] = [
    {
      key: 'status',
      label: t('ui.status'),
      render: (row) => (
        <span
          title={row.status === 'ON' ? t('ui.on') : t('ui.off')}
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: row.status === 'ON' ? '#22c55e' : '#ef4444',
            border: '1px solid #d1d5db'
          }}
        />
      )
    },
    { key: 'alias', label: t('ui.alias') },
    { key: 'serialNumber', label: t('ui.serial') },
    {
      key: 'actions',
      label: t('ui.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <button
            className="inline-flex min-w-9 items-center justify-center rounded-full border border-amber-500 bg-amber-400 px-3 py-1.5 text-xs font-semibold leading-none text-slate-800 transition hover:brightness-105"
            style={{ fontSize: 16 }}
            onClick={() => navigate('/home', { state: { focusSerial: row.serialNumber } })}
            title={t('trackers.goToMap')}
            aria-label={t('trackers.goToMap')}
            type="button"
          >
            <Map width="18" height="18" strokeWidth={1.8} />
          </button>
          <button
            className="inline-flex min-w-9 items-center justify-center rounded-full border border-cyan-700 bg-cyan-600 px-3 py-1.5 text-xs font-semibold leading-none text-white transition hover:brightness-105"
            style={{ fontSize: 16 }}
            onClick={() => navigate(`/detail/${row.serialNumber}`)}
            title={t('trackers.viewDetail')}
            aria-label={t('trackers.viewDetail')}
            type="button"
          >
            <Eye width="18" height="18" strokeWidth={1.8} />
          </button>
          <button
            className="inline-flex min-w-9 items-center justify-center rounded-full border border-red-700 bg-red-600 px-3 py-1.5 text-xs font-semibold leading-none text-white transition hover:brightness-105"
            style={{ fontSize: 16 }}
            onClick={() => setPendingDelete(row)}
            title={t('trackers.deleteTracker')}
            aria-label={t('trackers.deleteTracker')}
            type="button"
          >
            <Trash width="18" height="18" strokeWidth={1.8} />
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <PageShell
        title={t('trackers.title')}
        actionLabel={t('trackers.newTrackerAction')}
        onAction={() => navigate('/trackers/new')}
      >
        {loading
          ? <p className="text-center text-[var(--text-muted)]">{t('ui.loading')}</p>
          : <DataTable
              columns={TRACKER_COLUMNS}
              rows={rows}
              emptyMessage={t('trackers.empty')}
              pageSize={20}
              serverPagination={{
                enabled: true,
                currentPage: page,
                totalCount,
                onPageChange: setPage
              }}
            />
        }
      </PageShell>

      <div className={`fixed inset-0 z-50 items-center justify-center p-4 ${pendingDelete ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-900/45" onClick={() => !deleting && setPendingDelete(null)} />
        <div className="glass-card relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-glass-strong)' }}>
          <header className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('trackers.confirmDelete')}</p>
            <button
              className="relative h-7 w-7 rounded-full border border-[var(--border-default)] bg-transparent"
              aria-label={t('ui.cancel')}
              onClick={() => !deleting && setPendingDelete(null)}
              type="button"
            >
              <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-500" />
              <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-slate-500" />
            </button>
          </header>
          <section className="px-4 py-3">
            {pendingDelete && (
              <p>
                {t('trackers.deleteQuestion', { name: pendingDelete.alias || pendingDelete.serialNumber })} 
              </p>
            )}
          </section>
          <footer className="flex items-center justify-between gap-3 border-t px-4 py-3" style={{ borderColor: 'var(--border-default)' }}>
            <button
              className="inline-flex min-w-24 items-center justify-center rounded-full border border-red-700 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!pendingDelete || deleting}
              onClick={async () => {
                if (!pendingDelete) return
                setDeleting(true)
                try {
                  await deleteTracker(pendingDelete.id)
                  setPendingDelete(null)
                } finally {
                  setDeleting(false)
                }
              }}
              type="button"
            >
              {deleting ? t('trackers.deleting') : t('ui.delete')}
            </button>
            <button className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--glass-input)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60" disabled={deleting} onClick={() => setPendingDelete(null)} type="button">{t('ui.cancel')}</button>
          </footer>
        </div>
      </div>
    </>
  )
}

export default Trackings

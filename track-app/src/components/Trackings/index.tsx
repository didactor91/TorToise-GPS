import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { useTrackers, Tracker } from '../../hooks/useTrackers'

type TrackerRow = Tracker & {
  status: string
}

function Trackings() {
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
      label: 'Status',
      render: (row) => (
        <span
          title={row.status}
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
    { key: 'licensePlate', label: 'Alias' },
    { key: 'serialNumber', label: 'Serial' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="button is-small is-warning is-rounded"
            style={{ fontSize: 16, lineHeight: 1, minWidth: 36, color: '#1f2937' }}
            onClick={() => navigate('/home', { state: { focusSerial: row.serialNumber } })}
            title="Ver en el mapa"
            aria-label="Ver en el mapa"
          >
            <span aria-hidden="true">🌍</span>
          </button>
          <button
            className="button is-small is-info is-rounded"
            style={{ fontSize: 16, lineHeight: 1, minWidth: 36, color: '#ffffff' }}
            onClick={() => navigate(`/detail/${row.serialNumber}`)}
            title="Ver detalle"
            aria-label="Ver detalle"
          >
            <span aria-hidden="true">👁</span>
          </button>
          <button
            className="button is-small is-danger is-rounded"
            style={{ fontSize: 16, lineHeight: 1, minWidth: 36, color: '#ffffff' }}
            onClick={() => setPendingDelete(row)}
            title="Eliminar tracker"
            aria-label="Eliminar tracker"
          >
            <span aria-hidden="true">🗑</span>
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <PageShell
        title="Trackers"
        actionLabel="+ New Tracker"
        onAction={() => navigate('/trackers/new')}
      >
        {loading
          ? <p className="has-text-centered has-text-grey">Loading…</p>
          : <DataTable
              columns={TRACKER_COLUMNS}
              rows={rows}
              emptyMessage="No trackers yet. Add your first one!"
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

      <div className={`modal ${pendingDelete ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => !deleting && setPendingDelete(null)} />
        <div className="modal-card glass-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Confirm Delete</p>
            <button className="delete" aria-label="close" onClick={() => !deleting && setPendingDelete(null)} />
          </header>
          <section className="modal-card-body">
            {pendingDelete && (
              <p>
                Delete tracker <strong>{pendingDelete.licensePlate || pendingDelete.serialNumber}</strong>?
              </p>
            )}
          </section>
          <footer className="modal-card-foot">
            <button
              className={`button is-danger ${deleting ? 'is-loading' : ''}`}
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
            >
              Delete
            </button>
            <button className="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button>
          </footer>
        </div>
      </div>
    </>
  )
}

export default Trackings

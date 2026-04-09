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
      label: 'Accions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="button is-small is-warning is-outlined is-rounded"
            onClick={() => navigate('/home', { state: { focusSerial: row.serialNumber } })}
          >
            Ver en el mapa
          </button>
          <button
            className="button is-small is-danger is-outlined is-rounded"
            onClick={() => deleteTracker(row.id)}
          >
            Delete
          </button>
        </div>
      )
    }
  ]

  return (
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
  )
}

export default Trackings

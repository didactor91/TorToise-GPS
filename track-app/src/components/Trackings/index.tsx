import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { useTrackers, Tracker } from '../../hooks/useTrackers'

type TrackerRow = Tracker & {
  status: string
  lastUpdateLabel: string
}

function Trackings() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { trackers, totalCount, loading, deleteTracker, statusBySerial, dateBySerial } = useTrackers(page, 20)

  const handleDelete = (tracker: Tracker) => {
    deleteTracker(tracker.id)
  }

  const rows: TrackerRow[] = trackers.map(tracker => {
    const status = statusBySerial.get(tracker.serialNumber) || 'OFF'
    const lastDate = dateBySerial.get(tracker.serialNumber)
    return {
      ...tracker,
      status,
      lastUpdateLabel: lastDate ? new Date(lastDate).toLocaleString() : 'No data'
    }
  })

  const TRACKER_COLUMNS: Column<TrackerRow>[] = [
    { key: 'serialNumber', label: 'Serial Number' },
    { key: 'licensePlate', label: 'Alias' },
    {
      key: 'status',
      label: 'Estado',
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
    { key: 'lastUpdateLabel', label: 'Última señal' },
    {
      key: 'viewMap',
      label: 'Acción',
      render: (row) => (
        <button
          className="button is-small is-warning is-outlined is-rounded"
          onClick={() => navigate('/home', { state: { focusSerial: row.serialNumber } })}
        >
          Ver en el mapa
        </button>
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
            onDelete={handleDelete}
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

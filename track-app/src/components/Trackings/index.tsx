import React from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { useTrackers, Tracker } from '../../hooks/useTrackers'

const TRACKER_COLUMNS: Column<Tracker>[] = [
  { key: 'serialNumber', label: 'Serial Number' },
  { key: 'licensePlate', label: 'License Plate' }
]

function Trackings() {
  const navigate = useNavigate()
  const { trackers, loading, deleteTracker } = useTrackers()

  const handleDelete = (tracker: Tracker) => {
    deleteTracker(tracker.id)
  }

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
            rows={trackers}
            onDelete={handleDelete}
            emptyMessage="No trackers yet. Add your first one!"
          />
      }
    </PageShell>
  )
}

export default Trackings

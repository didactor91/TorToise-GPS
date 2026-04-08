import React from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { usePOIs, Poi } from '../../hooks/usePOIs'

const POI_COLUMNS: Column<Poi>[] = [
  { key: 'title',     label: 'Title' },
  { key: 'latitude',  label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  {
    key: 'color',
    label: 'Color',
    render: (row) => (
      <span style={{
        display: 'inline-block',
        width: 16, height: 16,
        borderRadius: '50%',
        background: row.color,
        border: '1px solid #ccc',
        verticalAlign: 'middle',
        marginRight: 6
      }} />
    )
  }
]

function Places() {
  const navigate = useNavigate()
  const { pois, loading, deletePOI } = usePOIs()

  const handleDelete = (poi: Poi) => {
    deletePOI(poi.id)
  }

  return (
    <PageShell
      title="Points of Interest"
      actionLabel="+ New POI"
      onAction={() => navigate('/places/new')}
    >
      {loading
        ? <p className="has-text-centered has-text-grey">Loading…</p>
        : <DataTable
            columns={POI_COLUMNS}
            rows={pois}
            onDelete={handleDelete}
            emptyMessage="No POIs yet. Create your first one!"
          />
      }
    </PageShell>
  )
}

export default Places

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { usePOIs, Poi } from '../../hooks/usePOIs'
import { useTranslation } from 'react-i18next'

function Places() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { pois, totalCount, loading, deletePOI } = usePOIs(page, 20)

  const POI_COLUMNS: Column<Poi>[] = [
    {
      key: 'emoji',
      label: t('ui.emoji'),
      render: (row) => row.emoji || '📍'
    },
    { key: 'title', label: t('ui.title') },
    { key: 'latitude', label: t('ui.latitude') },
    { key: 'longitude', label: t('ui.longitude') },
    {
      key: 'color',
      label: t('ui.color'),
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

  const handleDelete = (poi: Poi) => {
    deletePOI(poi.id)
  }

  return (
    <PageShell
      title={t('places.title')}
      actionLabel={t('places.newPoiAction')}
      onAction={() => navigate('/places/new')}
    >
      {loading
        ? <p className="text-center text-[var(--text-muted)]">{t('ui.loading')}</p>
        : <DataTable
            columns={POI_COLUMNS}
            rows={pois}
            onEdit={(poi) => navigate(`/places/${poi.id}`)}
            onDelete={handleDelete}
            emptyMessage={t('places.empty')}
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

export default Places

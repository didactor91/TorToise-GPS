import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { CompanyUser, useUsers } from '../../hooks/useUsers'
import { useTranslation } from 'react-i18next'

interface UsersProps {
  canCreate: boolean
}

function Users({ canCreate }: UsersProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { users, totalCount, loading } = useUsers(page, 20)

  const USER_COLUMNS: Column<CompanyUser>[] = [
    { key: 'name', label: t('auth.name') },
    { key: 'surname', label: t('auth.surname') },
    { key: 'email', label: t('auth.email') },
    { key: 'role', label: t('ui.role') }
  ]

  return (
    <PageShell
      title={t('users.title')}
      actionLabel={canCreate ? t('users.newUserAction') : undefined}
      onAction={canCreate ? (() => navigate('/users/new')) : undefined}
    >
      {loading
        ? <p className="text-center text-[var(--text-muted)]">{t('ui.loading')}</p>
        : <DataTable
            columns={USER_COLUMNS}
            rows={users}
            emptyMessage={t('users.empty')}
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

export default Users

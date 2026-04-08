import React from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { CompanyUser, useUsers } from '../../hooks/useUsers'

interface UsersProps {
  canCreate: boolean
}

const USER_COLUMNS: Column<CompanyUser>[] = [
  { key: 'name', label: 'Name' },
  { key: 'surname', label: 'Surname' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' }
]

function Users({ canCreate }: UsersProps) {
  const navigate = useNavigate()
  const { users, loading } = useUsers()

  return (
    <PageShell
      title="Users"
      actionLabel={canCreate ? '+ New User' : undefined}
      onAction={canCreate ? (() => navigate('/users/new')) : undefined}
    >
      {loading
        ? <p className="has-text-centered has-text-grey">Loading…</p>
        : <DataTable
            columns={USER_COLUMNS}
            rows={users}
            emptyMessage="No users found in this company."
          />
      }
    </PageShell>
  )
}

export default Users

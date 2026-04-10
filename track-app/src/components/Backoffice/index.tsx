import React, { useEffect, useMemo, useState } from 'react'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { useBackoffice, BackofficeCompany, BackofficeUser } from '../../hooks/useBackoffice'
import { FEATURE_KEYS, PERMISSION_KEYS, permissionTemplateForRole } from './access-catalog'

const COMPANY_COLUMNS: Column<BackofficeCompany>[] = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  {
    key: 'active',
    label: 'Active',
    render: (row) => (row.active ? 'Yes' : 'No')
  },
  {
    key: 'featureKeys',
    label: 'Features',
    render: (row) => row.featureKeys.join(', ')
  }
]

const USER_COLUMNS: Column<BackofficeUser>[] = [
  { key: 'name', label: 'Name' },
  { key: 'surname', label: 'Surname' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'companyId', label: 'Company ID' },
  {
    key: 'permissionKeys',
    label: 'Permissions',
    render: (row) => row.permissionKeys.join(', ')
  }
]

function toggleInArray(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter(item => item !== value)
    : [...list, value]
}

interface BackofficeProps {
  canReadUsers?: boolean
  canCreateUsers?: boolean
  canUpdateUsers?: boolean
}

type BackofficeTab = 'companies' | 'users'

function Backoffice({
  canReadUsers = true,
  canCreateUsers = true,
  canUpdateUsers = true
}: BackofficeProps) {
  const [usersPage, setUsersPage] = useState(1)
  const { companies, users, usersTotalCount, loading, createCompany, createUser, updateCompany, updateUser } = useBackoffice(usersPage, 20, canReadUsers)
  const canSeeUsersTab = canReadUsers || canCreateUsers || canUpdateUsers
  const [activeTab, setActiveTab] = useState<BackofficeTab>('companies')
  const [companyForm, setCompanyForm] = useState({
    name: '',
    active: true,
    featureKeys: [...FEATURE_KEYS]
  })
  const [userForm, setUserForm] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    role: 'admin',
    companyId: '',
    permissionKeys: permissionTemplateForRole('admin')
  })
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const companyOptions = useMemo(
    () => companies.map((company) => ({ id: company.id, label: `${company.name} (${company.slug})` })),
    [companies]
  )

  const onCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCompany(companyForm.name, companyForm.active, companyForm.featureKeys)
    setCompanyForm({
      name: '',
      active: true,
      featureKeys: [...FEATURE_KEYS]
    })
  }

  useEffect(() => {
    if (!canSeeUsersTab && activeTab === 'users') setActiveTab('companies')
  }, [activeTab, canSeeUsersTab])

  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    await createUser({
      name: userForm.name,
      surname: userForm.surname,
      email: userForm.email,
      password: userForm.password,
      role: userForm.role,
      companyId: userForm.companyId,
      permissionKeys: userForm.permissionKeys
    })
    setUserForm({
      name: '',
      surname: '',
      email: '',
      password: '',
      role: 'admin',
      companyId: '',
      permissionKeys: permissionTemplateForRole('admin')
    })
  }

  const selectedCompany = useMemo(
    () => companies.find(company => company.id === selectedCompanyId) || null,
    [companies, selectedCompanyId]
  )

  const selectedUser = useMemo(
    () => users.find(user => user.id === selectedUserId) || null,
    [users, selectedUserId]
  )

  const [companyEdit, setCompanyEdit] = useState({
    name: '',
    slug: '',
    active: true,
    featureKeys: [] as string[]
  })

  const [userEdit, setUserEdit] = useState({
    name: '',
    surname: '',
    email: '',
    role: 'viewer',
    companyId: '',
    permissionKeys: [] as string[]
  })

  const onPickCompany = (companyId: string) => {
    setSelectedCompanyId(companyId)
    const company = companies.find(item => item.id === companyId)
    if (!company) return
    setCompanyEdit({
      name: company.name,
      slug: company.slug,
      active: company.active,
      featureKeys: [...company.featureKeys]
    })
  }

  const onPickUser = (userId: string) => {
    setSelectedUserId(userId)
    const user = users.find(item => item.id === userId)
    if (!user) return
    setUserEdit({
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      companyId: user.companyId || '',
      permissionKeys: [...user.permissionKeys]
    })
  }

  const onUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCompany) return
    await updateCompany(selectedCompany.id, companyEdit.name, companyEdit.slug, companyEdit.active, companyEdit.featureKeys)
  }

  const onUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    await updateUser(selectedUser.id, {
      name: userEdit.name,
      surname: userEdit.surname,
      email: userEdit.email,
      role: userEdit.role,
      companyId: userEdit.companyId || undefined,
      permissionKeys: userEdit.permissionKeys
    })
  }

  return (
    <PageShell title="Backoffice">
      {loading && <p className="has-text-centered has-text-grey">Loading...</p>}

      <div className="tabs is-toggle is-toggle-rounded" style={{ marginBottom: 24 }}>
        <ul>
          <li className={activeTab === 'companies' ? 'is-active' : ''}>
            <a onClick={() => setActiveTab('companies')}>Companies</a>
          </li>
          {canSeeUsersTab && (
            <li className={activeTab === 'users' ? 'is-active' : ''}>
              <a onClick={() => setActiveTab('users')}>Users</a>
            </li>
          )}
        </ul>
      </div>

      {activeTab === 'companies' && (
      <>
      <section className="glass-section">
        <h3 className="title is-5">Create Company</h3>
        <form onSubmit={onCreateCompany} className="glass-form">
          <div className="field">
            <label className="label">Name</label>
            <div className="control">
              <input className="input" value={companyForm.name} onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
          </div>
          <div className="field">
            <label className="checkbox">
              <input type="checkbox" checked={companyForm.active} onChange={(e) => setCompanyForm(prev => ({ ...prev, active: e.target.checked }))} />
              {' '}
              Active
            </label>
          </div>
          <div className="field">
            <label className="label">Features</label>
            <div className="control">
              {FEATURE_KEYS.map((feature) => (
                <label key={feature} className="checkbox mr-4" style={{ display: 'inline-block' }}>
                  <input
                    type="checkbox"
                    checked={companyForm.featureKeys.includes(feature)}
                    onChange={() => setCompanyForm(prev => ({ ...prev, featureKeys: toggleInArray(prev.featureKeys, feature) }))}
                  />
                  {' '}
                  {feature}
                </label>
              ))}
            </div>
          </div>
          <button className="button is-warning is-rounded" type="submit">Create Company</button>
        </form>
      </section>

      <section className="glass-section">
        <h3 className="title is-5">Companies</h3>
        <DataTable columns={COMPANY_COLUMNS} rows={companies} emptyMessage="No companies yet." />
      </section>
      </>
      )}

      {activeTab === 'users' && canCreateUsers && (
      <section className="glass-section">
        <h3 className="title is-5">Create User</h3>
        <form onSubmit={onCreateUser} className="glass-form">
          <div className="columns is-multiline">
            <div className="column is-6">
              <label className="label">Name</label>
              <input className="input" value={userForm.name} onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="column is-6">
              <label className="label">Surname</label>
              <input className="input" value={userForm.surname} onChange={(e) => setUserForm(prev => ({ ...prev, surname: e.target.value }))} required />
            </div>
            <div className="column is-6">
              <label className="label">Email</label>
              <input className="input" type="email" value={userForm.email} onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div className="column is-6">
              <label className="label">Password</label>
              <input className="input" type="password" value={userForm.password} onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))} required />
            </div>
            <div className="column is-6">
              <label className="label">Role</label>
              <div className="select is-fullwidth">
                <select
                  value={userForm.role}
                  onChange={(e) => {
                    const role = e.target.value
                    setUserForm(prev => ({ ...prev, role, permissionKeys: permissionTemplateForRole(role) }))
                  }}
                >
                  <option value="staff">staff</option>
                  <option value="owner">owner</option>
                  <option value="admin">admin</option>
                  <option value="dispatcher">dispatcher</option>
                  <option value="viewer">viewer</option>
                </select>
              </div>
            </div>
            <div className="column is-6">
              <label className="label">Company</label>
              <div className="select is-fullwidth">
                <select value={userForm.companyId} onChange={(e) => setUserForm(prev => ({ ...prev, companyId: e.target.value }))} required>
                  <option value="">Select a company</option>
                  {companyOptions.map((company) => (
                    <option key={company.id} value={company.id}>{company.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="column is-12">
              <label className="label">Permissions</label>
              <div>
                {PERMISSION_KEYS.map((permission) => (
                  <label key={permission} className="checkbox mr-4" style={{ display: 'inline-block' }}>
                    <input
                      type="checkbox"
                      checked={userForm.permissionKeys.includes(permission)}
                      onChange={() => setUserForm(prev => ({ ...prev, permissionKeys: toggleInArray(prev.permissionKeys, permission) }))}
                    />
                    {' '}
                    {permission}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button className="button is-warning is-rounded" type="submit">Create User</button>
        </form>
      </section>
      )}

      {activeTab === 'companies' && (
      <section className="glass-section">
        <h3 className="title is-5">Edit Company</h3>
        <div className="field">
          <label className="label">Company</label>
          <div className="select is-fullwidth">
            <select value={selectedCompanyId} onChange={(e) => onPickCompany(e.target.value)}>
              <option value="">Select company</option>
              {companyOptions.map((company) => (
                <option key={company.id} value={company.id}>{company.label}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedCompany && (
          <form onSubmit={onUpdateCompany} className="glass-form">
            <div className="field">
              <label className="label">Name</label>
              <input className="input" value={companyEdit.name} onChange={(e) => setCompanyEdit(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="field">
              <label className="label">Slug</label>
              <input className="input" value={companyEdit.slug} readOnly />
            </div>
            <div className="field">
              <label className="checkbox">
                <input type="checkbox" checked={companyEdit.active} onChange={(e) => setCompanyEdit(prev => ({ ...prev, active: e.target.checked }))} />
                {' '}
                Active
              </label>
            </div>
            <div className="field">
              <label className="label">Features</label>
              <div>
                {FEATURE_KEYS.map((feature) => (
                  <label key={feature} className="checkbox mr-4" style={{ display: 'inline-block' }}>
                    <input
                      type="checkbox"
                      checked={companyEdit.featureKeys.includes(feature)}
                      onChange={() => setCompanyEdit(prev => ({ ...prev, featureKeys: toggleInArray(prev.featureKeys, feature) }))}
                    />
                    {' '}
                    {feature}
                  </label>
                ))}
              </div>
            </div>
            <button className="button is-warning is-rounded" type="submit">Update Company</button>
          </form>
        )}
      </section>
      )}

      {activeTab === 'users' && canReadUsers && canUpdateUsers && (
      <section className="glass-section">
        <h3 className="title is-5">Edit User</h3>
        <div className="field">
          <label className="label">User</label>
          <div className="select is-fullwidth">
            <select value={selectedUserId} onChange={(e) => onPickUser(e.target.value)}>
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedUser && (
          <form onSubmit={onUpdateUser} className="glass-form">
            <div className="columns is-multiline">
              <div className="column is-6">
                <label className="label">Name</label>
                <input className="input" value={userEdit.name} onChange={(e) => setUserEdit(prev => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div className="column is-6">
                <label className="label">Surname</label>
                <input className="input" value={userEdit.surname} onChange={(e) => setUserEdit(prev => ({ ...prev, surname: e.target.value }))} required />
              </div>
              <div className="column is-6">
                <label className="label">Email</label>
                <input className="input" type="email" value={userEdit.email} onChange={(e) => setUserEdit(prev => ({ ...prev, email: e.target.value }))} required />
              </div>
              <div className="column is-6">
                <label className="label">Role</label>
                <div className="select is-fullwidth">
                  <select
                    value={userEdit.role}
                    onChange={(e) => {
                      const role = e.target.value
                      setUserEdit(prev => ({ ...prev, role, permissionKeys: permissionTemplateForRole(role) }))
                    }}
                  >
                    <option value="staff">staff</option>
                    <option value="owner">owner</option>
                    <option value="admin">admin</option>
                    <option value="dispatcher">dispatcher</option>
                    <option value="viewer">viewer</option>
                  </select>
                </div>
              </div>
              <div className="column is-6">
                <label className="label">Company</label>
                <div className="select is-fullwidth">
                  <select value={userEdit.companyId} onChange={(e) => setUserEdit(prev => ({ ...prev, companyId: e.target.value }))}>
                    <option value="">Select company</option>
                    {companyOptions.map((company) => (
                      <option key={company.id} value={company.id}>{company.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="column is-12">
                <label className="label">Permissions</label>
                <div>
                  {PERMISSION_KEYS.map((permission) => (
                    <label key={permission} className="checkbox mr-4" style={{ display: 'inline-block' }}>
                      <input
                        type="checkbox"
                        checked={userEdit.permissionKeys.includes(permission)}
                        onChange={() => setUserEdit(prev => ({ ...prev, permissionKeys: toggleInArray(prev.permissionKeys, permission) }))}
                      />
                      {' '}
                      {permission}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button className="button is-warning is-rounded" type="submit">Update User</button>
          </form>
        )}
      </section>
      )}

      {activeTab === 'users' && canReadUsers && (
      <section className="glass-section">
        <h3 className="title is-5">Users</h3>
        <DataTable
          columns={USER_COLUMNS}
          rows={users}
          emptyMessage="No users yet."
          pageSize={20}
          serverPagination={{
            enabled: true,
            currentPage: usersPage,
            totalCount: usersTotalCount,
            onPageChange: setUsersPage
          }}
        />
      </section>
      )}
    </PageShell>
  )
}

export default Backoffice

import React, { useMemo, useState } from 'react'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { useBackoffice, BackofficeCompany, BackofficeUser } from '../../hooks/useBackoffice'

const COMPANY_COLUMNS: Column<BackofficeCompany>[] = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  {
    key: 'active',
    label: 'Active',
    render: (row) => (row.active ? 'Yes' : 'No')
  }
]

const USER_COLUMNS: Column<BackofficeUser>[] = [
  { key: 'name', label: 'Name' },
  { key: 'surname', label: 'Surname' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'companyId', label: 'Company ID' }
]

function Backoffice() {
  const { companies, users, loading, createCompany, createUser } = useBackoffice()
  const [companyForm, setCompanyForm] = useState({ name: '', slug: '', active: true })
  const [userForm, setUserForm] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    role: 'admin',
    companyId: ''
  })

  const companyOptions = useMemo(
    () => companies.map((company) => ({ id: company.id, label: `${company.name} (${company.slug})` })),
    [companies]
  )

  const onCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCompany(companyForm.name, companyForm.slug, companyForm.active)
    setCompanyForm({ name: '', slug: '', active: true })
  }

  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    await createUser({
      name: userForm.name,
      surname: userForm.surname,
      email: userForm.email,
      password: userForm.password,
      role: userForm.role,
      companyId: userForm.companyId
    })
    setUserForm({
      name: '',
      surname: '',
      email: '',
      password: '',
      role: 'admin',
      companyId: ''
    })
  }

  return (
    <PageShell title="Backoffice">
      {loading && <p className="has-text-centered has-text-grey">Loading...</p>}

      <section style={{ marginBottom: 24 }}>
        <h3 className="title is-5">Create Company</h3>
        <form onSubmit={onCreateCompany}>
          <div className="field">
            <label className="label">Name</label>
            <div className="control">
              <input className="input" value={companyForm.name} onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
          </div>
          <div className="field">
            <label className="label">Slug</label>
            <div className="control">
              <input className="input" value={companyForm.slug} onChange={(e) => setCompanyForm(prev => ({ ...prev, slug: e.target.value }))} required />
            </div>
          </div>
          <div className="field">
            <label className="checkbox">
              <input type="checkbox" checked={companyForm.active} onChange={(e) => setCompanyForm(prev => ({ ...prev, active: e.target.checked }))} />
              {' '}
              Active
            </label>
          </div>
          <button className="button is-warning is-rounded" type="submit">Create Company</button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3 className="title is-5">Companies</h3>
        <DataTable columns={COMPANY_COLUMNS} rows={companies} emptyMessage="No companies yet." />
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3 className="title is-5">Create User</h3>
        <form onSubmit={onCreateUser}>
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
                <select value={userForm.role} onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}>
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
          </div>
          <button className="button is-warning is-rounded" type="submit">Create User</button>
        </form>
      </section>

      <section>
        <h3 className="title is-5">Users</h3>
        <DataTable columns={USER_COLUMNS} rows={users} emptyMessage="No users yet." />
      </section>
    </PageShell>
  )
}

export default Backoffice

import React, { useEffect, useMemo, useState } from 'react'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { useBackoffice, BackofficeCompany, BackofficeUser } from '../../hooks/useBackoffice'
import { FEATURE_KEYS, PERMISSION_KEYS, permissionTemplateForRole } from './access-catalog'
import { useTranslation } from 'react-i18next'

function toggleInArray(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter(item => item !== value)
    : [...list, value]
}

interface BackofficeProps {
  canReadUsers?: boolean
  canCreateUsers?: boolean
  canUpdateUsers?: boolean
  canCreateTrackers?: boolean
}

type BackofficeTab = 'companies' | 'users'

function Backoffice({
  canReadUsers = true,
  canCreateUsers = true,
  canUpdateUsers = true,
  canCreateTrackers = true
}: BackofficeProps) {
  const { t } = useTranslation()
  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-xl border px-3 py-2 text-sm outline-none transition'
  const primaryButtonClass = 'inline-flex items-center justify-center rounded-full border border-amber-500 bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:brightness-105'
  const checkboxClass = 'inline-flex items-center gap-2 text-sm text-[var(--text-primary)]'
  const sectionClass = 'pb-8 border-b space-y-4'
  const checkboxesWrapClass = 'flex flex-wrap gap-x-4 gap-y-2'

  const [usersPage, setUsersPage] = useState(1)
  const { companies, users, usersTotalCount, loading, createCompany, createUser, createTracker, updateCompany, updateUser } = useBackoffice(usersPage, 20, canReadUsers)
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
    language: 'en',
    role: 'admin',
    companyId: '',
    permissionKeys: permissionTemplateForRole('admin')
  })
  const [trackerForm, setTrackerForm] = useState({
    serialNumber: '',
    alias: '',
    companyId: ''
  })
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const COMPANY_COLUMNS: Column<BackofficeCompany>[] = [
    { key: 'name', label: t('auth.name') },
    { key: 'slug', label: t('backoffice.slug') },
    {
      key: 'active',
      label: t('backoffice.active'),
      render: (row) => (row.active ? t('backoffice.yes') : t('backoffice.no'))
    },
    {
      key: 'featureKeys',
      label: t('backoffice.features'),
      render: (row) => row.featureKeys.join(', ')
    }
  ]
  const USER_COLUMNS: Column<BackofficeUser>[] = [
    { key: 'name', label: t('auth.name') },
    { key: 'surname', label: t('auth.surname') },
    { key: 'email', label: t('auth.email') },
    { key: 'language', label: t('backoffice.language') },
    { key: 'role', label: t('backoffice.role') },
    { key: 'companyId', label: t('backoffice.companyId') },
    {
      key: 'permissionKeys',
      label: t('backoffice.permissions'),
      render: (row) => row.permissionKeys.join(', ')
    }
  ]

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
      language: userForm.language,
      role: userForm.role,
      companyId: userForm.companyId,
      permissionKeys: userForm.permissionKeys
    })
    setUserForm({
      name: '',
      surname: '',
      email: '',
      password: '',
      language: 'en',
      role: 'admin',
      companyId: '',
      permissionKeys: permissionTemplateForRole('admin')
    })
  }

  const onCreateTracker = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTracker({
      serialNumber: trackerForm.serialNumber,
      alias: trackerForm.alias || undefined,
      companyId: trackerForm.companyId
    })
    setTrackerForm({
      serialNumber: '',
      alias: '',
      companyId: ''
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
    language: 'en',
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
      language: user.language || 'en',
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
      language: userEdit.language,
      role: userEdit.role,
      companyId: userEdit.companyId || undefined,
      permissionKeys: userEdit.permissionKeys
    })
  }

  return (
    <PageShell title={t('backoffice.title')}>
      {loading && <p className="text-center text-[var(--text-muted)]">{t('backoffice.loading')}</p>}

      <div className="mb-6 flex gap-2">
        <button
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${activeTab === 'companies' ? 'bg-[var(--bg-glass-strong)] text-[var(--text-primary)]' : 'bg-[var(--bg-glass)] text-[var(--text-secondary)]'}`}
          onClick={() => setActiveTab('companies')}
          type="button"
        >
          {t('backoffice.companiesTab')}
        </button>
        {canSeeUsersTab && (
          <button
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${activeTab === 'users' ? 'bg-[var(--bg-glass-strong)] text-[var(--text-primary)]' : 'bg-[var(--bg-glass)] text-[var(--text-secondary)]'}`}
            onClick={() => setActiveTab('users')}
            type="button"
          >
            {t('backoffice.usersTab')}
          </button>
        )}
      </div>
      <div className="space-y-8">

      {activeTab === 'companies' && (
      <>
      <section className={sectionClass} style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
        <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.createCompany')}</h3>
        <form onSubmit={onCreateCompany}>
          <div className="mb-4">
            <label className={labelClass}>{t('auth.name')}</label>
            <input className={inputClass} value={companyForm.name} onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="mb-4">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input type="checkbox" checked={companyForm.active} onChange={(e) => setCompanyForm(prev => ({ ...prev, active: e.target.checked }))} />
              {t('backoffice.active')}
            </label>
          </div>
          <div className="mb-4">
            <label className={labelClass}>{t('backoffice.features')}</label>
            <div className={checkboxesWrapClass}>
              {FEATURE_KEYS.map((feature) => (
                <label key={feature} className={checkboxClass}>
                  <input
                    type="checkbox"
                    checked={companyForm.featureKeys.includes(feature)}
                    onChange={() => setCompanyForm(prev => ({ ...prev, featureKeys: toggleInArray(prev.featureKeys, feature) }))}
                  />
                  {feature}
                </label>
              ))}
            </div>
          </div>
          <button className={`${primaryButtonClass} mt-2`} type="submit">{t('backoffice.createCompany')}</button>
        </form>
      </section>

      {canCreateTrackers && (
      <section className={sectionClass} style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
        <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.createTracker')}</h3>
        <form onSubmit={onCreateTracker}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>{t('trackers.serialNumber')}</label>
              <input
                className={inputClass}
                value={trackerForm.serialNumber}
                onChange={(e) => setTrackerForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t('ui.alias')}</label>
              <input
                className={inputClass}
                value={trackerForm.alias}
                onChange={(e) => setTrackerForm(prev => ({ ...prev, alias: e.target.value }))}
                placeholder={t('ui.optional')}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{t('backoffice.company')}</label>
              <select
                className={inputClass}
                value={trackerForm.companyId}
                onChange={(e) => setTrackerForm(prev => ({ ...prev, companyId: e.target.value }))}
                required
              >
                <option value="">{t('backoffice.selectCompany')}</option>
                {companyOptions.map((company) => (
                  <option key={company.id} value={company.id}>{company.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button className={`${primaryButtonClass} mt-6`} type="submit">{t('backoffice.createTracker')}</button>
        </form>
      </section>
      )}

      <section className={sectionClass} style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
        <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.companies')}</h3>
        <DataTable columns={COMPANY_COLUMNS} rows={companies} emptyMessage={t('backoffice.noCompanies')} variant="flat" />
      </section>
      </>
      )}

      {activeTab === 'users' && canCreateUsers && (
      <section className={sectionClass} style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
        <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.createUser')}</h3>
        <form onSubmit={onCreateUser}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>{t('auth.name')}</label>
              <input className={inputClass} value={userForm.name} onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>{t('auth.surname')}</label>
              <input className={inputClass} value={userForm.surname} onChange={(e) => setUserForm(prev => ({ ...prev, surname: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>{t('auth.email')}</label>
              <input className={inputClass} type="email" value={userForm.email} onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>{t('auth.password')}</label>
              <input className={inputClass} type="password" value={userForm.password} onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>{t('backoffice.language')}</label>
              <select
                className={inputClass}
                value={userForm.language}
                onChange={(e) => setUserForm(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="en">{t('ui.languageEnglish')}</option>
                <option value="es">{t('ui.languageSpanish')}</option>
                <option value="ca">{t('ui.languageCatalan')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('backoffice.role')}</label>
              <select
                className={inputClass}
                value={userForm.role}
                onChange={(e) => {
                  const role = e.target.value
                  setUserForm(prev => ({ ...prev, role, permissionKeys: permissionTemplateForRole(role) }))
                }}
              >
                <option value="staff">{t('roles.staff')}</option>
                <option value="owner">{t('roles.owner')}</option>
                <option value="admin">{t('roles.admin')}</option>
                <option value="dispatcher">{t('roles.dispatcher')}</option>
                <option value="viewer">{t('roles.viewer')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('backoffice.company')}</label>
              <select className={inputClass} value={userForm.companyId} onChange={(e) => setUserForm(prev => ({ ...prev, companyId: e.target.value }))} required>
                <option value="">{t('backoffice.selectCompany')}</option>
                {companyOptions.map((company) => (
                  <option key={company.id} value={company.id}>{company.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{t('backoffice.permissions')}</label>
              <div className={checkboxesWrapClass}>
                {PERMISSION_KEYS.map((permission) => (
                  <label key={permission} className={checkboxClass}>
                    <input
                      type="checkbox"
                      checked={userForm.permissionKeys.includes(permission)}
                      onChange={() => setUserForm(prev => ({ ...prev, permissionKeys: toggleInArray(prev.permissionKeys, permission) }))}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button className={`${primaryButtonClass} mt-6`} type="submit">{t('backoffice.createUser')}</button>
        </form>
      </section>
      )}

      {activeTab === 'companies' && (
      <section className={sectionClass} style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
        <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.editCompany')}</h3>
        <div className="mb-4">
          <label className={labelClass}>{t('backoffice.company')}</label>
          <select className={inputClass} value={selectedCompanyId} onChange={(e) => onPickCompany(e.target.value)}>
            <option value="">{t('backoffice.selectCompanyShort')}</option>
            {companyOptions.map((company) => (
              <option key={company.id} value={company.id}>{company.label}</option>
            ))}
          </select>
        </div>
        {selectedCompany && (
          <form onSubmit={onUpdateCompany}>
            <div className="mb-4">
              <label className={labelClass}>{t('auth.name')}</label>
              <input className={inputClass} value={companyEdit.name} onChange={(e) => setCompanyEdit(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="mb-4">
              <label className={labelClass}>{t('backoffice.slug')}</label>
              <input className={inputClass} value={companyEdit.slug} readOnly />
            </div>
            <div className="mb-4">
              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input type="checkbox" checked={companyEdit.active} onChange={(e) => setCompanyEdit(prev => ({ ...prev, active: e.target.checked }))} />
                {t('backoffice.active')}
              </label>
            </div>
            <div className="mb-4">
              <label className={labelClass}>{t('backoffice.features')}</label>
              <div className={checkboxesWrapClass}>
                {FEATURE_KEYS.map((feature) => (
                  <label key={feature} className={checkboxClass}>
                    <input
                      type="checkbox"
                      checked={companyEdit.featureKeys.includes(feature)}
                      onChange={() => setCompanyEdit(prev => ({ ...prev, featureKeys: toggleInArray(prev.featureKeys, feature) }))}
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </div>
            <button className={`${primaryButtonClass} mt-2`} type="submit">{t('backoffice.updateCompany')}</button>
          </form>
        )}
      </section>
      )}

      {activeTab === 'users' && canReadUsers && canUpdateUsers && (
      <section className={sectionClass} style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
        <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.editUser')}</h3>
        <div className="mb-4">
          <label className={labelClass}>{t('backoffice.usersTab')}</label>
          <select className={inputClass} value={selectedUserId} onChange={(e) => onPickUser(e.target.value)}>
            <option value="">{t('backoffice.selectUser')}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.email}</option>
            ))}
          </select>
        </div>
        {selectedUser && (
          <form onSubmit={onUpdateUser}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t('auth.name')}</label>
                <input className={inputClass} value={userEdit.name} onChange={(e) => setUserEdit(prev => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>{t('auth.surname')}</label>
                <input className={inputClass} value={userEdit.surname} onChange={(e) => setUserEdit(prev => ({ ...prev, surname: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>{t('auth.email')}</label>
                <input className={inputClass} type="email" value={userEdit.email} onChange={(e) => setUserEdit(prev => ({ ...prev, email: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>{t('backoffice.language')}</label>
                <select
                  className={inputClass}
                  value={userEdit.language}
                  onChange={(e) => setUserEdit(prev => ({ ...prev, language: e.target.value }))}
                >
                  <option value="en">{t('ui.languageEnglish')}</option>
                  <option value="es">{t('ui.languageSpanish')}</option>
                  <option value="ca">{t('ui.languageCatalan')}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('backoffice.role')}</label>
                <select
                  className={inputClass}
                  value={userEdit.role}
                  onChange={(e) => {
                    const role = e.target.value
                    setUserEdit(prev => ({ ...prev, role, permissionKeys: permissionTemplateForRole(role) }))
                  }}
                >
                  <option value="staff">{t('roles.staff')}</option>
                  <option value="owner">{t('roles.owner')}</option>
                  <option value="admin">{t('roles.admin')}</option>
                  <option value="dispatcher">{t('roles.dispatcher')}</option>
                  <option value="viewer">{t('roles.viewer')}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('backoffice.company')}</label>
                <select className={inputClass} value={userEdit.companyId} onChange={(e) => setUserEdit(prev => ({ ...prev, companyId: e.target.value }))}>
                  <option value="">{t('backoffice.selectCompanyShort')}</option>
                  {companyOptions.map((company) => (
                    <option key={company.id} value={company.id}>{company.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{t('backoffice.permissions')}</label>
                <div className={checkboxesWrapClass}>
                  {PERMISSION_KEYS.map((permission) => (
                    <label key={permission} className={checkboxClass}>
                      <input
                        type="checkbox"
                        checked={userEdit.permissionKeys.includes(permission)}
                        onChange={() => setUserEdit(prev => ({ ...prev, permissionKeys: toggleInArray(prev.permissionKeys, permission) }))}
                      />
                      {permission}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button className={`${primaryButtonClass} mt-6`} type="submit">{t('backoffice.updateUser')}</button>
          </form>
        )}
      </section>
      )}

      {activeTab === 'users' && canReadUsers && (
      <section>
        <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.users')}</h3>
        <DataTable
          columns={USER_COLUMNS}
          rows={users}
          emptyMessage={t('backoffice.noUsers')}
          variant="flat"
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
      </div>
    </PageShell>
  )
}

export default Backoffice

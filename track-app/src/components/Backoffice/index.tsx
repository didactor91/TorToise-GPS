import React, { useEffect, useMemo, useState } from 'react'
import PageShell from '../shared/PageShell'
import DataTable, { Column } from '../shared/DataTable'
import { useBackoffice, BackofficeCompany, BackofficeTracker, BackofficeUser } from '../../hooks/useBackoffice'
import { FEATURE_KEYS, PERMISSION_KEYS, permissionTemplateForRole } from './access-catalog'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TRACKER_EMOJIS } from '../../common/emoji-options'

function toggleInArray(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

interface BackofficeProps {
  section: 'companies' | 'users' | 'trackers'
  mode: 'index' | 'create' | 'edit'
  entityId?: string
  canReadCompanies?: boolean
  canCreateCompanies?: boolean
  canUpdateCompanies?: boolean
  canReadUsers?: boolean
  canCreateUsers?: boolean
  canUpdateUsers?: boolean
  canDeleteUsers?: boolean
  canReadTrackers?: boolean
  canUpdateTrackers?: boolean
  canCreateTrackers?: boolean
  canDeleteTrackers?: boolean
}

function Backoffice({
  section,
  mode,
  entityId,
  canReadCompanies = true,
  canCreateCompanies = true,
  canUpdateCompanies = true,
  canReadUsers = true,
  canCreateUsers = true,
  canUpdateUsers = true,
  canDeleteUsers = true,
  canReadTrackers = true,
  canUpdateTrackers = true,
  canCreateTrackers = true,
  canDeleteTrackers = true
}: BackofficeProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-xl border px-3 py-2 text-sm outline-none transition'
  const primaryButtonClass = 'inline-flex items-center justify-center rounded-full border border-amber-500 bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:brightness-105'
  const checkboxClass = 'inline-flex items-center gap-2 text-sm text-[var(--text-primary)]'
  const sectionClass = 'pb-8 border-b space-y-4'
  const checkboxesWrapClass = 'flex flex-wrap gap-x-4 gap-y-2'

  const isCompaniesSection = section === 'companies'
  const isUsersSection = section === 'users'
  const isTrackersSection = section === 'trackers'
  const isIndexView = mode === 'index'
  const isCreateView = mode === 'create'
  const isEditView = mode === 'edit'
  const canSeeUsersSection = canReadUsers || canCreateUsers || canUpdateUsers || canDeleteUsers
  const canSeeTrackersSection = canReadTrackers || canCreateTrackers || canUpdateTrackers || canDeleteTrackers
  const shouldLoadUsers = isUsersSection && canReadUsers && isIndexView
  const shouldLoadTrackers = isTrackersSection && canReadTrackers && isIndexView

  const [usersPage, setUsersPage] = useState(1)
  const [trackersPage, setTrackersPage] = useState(1)
  const {
    companies,
    users,
    trackers,
    companyDetail,
    userDetail,
    trackerDetail,
    usersTotalCount,
    trackersTotalCount,
    loading,
    createCompany,
    createUser,
    createTracker,
    updateCompany,
    updateUser,
    updateTracker,
    deleteCompany,
    deleteUser,
    deleteTracker
  } = useBackoffice(
    usersPage,
    20,
    shouldLoadUsers,
    trackersPage,
    20,
    shouldLoadTrackers,
    isTrackersSection && isEditView ? entityId : undefined,
    isCompaniesSection && isEditView ? entityId : undefined,
    isUsersSection && isEditView ? entityId : undefined
  )

  const [companyForm, setCompanyForm] = useState({ name: '', active: true, featureKeys: [...FEATURE_KEYS] })
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
  const [trackerForm, setTrackerForm] = useState({ serialNumber: '', alias: '', emoji: '🚚', companyId: '' })

  const [companyEdit, setCompanyEdit] = useState({ name: '', slug: '', active: true, featureKeys: [] as string[] })
  const [userEdit, setUserEdit] = useState({
    name: '',
    surname: '',
    email: '',
    language: 'en',
    role: 'viewer',
    companyId: '',
    permissionKeys: [] as string[]
  })
  const [trackerAliasEdit, setTrackerAliasEdit] = useState('')
  const [trackerEmojiEdit, setTrackerEmojiEdit] = useState('🚚')

  const companyOptions = useMemo(
    () => companies.map((company) => ({ id: company.id, label: `${company.name} (${company.slug})` })),
    [companies]
  )

  useEffect(() => {
    if (!companyDetail) return
    setCompanyEdit({
      name: companyDetail.name,
      slug: companyDetail.slug,
      active: companyDetail.active,
      featureKeys: [...companyDetail.featureKeys]
    })
  }, [companyDetail?.id, companyDetail?.name, companyDetail?.slug, companyDetail?.active, companyDetail?.featureKeys])

  useEffect(() => {
    if (!userDetail) return
    setUserEdit({
      name: userDetail.name,
      surname: userDetail.surname,
      email: userDetail.email,
      language: userDetail.language || 'en',
      role: userDetail.role,
      companyId: userDetail.companyId || '',
      permissionKeys: [...userDetail.permissionKeys]
    })
  }, [userDetail?.id, userDetail?.name, userDetail?.surname, userDetail?.email, userDetail?.language, userDetail?.role, userDetail?.companyId, userDetail?.permissionKeys])

  useEffect(() => {
    if (!trackerDetail) return
    setTrackerAliasEdit(trackerDetail.alias || '')
    setTrackerEmojiEdit(trackerDetail.emoji || '🚚')
  }, [trackerDetail?.id, trackerDetail?.alias, trackerDetail?.emoji])

  const COMPANY_COLUMNS: Column<BackofficeCompany>[] = [
    { key: 'name', label: t('auth.name') },
    { key: 'slug', label: t('backoffice.slug') },
    { key: 'active', label: t('backoffice.active'), render: (row) => (row.active ? t('backoffice.yes') : t('backoffice.no')) },
    { key: 'featureKeys', label: t('backoffice.features'), render: (row) => row.featureKeys.join(', ') }
  ]
  const USER_COLUMNS: Column<BackofficeUser>[] = [
    { key: 'name', label: t('auth.name') },
    { key: 'surname', label: t('auth.surname') },
    { key: 'email', label: t('auth.email') },
    { key: 'language', label: t('backoffice.language') },
    { key: 'role', label: t('backoffice.role') },
    { key: 'companyId', label: t('backoffice.companyId') }
  ]
  const TRACKER_COLUMNS: Column<BackofficeTracker>[] = [
    { key: 'emoji', label: t('ui.emoji'), render: (row) => row.emoji || '🚚' },
    { key: 'serialNumber', label: t('trackers.serialNumber') },
    { key: 'alias', label: t('ui.alias') }
  ]

  const onCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCompany(companyForm.name, companyForm.active, companyForm.featureKeys)
    navigate('/backoffice/companies')
  }
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
    navigate('/backoffice/users')
  }
  const onCreateTracker = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTracker({
      serialNumber: trackerForm.serialNumber,
      alias: trackerForm.alias || undefined,
      emoji: trackerForm.emoji,
      companyId: trackerForm.companyId
    })
    navigate('/backoffice/trackers')
  }

  const onUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyDetail?.id) return
    await updateCompany(companyDetail.id, companyEdit.name, companyEdit.slug, companyEdit.active, companyEdit.featureKeys)
  }
  const onUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userDetail?.id) return
    await updateUser(userDetail.id, {
      name: userEdit.name,
      surname: userEdit.surname,
      email: userEdit.email,
      language: userEdit.language,
      role: userEdit.role,
      companyId: userEdit.companyId || undefined,
      permissionKeys: userEdit.permissionKeys
    })
  }
  const onUpdateTracker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackerDetail?.id || !trackerAliasEdit.trim()) return
    await updateTracker(trackerDetail.id, { alias: trackerAliasEdit.trim(), emoji: trackerEmojiEdit })
  }

  const askDelete = (label: string) => window.confirm(`${t('ui.delete')} "${label}"?`)

  const renderSectionTabs = () => (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        className={`rounded-full border px-3 py-1.5 text-sm font-medium ${isCompaniesSection ? 'bg-[var(--bg-glass-strong)] text-[var(--text-primary)]' : 'bg-[var(--bg-glass)] text-[var(--text-secondary)]'}`}
        onClick={() => navigate('/backoffice/companies')}
        type="button"
      >
        {t('backoffice.companies')}
      </button>
      {canSeeUsersSection && (
        <button
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${isUsersSection ? 'bg-[var(--bg-glass-strong)] text-[var(--text-primary)]' : 'bg-[var(--bg-glass)] text-[var(--text-secondary)]'}`}
          onClick={() => navigate('/backoffice/users')}
          type="button"
        >
          {t('backoffice.users')}
        </button>
      )}
      {canSeeTrackersSection && (
        <button
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${isTrackersSection ? 'bg-[var(--bg-glass-strong)] text-[var(--text-primary)]' : 'bg-[var(--bg-glass)] text-[var(--text-secondary)]'}`}
          onClick={() => navigate('/backoffice/trackers')}
          type="button"
        >
          {t('trackers.title')}
        </button>
      )}
    </div>
  )

  const renderBack = () => (
    <div className="mb-6">
      <button
        className="rounded-full border px-3 py-1.5 text-sm font-medium bg-[var(--bg-glass)] text-[var(--text-primary)]"
        onClick={() => navigate(`/backoffice/${section}`)}
        type="button"
      >
        {t('ui.back')}
      </button>
    </div>
  )

  const renderIndexActions = () => (
    <div className="mb-6 flex justify-end">
      {isCompaniesSection && canCreateCompanies && (
        <button className={primaryButtonClass} type="button" onClick={() => navigate('/backoffice/companies/new')}>{t('backoffice.createCompany')}</button>
      )}
      {isUsersSection && canCreateUsers && (
        <button className={primaryButtonClass} type="button" onClick={() => navigate('/backoffice/users/new')}>{t('backoffice.createUser')}</button>
      )}
      {isTrackersSection && canCreateTrackers && (
        <button className={primaryButtonClass} type="button" onClick={() => navigate('/backoffice/trackers/new')}>{t('backoffice.createTracker')}</button>
      )}
    </div>
  )

  const renderIndex = () => (
    <section className={sectionClass} style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
      {isCompaniesSection && (
        <DataTable
          columns={COMPANY_COLUMNS}
          rows={companies}
          emptyMessage={t('backoffice.noCompanies')}
          variant="flat"
          onEdit={canUpdateCompanies ? (company) => navigate(`/backoffice/companies/${company.id}`) : undefined}
          onDelete={canUpdateCompanies ? async (company) => { if (askDelete(company.name)) await deleteCompany(company.id) } : undefined}
        />
      )}
      {isUsersSection && (
        <DataTable
          columns={USER_COLUMNS}
          rows={users}
          emptyMessage={t('backoffice.noUsers')}
          variant="flat"
          onEdit={canUpdateUsers ? (user) => navigate(`/backoffice/users/${user.id}`) : undefined}
          onDelete={canDeleteUsers ? async (user) => { if (askDelete(user.email)) await deleteUser(user.id) } : undefined}
          pageSize={20}
          serverPagination={{
            enabled: true,
            currentPage: usersPage,
            totalCount: usersTotalCount,
            onPageChange: setUsersPage
          }}
        />
      )}
      {isTrackersSection && (
        <DataTable
          columns={TRACKER_COLUMNS}
          rows={trackers}
          emptyMessage={t('trackers.empty')}
          variant="flat"
          onEdit={canUpdateTrackers ? (tracker) => navigate(`/backoffice/trackers/${tracker.id}`) : undefined}
          onDelete={canDeleteTrackers ? async (tracker) => { if (askDelete(tracker.alias || tracker.serialNumber)) await deleteTracker(tracker.id) } : undefined}
          pageSize={20}
          serverPagination={{
            enabled: true,
            currentPage: trackersPage,
            totalCount: trackersTotalCount,
            onPageChange: setTrackersPage
          }}
        />
      )}
    </section>
  )

  const renderCreate = () => (
    <section className={sectionClass} style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
      {isCompaniesSection && canCreateCompanies && (
        <form onSubmit={onCreateCompany}>
          <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.createCompany')}</h3>
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
                  <input type="checkbox" checked={companyForm.featureKeys.includes(feature)} onChange={() => setCompanyForm(prev => ({ ...prev, featureKeys: toggleInArray(prev.featureKeys, feature) }))} />
                  {feature}
                </label>
              ))}
            </div>
          </div>
          <button className={`${primaryButtonClass} mt-2`} type="submit">{t('backoffice.createCompany')}</button>
        </form>
      )}
      {isUsersSection && canCreateUsers && (
        <form onSubmit={onCreateUser}>
          <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.createUser')}</h3>
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
              <select className={inputClass} value={userForm.language} onChange={(e) => setUserForm(prev => ({ ...prev, language: e.target.value }))}>
                <option value="en">{t('ui.languageEnglish')}</option>
                <option value="es">{t('ui.languageSpanish')}</option>
                <option value="ca">{t('ui.languageCatalan')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('backoffice.role')}</label>
              <select className={inputClass} value={userForm.role} onChange={(e) => {
                const role = e.target.value
                setUserForm(prev => ({ ...prev, role, permissionKeys: permissionTemplateForRole(role) }))
              }}>
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
                    <input type="checkbox" checked={userForm.permissionKeys.includes(permission)} onChange={() => setUserForm(prev => ({ ...prev, permissionKeys: toggleInArray(prev.permissionKeys, permission) }))} />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button className={`${primaryButtonClass} mt-6`} type="submit">{t('backoffice.createUser')}</button>
        </form>
      )}
      {isTrackersSection && canCreateTrackers && (
        <form onSubmit={onCreateTracker}>
          <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.createTracker')}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>{t('trackers.serialNumber')}</label>
              <input className={inputClass} value={trackerForm.serialNumber} onChange={(e) => setTrackerForm(prev => ({ ...prev, serialNumber: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>{t('ui.alias')}</label>
              <input className={inputClass} value={trackerForm.alias} onChange={(e) => setTrackerForm(prev => ({ ...prev, alias: e.target.value }))} placeholder={t('ui.optional')} />
            </div>
            <div>
              <label className={labelClass}>{t('ui.emoji')}</label>
              <select className={inputClass} value={trackerForm.emoji} onChange={(e) => setTrackerForm(prev => ({ ...prev, emoji: e.target.value }))}>
                {TRACKER_EMOJIS.map((option) => (
                  <option key={option.value} value={option.value}>{option.value} {option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('backoffice.company')}</label>
              <select className={inputClass} value={trackerForm.companyId} onChange={(e) => setTrackerForm(prev => ({ ...prev, companyId: e.target.value }))} required>
                <option value="">{t('backoffice.selectCompany')}</option>
                {companyOptions.map((company) => (
                  <option key={company.id} value={company.id}>{company.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button className={`${primaryButtonClass} mt-6`} type="submit">{t('backoffice.createTracker')}</button>
        </form>
      )}
    </section>
  )

  const renderEdit = () => (
    <section className={sectionClass} style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
      {isCompaniesSection && canUpdateCompanies && (
        <>
          <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.editCompany')}</h3>
          {companyDetail ? (
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
                      <input type="checkbox" checked={companyEdit.featureKeys.includes(feature)} onChange={() => setCompanyEdit(prev => ({ ...prev, featureKeys: toggleInArray(prev.featureKeys, feature) }))} />
                      {feature}
                    </label>
                  ))}
                </div>
              </div>
              <button className={`${primaryButtonClass} mt-2`} type="submit">{t('backoffice.updateCompany')}</button>
            </form>
          ) : <p className="text-sm text-[var(--text-muted)]">{t('ui.loading')}</p>}
        </>
      )}
      {isUsersSection && canUpdateUsers && (
        <>
          <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.editUser')}</h3>
          {userDetail ? (
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
                  <select className={inputClass} value={userEdit.language} onChange={(e) => setUserEdit(prev => ({ ...prev, language: e.target.value }))}>
                    <option value="en">{t('ui.languageEnglish')}</option>
                    <option value="es">{t('ui.languageSpanish')}</option>
                    <option value="ca">{t('ui.languageCatalan')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('backoffice.role')}</label>
                  <select className={inputClass} value={userEdit.role} onChange={(e) => {
                    const role = e.target.value
                    setUserEdit(prev => ({ ...prev, role, permissionKeys: permissionTemplateForRole(role) }))
                  }}>
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
                        <input type="checkbox" checked={userEdit.permissionKeys.includes(permission)} onChange={() => setUserEdit(prev => ({ ...prev, permissionKeys: toggleInArray(prev.permissionKeys, permission) }))} />
                        {permission}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button className={`${primaryButtonClass} mt-6`} type="submit">{t('backoffice.updateUser')}</button>
            </form>
          ) : <p className="text-sm text-[var(--text-muted)]">{t('ui.loading')}</p>}
        </>
      )}
      {isTrackersSection && canUpdateTrackers && (
        <>
          <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t('backoffice.editTrackerAlias')}</h3>
          {trackerDetail ? (
            <form onSubmit={onUpdateTracker}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t('trackers.serialNumber')}</label>
                  <input className={inputClass} value={trackerDetail.serialNumber} readOnly />
                </div>
                <div>
                  <label className={labelClass}>{t('ui.emoji')}</label>
                  <select className={inputClass} value={trackerEmojiEdit} onChange={(e) => setTrackerEmojiEdit(e.target.value)}>
                    {TRACKER_EMOJIS.map((option) => (
                      <option key={option.value} value={option.value}>{option.value} {option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>{t('ui.alias')}</label>
                  <input className={inputClass} value={trackerAliasEdit} onChange={(e) => setTrackerAliasEdit(e.target.value)} required />
                </div>
              </div>
              <button className={`${primaryButtonClass} mt-6`} type="submit">{t('backoffice.updateTrackerAlias')}</button>
            </form>
          ) : <p className="text-sm text-[var(--text-muted)]">{t('ui.loading')}</p>}
        </>
      )}
    </section>
  )

  return (
    <PageShell title={t('backoffice.title')}>
      {loading && <p className="text-center text-[var(--text-muted)]">{t('backoffice.loading')}</p>}
      {renderSectionTabs()}
      {!isIndexView && renderBack()}
      {isIndexView && renderIndexActions()}
      <div className="space-y-8">
        {isIndexView && renderIndex()}
        {isCreateView && renderCreate()}
        {isEditView && renderEdit()}
      </div>
    </PageShell>
  )
}

export default Backoffice

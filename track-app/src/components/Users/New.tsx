import React from 'react'
import PageShell from '../shared/PageShell'
import { useAddUser } from '../../hooks/useAddUser'
import { useTranslation } from 'react-i18next'

function UsersNew() {
  const { t } = useTranslation()
  const { addUser } = useAddUser()
  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-full border px-4 py-2 text-sm outline-none transition'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const surname = (form.elements.namedItem('surname') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const language = (form.elements.namedItem('language') as HTMLSelectElement).value
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value
    addUser({ name, surname, email, password, language, role })
  }

  return (
    <PageShell title={t('users.newUser')} backTo="/users">
      <form onSubmit={handleSubmit} className="mx-auto max-w-[520px] space-y-4">
        <div>
          <label className={labelClass}>{t('auth.name')}</label>
          <input className={inputClass} type="text" name="name" required autoFocus />
        </div>
        <div>
          <label className={labelClass}>{t('auth.surname')}</label>
          <input className={inputClass} type="text" name="surname" required />
        </div>
        <div>
          <label className={labelClass}>{t('auth.email')}</label>
          <input className={inputClass} type="email" name="email" required />
        </div>
        <div>
          <label className={labelClass}>{t('auth.password')}</label>
          <input className={inputClass} type="password" name="password" minLength={8} required />
        </div>
        <div>
          <label className={labelClass}>{t('ui.role')}</label>
          <select name="role" defaultValue="viewer" className={inputClass}>
            <option value="owner">{t('roles.owner')}</option>
            <option value="admin">{t('roles.admin')}</option>
            <option value="dispatcher">{t('roles.dispatcher')}</option>
            <option value="viewer">{t('roles.viewer')}</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('profile.language')}</label>
          <select name="language" defaultValue="en" className={inputClass}>
            <option value="en">{t('ui.languageEnglish')}</option>
            <option value="es">{t('ui.languageSpanish')}</option>
            <option value="ca">{t('ui.languageCatalan')}</option>
          </select>
        </div>
        <div className="pt-2">
          <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105" type="submit">
            {t('users.createUser')}
          </button>
        </div>
      </form>
    </PageShell>
  )
}

export default UsersNew

import React from 'react'
import PageShell from '../shared/PageShell'
import { useProfile } from '../../hooks/useProfile'
import { UpdateUserInput } from '../../generated/graphql'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

interface ProfileProps {
  darkmode: boolean
  onDarkMode: () => void
}

function Profile({ darkmode, onDarkMode }: ProfileProps) {
  const { t } = useTranslation()
  const { user, updateUser, deleteUser } = useProfile()
  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-full border px-4 py-2 text-sm outline-none transition'

  function handleSubmitUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const surname = (form.elements.namedItem('surname') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const language = (form.elements.namedItem('language') as HTMLSelectElement).value
    const input: UpdateUserInput = {}
    if (name) input.name = name
    if (surname) input.surname = surname
    if (email) input.email = email
    if (language) input.language = language
    updateUser(input)
  }

  function handleSubmitDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    deleteUser()
  }

  function handleSubmitChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordsDontMatch'))
      return
    }
    if (!currentPassword || !newPassword) {
      toast.error(t('profile.passwordRequired'))
      return
    }

    updateUser({ currentPassword, newPassword })
    form.reset()
  }

  return (
    <PageShell title={t('profile.title')}>
      <div className="space-y-8">
        <section className="border-b pb-8" style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
          <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">
            {t('profile.updateDetails')}
          </h3>
          <form onSubmit={handleSubmitUpdate}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t('auth.name')}</label>
                <input
                  className={inputClass}
                  type="text"
                  name="name"
                  placeholder={user ? user.name : t('auth.name')}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>{t('auth.surname')}</label>
                <input
                  className={inputClass}
                  type="text"
                  name="surname"
                  placeholder={user ? user.surname : t('auth.surname')}
                />
              </div>
              <div>
                <label className={labelClass}>{t('auth.email')}</label>
                <input
                  className={inputClass}
                  type="email"
                  name="email"
                  placeholder={user ? user.email : t('auth.email')}
                />
              </div>
              <div>
                <label className={labelClass}>{t('profile.language')}</label>
                <select className={inputClass} name="language" defaultValue={user?.language || 'en'}>
                  <option value="en">{t('ui.languageEnglish')}</option>
                  <option value="es">{t('ui.languageSpanish')}</option>
                  <option value="ca">{t('ui.languageCatalan')}</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105" type="submit">
                  {t('profile.update')}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="border-b pb-8" style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
          <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">
            {t('nav.toggleTheme')}
          </h3>
          <div className="flex max-w-sm flex-col gap-3">
            <label className={labelClass} htmlFor="theme-select">
              {t('nav.toggleTheme')}
            </label>
            <select
              id="theme-select"
              className={inputClass}
              value={darkmode ? 'dark' : 'light'}
              onChange={(e) => {
                const nextIsDark = e.target.value === 'dark'
                if (nextIsDark !== darkmode) onDarkMode()
              }}
            >
              <option value="light">{t('nav.themeLight')}</option>
              <option value="dark">{t('nav.themeDark')}</option>
            </select>
          </div>
        </section>

        <section className="border-b pb-8" style={{ borderColor: 'color-mix(in srgb, var(--border-default) 75%, transparent)' }}>
          <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">
            {t('profile.changePassword')}
          </h3>
          <form onSubmit={handleSubmitChangePassword}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t('profile.currentPassword')}</label>
                <input className={inputClass} type="password" name="currentPassword" required />
              </div>
              <div>
                <label className={labelClass}>{t('profile.newPassword')}</label>
                <input className={inputClass} type="password" name="newPassword" minLength={6} required />
              </div>
              <div>
                <label className={labelClass}>{t('profile.confirmNewPassword')}</label>
                <input className={inputClass} type="password" name="confirmPassword" minLength={6} required />
              </div>
              <div className="flex items-end">
                <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105" type="submit">
                  {t('profile.updatePassword')}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-xl border p-4" style={{ borderColor: 'rgba(239, 68, 68, 0.45)', background: 'color-mix(in srgb, rgba(239,68,68,0.12) 70%, transparent)' }}>
          <h3 className="mb-3 text-xl font-bold" style={{ color: 'var(--color-status-off)' }}>
            {t('profile.dangerZone')}
          </h3>
          <p className="mb-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('profile.dangerText')}
          </p>
          <form onSubmit={handleSubmitDelete}>
            <div className="flex flex-col items-end gap-3 md:flex-row">
              <div className="w-full">
                <input
                  className={inputClass}
                  type="text"
                  name="accept"
                  placeholder={t('profile.acceptPlaceholder')}
                  pattern="ACCEPT"
                  required
                />
              </div>
              <div className="w-full md:w-auto">
                <button className="w-full rounded-full border border-red-700 bg-transparent px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 md:w-auto" type="submit">
                  {t('profile.deleteAccount')}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </PageShell>
  )
}

export default Profile

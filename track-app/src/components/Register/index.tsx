import React from 'react'
import AuthShell from '../shared/AuthShell'
import { useTranslation } from 'react-i18next'

interface Props {
  onRegister: (name: string, surname: string, email: string, password: string) => void
  onBack: () => void
}

function Register({ onRegister, onBack }: Props) {
  const { t } = useTranslation()
  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-full border px-4 py-2 text-sm outline-none transition'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name     = (form.elements.namedItem('name') as HTMLInputElement).value
    const surname  = (form.elements.namedItem('surname') as HTMLInputElement).value
    const email    = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const password2 = (form.elements.namedItem('password2') as HTMLInputElement).value
    if (password !== password2) {
      alert(t('auth.passwordMismatch'))
      return
    }
    onRegister(name, surname, email, password)
  }

  return (
    <AuthShell>
      <h2 className="mb-6 text-center text-2xl font-bold text-[var(--text-primary)]">
        {t('auth.createAccount')}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>{t('auth.name')}</label>
          <input className={inputClass} type="text" name="name" placeholder={t('auth.namePlaceholder')} autoFocus required />
        </div>
        <div>
          <label className={labelClass}>{t('auth.surname')}</label>
          <input className={inputClass} type="text" name="surname" placeholder={t('auth.surnamePlaceholder')} required />
        </div>
        <div>
          <label className={labelClass}>{t('auth.email')}</label>
          <input className={inputClass} type="email" name="email" placeholder={t('auth.emailPlaceholder')} required />
        </div>
        <div>
          <label className={labelClass}>{t('auth.password')}</label>
          <input className={inputClass} type="password" name="password" placeholder={t('auth.minPassword')} minLength={8} required />
        </div>
        <div>
          <label className={labelClass}>{t('auth.confirmPassword')}</label>
          <input className={inputClass} type="password" name="password2" placeholder={t('auth.repeatPassword')} required />
        </div>
        <div className="pt-2">
          <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105" type="submit">
            {t('auth.createAccount')}
          </button>
        </div>
        <div className="mt-3 text-center">
          <button type="button" className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-glass)]" onClick={onBack}>
            ← {t('auth.backHome')}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}

export default Register

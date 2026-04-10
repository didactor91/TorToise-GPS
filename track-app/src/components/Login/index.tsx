import React from 'react'
import AuthShell from '../shared/AuthShell'
import { useTranslation } from 'react-i18next'

interface Props {
  onLogin: (email: string, password: string) => void
  onBack: () => void
}

function Login({ onLogin, onBack }: Props) {
  const { t } = useTranslation()
  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-full border px-4 py-2 text-sm outline-none transition'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email    = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    onLogin(email, password)
  }

  return (
    <AuthShell>
      <h2 className="mb-6 text-center text-2xl font-bold text-[var(--text-primary)]">
        {t('auth.welcomeBack')}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>{t('auth.email')}</label>
          <input className={inputClass} type="email" name="email" placeholder={t('auth.emailPlaceholder')} autoFocus required />
        </div>
        <div>
          <label className={labelClass}>{t('auth.password')}</label>
          <input className={inputClass} type="password" name="password" placeholder={t('auth.passwordPlaceholder')} required />
        </div>
        <div className="pt-2">
          <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105" type="submit">
            {t('landing.login')}
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

export default Login

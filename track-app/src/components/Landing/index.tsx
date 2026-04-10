import React from 'react'
import AuthShell from '../shared/AuthShell'
import logo from '../../common/img/logo.png'
import { useTranslation } from 'react-i18next'

interface Props {
  onLogin: () => void
}

function Landing({ onLogin }: Props) {
  const { t } = useTranslation()

  return (
    <AuthShell>
      <div className="text-center">
        <img src={logo} alt={t('app.brandName')} style={{ height: '4rem', marginBottom: '1rem' }} />
        <h1 className="mb-1 text-4xl font-bold text-[var(--text-primary)]">
          TorToise GPS
        </h1>
        <p className="mb-8 text-lg text-[var(--text-secondary)]">
          {t('landing.tagline')}
        </p>
        <div className="flex justify-center">
          <button className="rounded-full border border-amber-500 bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:brightness-105" onClick={onLogin}>
            {t('landing.login')}
          </button>
        </div>
      </div>
    </AuthShell>
  )
}

export default Landing

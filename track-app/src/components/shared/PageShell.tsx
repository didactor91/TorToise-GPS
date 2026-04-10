import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './PageShell.sass'

interface PageShellProps {
  title: string
  backTo?: string
  actionLabel?: string
  onAction?: () => void
  children: React.ReactNode
}

function PageShell({ title, backTo, actionLabel, onAction, children }: PageShellProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <main className="page-shell">
      <div className="page-shell__header">
        <div className="page-shell__header-left">
          {backTo && (
            <button
              className="inline-flex items-center justify-center rounded-full border border-amber-500 bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:brightness-105"
              onClick={() => navigate(backTo)}
            >
              ← {t('ui.back')}
            </button>
          )}
        </div>
        <h2 className="page-shell__title">{title}</h2>
        <div className="page-shell__header-right">
          {actionLabel && onAction && (
            <button
              className="inline-flex items-center justify-center rounded-full border border-amber-500 bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:brightness-105"
              onClick={onAction}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      <div className="page-shell__content">
        {children}
      </div>
    </main>
  )
}

export default PageShell

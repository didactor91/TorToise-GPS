import React from 'react'
import { useNavigate } from 'react-router-dom'
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

  return (
    <main className="page-shell">
      <div className="page-shell__header">
        <div className="page-shell__header-left">
          {backTo && (
            <button
              className="button is-warning is-rounded is-small"
              onClick={() => navigate(backTo)}
            >
              ← Back
            </button>
          )}
        </div>
        <h2 className="page-shell__title title">{title}</h2>
        <div className="page-shell__header-right">
          {actionLabel && onAction && (
            <button
              className="button is-warning is-rounded is-small"
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

import React from 'react'
import './AuthShell.sass'

interface AuthShellProps {
  children: React.ReactNode
  /** Show the TorToise GPS logo/brand in the background hero */
  hero?: React.ReactNode
}

function AuthShell({ children, hero }: AuthShellProps) {
  return (
    <section className="auth-shell">
      {hero && <div className="auth-shell__hero">{hero}</div>}
      <div className="auth-shell__card glass-card">
        {children}
      </div>
    </section>
  )
}

export default AuthShell

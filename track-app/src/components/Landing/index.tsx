import React from 'react'
import AuthShell from '../shared/AuthShell'
import logo from '../../common/img/logo.png'

interface Props {
  onRegister: () => void
  onLogin: () => void
}

function Landing({ onRegister, onLogin }: Props) {
  return (
    <AuthShell>
      <div style={{ textAlign: 'center' }}>
        <img src={logo} alt="TorToise GPS" style={{ height: '4rem', marginBottom: '1rem' }} />
        <h1 className="title is-2" style={{ color: 'var(--color-text-dark)', marginBottom: '0.25rem' }}>
          TorToise GPS
        </h1>
        <p className="subtitle is-5" style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          Real-time fleet tracking
        </p>
        <div className="buttons is-centered">
          <button className="button is-warning is-rounded is-medium" onClick={onLogin}>
            <strong>Log In</strong>
          </button>
          <button className="button is-outlined is-rounded is-medium" onClick={onRegister}>
            Create account
          </button>
        </div>
      </div>
    </AuthShell>
  )
}

export default Landing

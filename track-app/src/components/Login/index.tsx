import React from 'react'
import AuthShell from '../shared/AuthShell'

interface Props {
  onLogin: (email: string, password: string) => void
  onBack: () => void
}

function Login({ onLogin, onBack }: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email    = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    onLogin(email, password)
  }

  return (
    <AuthShell>
      <h2 className="title is-4" style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-text-dark)' }}>
        Welcome back
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Email</label>
          <div className="control">
            <input className="input is-rounded" type="email" name="email" placeholder="you@example.com" autoFocus required />
          </div>
        </div>
        <div className="field">
          <label className="label">Password</label>
          <div className="control">
            <input className="input is-rounded" type="password" name="password" placeholder="••••••••" required />
          </div>
        </div>
        <div className="field mt-5">
          <div className="control">
            <button className="button is-warning is-rounded is-fullwidth" type="submit">
              <strong>Log In</strong>
            </button>
          </div>
        </div>
        <div className="has-text-centered mt-3">
          <button type="button" className="button is-ghost is-small" onClick={onBack}>
            ← Back to home
          </button>
        </div>
      </form>
    </AuthShell>
  )
}

export default Login

import React from 'react'
import AuthShell from '../shared/AuthShell'

interface Props {
  onRegister: (name: string, surname: string, email: string, password: string) => void
  onBack: () => void
}

function Register({ onRegister, onBack }: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name     = (form.elements.namedItem('name') as HTMLInputElement).value
    const surname  = (form.elements.namedItem('surname') as HTMLInputElement).value
    const email    = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const password2 = (form.elements.namedItem('password2') as HTMLInputElement).value
    if (password !== password2) {
      alert('Passwords do not match')
      return
    }
    onRegister(name, surname, email, password)
  }

  return (
    <AuthShell>
      <h2 className="title is-4" style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-text-dark)' }}>
        Create account
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Name</label>
          <div className="control">
            <input className="input is-rounded" type="text" name="name" placeholder="John" autoFocus required />
          </div>
        </div>
        <div className="field">
          <label className="label">Surname</label>
          <div className="control">
            <input className="input is-rounded" type="text" name="surname" placeholder="Doe" required />
          </div>
        </div>
        <div className="field">
          <label className="label">Email</label>
          <div className="control">
            <input className="input is-rounded" type="email" name="email" placeholder="you@example.com" required />
          </div>
        </div>
        <div className="field">
          <label className="label">Password</label>
          <div className="control">
            <input className="input is-rounded" type="password" name="password" placeholder="Min. 8 characters" minLength={8} required />
          </div>
        </div>
        <div className="field">
          <label className="label">Confirm Password</label>
          <div className="control">
            <input className="input is-rounded" type="password" name="password2" placeholder="Repeat password" required />
          </div>
        </div>
        <div className="field mt-5">
          <div className="control">
            <button className="button is-warning is-rounded is-fullwidth" type="submit">
              <strong>Create account</strong>
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

export default Register

import React from 'react'
import PageShell from '../shared/PageShell'
import { useProfile } from '../../hooks/useProfile'
import { UpdateUserInput } from '../../generated/graphql'
import { toast } from 'react-toastify'

function Profile() {
  const { user, updateUser, deleteUser } = useProfile()

  function handleSubmitUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const surname = (form.elements.namedItem('surname') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const input: UpdateUserInput = {}
    if (name) input.name = name
    if (surname) input.surname = surname
    if (email) input.email = email
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
      toast.error('New password and confirmation do not match.')
      return
    }
    if (!currentPassword || !newPassword) {
      toast.error('Current password and new password are required.')
      return
    }

    updateUser({ currentPassword, newPassword })
    form.reset()
  }

  return (
    <PageShell title="My Profile">
      {/* ── Update section ── */}
      <section className="glass-section">
      <h3 className="title is-5" style={{ color: 'var(--color-text-dark)', marginBottom: '1rem' }}>
        Update Details
      </h3>
      <form onSubmit={handleSubmitUpdate} className="glass-form">
        <div className="columns is-multiline">
          <div className="column is-half">
            <div className="field">
              <label className="label">Name</label>
              <div className="control">
                <input
                  className="input is-rounded"
                  type="text"
                  name="name"
                  placeholder={user ? user.name : 'Name'}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="column is-half">
            <div className="field">
              <label className="label">Surname</label>
              <div className="control">
                <input
                  className="input is-rounded"
                  type="text"
                  name="surname"
                  placeholder={user ? user.surname : 'Surname'}
                />
              </div>
            </div>
          </div>
          <div className="column is-half">
            <div className="field">
              <label className="label">Email</label>
              <div className="control">
                <input
                  className="input is-rounded"
                  type="email"
                  name="email"
                  placeholder={user ? user.email : 'Email'}
                />
              </div>
            </div>
          </div>
          <div className="column is-half" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div className="field" style={{ width: '100%' }}>
              <div className="control">
                <button className="button is-warning is-rounded is-fullwidth" type="submit">
                  <strong>Update</strong>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      </section>

      <section className="glass-section">
      <h3 className="title is-5" style={{ color: 'var(--color-text-dark)', marginBottom: '1rem' }}>
        Change Password
      </h3>
      <form onSubmit={handleSubmitChangePassword} className="glass-form">
        <div className="columns is-multiline">
          <div className="column is-half">
            <div className="field">
              <label className="label">Current password</label>
              <div className="control">
                <input className="input is-rounded" type="password" name="currentPassword" required />
              </div>
            </div>
          </div>
          <div className="column is-half">
            <div className="field">
              <label className="label">New password</label>
              <div className="control">
                <input className="input is-rounded" type="password" name="newPassword" minLength={6} required />
              </div>
            </div>
          </div>
          <div className="column is-half">
            <div className="field">
              <label className="label">Confirm new password</label>
              <div className="control">
                <input className="input is-rounded" type="password" name="confirmPassword" minLength={6} required />
              </div>
            </div>
          </div>
          <div className="column is-half" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div className="field" style={{ width: '100%' }}>
              <div className="control">
                <button className="button is-warning is-rounded is-fullwidth" type="submit">
                  <strong>Update Password</strong>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      </section>

      {/* ── Danger zone ── */}
      <div className="box glass-section" style={{ border: '1px solid rgba(239, 68, 68, 0.45)', background: 'rgba(255, 236, 236, 0.4)' }}>
        <h3 className="title is-5" style={{ color: 'var(--color-status-off)', marginBottom: '0.75rem' }}>
          ⚠ Danger Zone
        </h3>
        <p className="help" style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
          This process is irreversible and will permanently delete all of your data.
        </p>
        <form onSubmit={handleSubmitDelete}>
          <div className="columns is-vcentered">
            <div className="column">
              <div className="field">
                <div className="control">
                  <input
                    className="input is-rounded is-danger"
                    type="text"
                    name="accept"
                    placeholder='Type "ACCEPT" to confirm'
                    pattern="ACCEPT"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="column is-narrow">
              <div className="field">
                <div className="control">
                  <button className="button is-danger is-rounded is-outlined" type="submit">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageShell>
  )
}

export default Profile

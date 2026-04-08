import React from 'react'
import PageShell from '../shared/PageShell'
import { useAddUser } from '../../hooks/useAddUser'

function UsersNew() {
  const { addUser } = useAddUser()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const surname = (form.elements.namedItem('surname') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value
    addUser({ name, surname, email, password, role })
  }

  return (
    <PageShell title="New User" backTo="/users">
      <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="field">
          <label className="label">Name</label>
          <div className="control">
            <input className="input is-rounded is-warning" type="text" name="name" required autoFocus />
          </div>
        </div>
        <div className="field">
          <label className="label">Surname</label>
          <div className="control">
            <input className="input is-rounded is-warning" type="text" name="surname" required />
          </div>
        </div>
        <div className="field">
          <label className="label">Email</label>
          <div className="control">
            <input className="input is-rounded is-warning" type="email" name="email" required />
          </div>
        </div>
        <div className="field">
          <label className="label">Password</label>
          <div className="control">
            <input className="input is-rounded is-warning" type="password" name="password" minLength={8} required />
          </div>
        </div>
        <div className="field">
          <label className="label">Role</label>
          <div className="control select is-fullwidth">
            <select name="role" defaultValue="viewer">
              <option value="owner">owner</option>
              <option value="admin">admin</option>
              <option value="dispatcher">dispatcher</option>
              <option value="viewer">viewer</option>
            </select>
          </div>
        </div>
        <div className="field mt-4">
          <div className="control">
            <button className="button is-warning is-rounded is-fullwidth" type="submit">
              Create User
            </button>
          </div>
        </div>
      </form>
    </PageShell>
  )
}

export default UsersNew

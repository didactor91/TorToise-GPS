import React from 'react'
import PageShell from '../shared/PageShell'
import { useAddTracker } from '../../hooks/useAddTracker'

function TrackingsNew() {
  const { addTracker } = useAddTracker()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const serialNumber = (form.elements.namedItem('serialNumber') as HTMLInputElement).value
    const licensePlate = (form.elements.namedItem('licensePlate') as HTMLInputElement).value
    addTracker({ serialNumber, licensePlate: licensePlate || null })
    form.reset()
  }

  return (
    <PageShell title="New Tracker" backTo="/trackers">
      <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '0 auto' }}>
        <div className="field">
          <label className="label">Serial Number</label>
          <div className="control">
            <input
              className="input is-rounded is-warning"
              type="text"
              name="serialNumber"
              placeholder="9900110011"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">License Plate <span className="has-text-grey is-size-7">(optional)</span></label>
          <div className="control">
            <input
              className="input is-rounded is-warning"
              type="text"
              name="licensePlate"
              placeholder="1234-ABC-001"
            />
          </div>
        </div>

        <div className="field mt-4">
          <div className="control">
            <button className="button is-warning is-rounded is-fullwidth" type="submit">
              Add Tracker
            </button>
          </div>
        </div>
      </form>
    </PageShell>
  )
}

export default TrackingsNew

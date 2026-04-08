import React from 'react'
import PageShell from '../shared/PageShell'
import { useAddPOI } from '../../hooks/useAddPOI'

function PlacesNew() {
  const { addPOI } = useAddPOI()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const title = (form.elements.namedItem('title') as HTMLInputElement).value
    const latitude = parseFloat((form.elements.namedItem('latitude') as HTMLInputElement).value)
    const longitude = parseFloat((form.elements.namedItem('longitude') as HTMLInputElement).value)
    const color = (form.elements.namedItem('color') as HTMLSelectElement).value
    addPOI({ title, color, latitude, longitude })
    form.reset()
  }

  return (
    <PageShell title="New Point of Interest" backTo="/places">
      <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '0 auto' }}>
        <div className="field">
          <label className="label">Title</label>
          <div className="control">
            <input
              className="input is-rounded is-warning"
              type="text"
              name="title"
              placeholder="Barcelona depot"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Latitude</label>
          <div className="control">
            <input
              className="input is-rounded is-warning"
              type="number"
              name="latitude"
              placeholder="41.3879"
              step="any"
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Longitude</label>
          <div className="control">
            <input
              className="input is-rounded is-warning"
              type="number"
              name="longitude"
              placeholder="2.1699"
              step="any"
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Marker Color</label>
          <div className="control">
            <div className="select is-rounded is-warning is-fullwidth">
              <select name="color" defaultValue="blue">
                <option value="blue">Blue</option>
                <option value="lightblue">Light Blue</option>
                <option value="orange">Orange</option>
                <option value="purple">Purple</option>
                <option value="red">Red</option>
                <option value="yellow">Yellow</option>
              </select>
            </div>
          </div>
        </div>

        <div className="field mt-4">
          <div className="control">
            <button className="button is-warning is-rounded is-fullwidth" type="submit">
              Create POI
            </button>
          </div>
        </div>
      </form>
    </PageShell>
  )
}

export default PlacesNew

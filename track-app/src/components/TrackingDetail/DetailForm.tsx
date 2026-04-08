import React from 'react'

interface DetailFormProps {
  onSubmitDetail: (dateFrom: string, timeFrom: string, dateTo: string, timeTo: string) => void
  licensePlate?: string | null
  serialNumber?: string
}

function DetailForm({ onSubmitDetail, licensePlate, serialNumber }: DetailFormProps) {

  function handleSubmitDetail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const dateFrom = (form.elements.namedItem('dateFrom') as HTMLInputElement).value
    const timeFrom = (form.elements.namedItem('timeFrom') as HTMLInputElement).value
    const dateTo = (form.elements.namedItem('dateTo') as HTMLInputElement).value
    const timeTo = (form.elements.namedItem('timeTo') as HTMLInputElement).value
    onSubmitDetail(dateFrom, timeFrom, dateTo, timeTo)
  }

  return (
    <section>
      <h2 className="tracking-detail__title title">{licensePlate}</h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        {serialNumber}
      </p>
      <hr />
      <form onSubmit={handleSubmitDetail}>
        <p className="label" style={{ marginBottom: 'var(--space-2)' }}>From</p>
        <div className="field">
          <div className="control">
            <input className="input is-rounded is-small" type="date" name="dateFrom" autoFocus required />
          </div>
        </div>
        <div className="field">
          <div className="control">
            <input className="input is-rounded is-small" type="time" name="timeFrom" required />
          </div>
        </div>
        <hr />
        <p className="label" style={{ marginBottom: 'var(--space-2)' }}>To</p>
        <div className="field">
          <div className="control">
            <input className="input is-rounded is-small" type="date" name="dateTo" required />
          </div>
        </div>
        <div className="field">
          <div className="control">
            <input className="input is-rounded is-small" type="time" name="timeTo" required />
          </div>
        </div>
        <div className="field mt-4">
          <div className="control">
            <button className="button is-warning is-rounded is-fullwidth" type="submit">
              <strong>Search</strong>
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

export default DetailForm

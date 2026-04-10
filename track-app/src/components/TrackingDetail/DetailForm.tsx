import React from 'react'
import { useTranslation } from 'react-i18next'

interface DetailFormProps {
  onSubmitDetail: (dateFrom: string, timeFrom: string, dateTo: string, timeTo: string) => void
  licensePlate?: string | null
  serialNumber?: string
}

function DetailForm({ onSubmitDetail, licensePlate, serialNumber }: DetailFormProps) {
  const { t } = useTranslation()
  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-full border px-4 py-2 text-sm outline-none transition'

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
      <h2 className="tracking-detail__title">{licensePlate || t('detail.trackerNotLoaded')}</h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        {serialNumber}
      </p>
      <hr />
      <form onSubmit={handleSubmitDetail} className="space-y-4">
        <p className={labelClass} style={{ marginBottom: 'var(--space-2)' }}>{t('detail.from')}</p>
        <div>
          <input className={inputClass} type="date" name="dateFrom" autoFocus required />
        </div>
        <div>
          <input className={inputClass} type="time" name="timeFrom" required />
        </div>
        <hr />
        <p className={labelClass} style={{ marginBottom: 'var(--space-2)' }}>{t('detail.to')}</p>
        <div>
          <input className={inputClass} type="date" name="dateTo" required />
        </div>
        <div>
          <input className={inputClass} type="time" name="timeTo" required />
        </div>
        <div className="pt-2">
          <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105" type="submit">
            {t('ui.search')}
          </button>
        </div>
      </form>
    </section>
  )
}

export default DetailForm

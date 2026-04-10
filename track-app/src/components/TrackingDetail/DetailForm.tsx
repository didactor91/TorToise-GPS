import React, { useMemo } from 'react'
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
  const defaultRange = useMemo(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const date = `${yyyy}-${mm}-${dd}`
    return {
      fromDate: date,
      fromTime: '00:00',
      // HTML time input does not support 24:00 consistently; 23:59 is end-of-day compatible.
      toDate: date,
      toTime: '23:59'
    }
  }, [])

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
    <section className="tracking-detail__form">
      <h2 className="tracking-detail__title">{licensePlate || t('detail.trackerNotLoaded')}</h2>
      <p className="tracking-detail__subtitle">
        {serialNumber}
      </p>
      <form onSubmit={handleSubmitDetail} className="tracking-detail__form-grid">
        <div className="tracking-detail__form-section">
          <p className={labelClass}>{t('detail.from')}</p>
          <div className="tracking-detail__field-wrap">
            <input className={inputClass} type="date" name="dateFrom" autoFocus required defaultValue={defaultRange.fromDate} />
          </div>
          <div className="tracking-detail__field-wrap">
            <input className={inputClass} type="time" name="timeFrom" required defaultValue={defaultRange.fromTime} />
          </div>
        </div>

        <div className="tracking-detail__form-section">
          <p className={labelClass}>{t('detail.to')}</p>
          <div className="tracking-detail__field-wrap">
            <input className={inputClass} type="date" name="dateTo" required defaultValue={defaultRange.toDate} />
          </div>
          <div className="tracking-detail__field-wrap">
            <input className={inputClass} type="time" name="timeTo" required defaultValue={defaultRange.toTime} />
          </div>
        </div>

        <div className="tracking-detail__submit-wrap">
          <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105" type="submit">
            {t('ui.search')}
          </button>
        </div>
      </form>
    </section>
  )
}

export default DetailForm

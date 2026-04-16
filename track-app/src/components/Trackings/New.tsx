import React from 'react'
import PageShell from '../shared/PageShell'
import { useAddTracker } from '../../hooks/useAddTracker'
import { useTranslation } from 'react-i18next'

function TrackingsNew() {
  const { t } = useTranslation()
  const { addTracker } = useAddTracker()
  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-full border px-4 py-2 text-sm outline-none transition'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const serialNumber = (form.elements.namedItem('serialNumber') as HTMLInputElement).value
    const alias = (form.elements.namedItem('alias') as HTMLInputElement).value
    addTracker({ serialNumber, alias: alias || null })
    form.reset()
  }

  return (
    <PageShell title={t('trackers.newTracker')} backTo="/trackers">
      <form onSubmit={handleSubmit} className="mx-auto max-w-[420px] space-y-4">
        <div>
          <label className={labelClass}>{t('trackers.serialNumber')}</label>
          <input
            className={inputClass}
            type="text"
            name="serialNumber"
            placeholder="9900110011"
            autoFocus
            required
          />
        </div>

        <div>
          <label className={labelClass}>{t('ui.alias')} <span className="text-xs text-[var(--text-muted)]">({t('ui.optional')})</span></label>
          <input
            className={inputClass}
            type="text"
            name="alias"
            placeholder={t('ui.alias')}
          />
        </div>

        <div className="pt-2">
          <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105" type="submit">
            {t('trackers.addTracker')}
          </button>
        </div>
      </form>
    </PageShell>
  )
}

export default TrackingsNew

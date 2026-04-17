import React from 'react'
import PageShell from '../shared/PageShell'
import { useAddPOI } from '../../hooks/useAddPOI'
import { useTranslation } from 'react-i18next'
import { POI_EMOJIS } from '../../common/emoji-options'

function PlacesNew() {
  const { t } = useTranslation()
  const { addPOI } = useAddPOI()
  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-full border px-4 py-2 text-sm outline-none transition'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const title = (form.elements.namedItem('title') as HTMLInputElement).value
    const latitude = parseFloat((form.elements.namedItem('latitude') as HTMLInputElement).value)
    const longitude = parseFloat((form.elements.namedItem('longitude') as HTMLInputElement).value)
    const color = (form.elements.namedItem('color') as HTMLSelectElement).value
    const emoji = (form.elements.namedItem('emoji') as HTMLSelectElement).value
    addPOI({ title, color, emoji, latitude, longitude })
    form.reset()
  }

  return (
    <PageShell title={t('places.newPoi')} backTo="/places">
      <form onSubmit={handleSubmit} className="mx-auto max-w-[420px] space-y-4">
        <div>
          <label className={labelClass}>{t('ui.title')}</label>
          <input
            className={inputClass}
            type="text"
            name="title"
            placeholder={t('ui.title')}
            autoFocus
            required
          />
        </div>

        <div>
          <label className={labelClass}>{t('ui.latitude')}</label>
          <input
            className={inputClass}
            type="number"
            name="latitude"
            placeholder="41.3879"
            step="any"
            required
          />
        </div>

        <div>
          <label className={labelClass}>{t('ui.longitude')}</label>
          <input
            className={inputClass}
            type="number"
            name="longitude"
            placeholder="2.1699"
            step="any"
            required
          />
        </div>

        <div>
          <label className={labelClass}>{t('ui.emoji')}</label>
          <select name="emoji" defaultValue="📍" className={inputClass}>
            {POI_EMOJIS.map((option) => (
              <option key={option.value} value={option.value}>{option.value} {option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t('places.markerColor')}</label>
          <select name="color" defaultValue="blue" className={inputClass}>
            <option value="blue">{t('places.colors.blue')}</option>
            <option value="lightblue">{t('places.colors.lightblue')}</option>
            <option value="orange">{t('places.colors.orange')}</option>
            <option value="purple">{t('places.colors.purple')}</option>
            <option value="red">{t('places.colors.red')}</option>
            <option value="yellow">{t('places.colors.yellow')}</option>
          </select>
        </div>

        <div className="pt-2">
          <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105" type="submit">
            {t('places.createPoi')}
          </button>
        </div>
      </form>
    </PageShell>
  )
}

export default PlacesNew

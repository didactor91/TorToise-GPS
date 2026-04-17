import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../shared/PageShell'
import { useGetPoiQuery, useUpdatePoiMutation } from '../../generated/graphql'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { POI_EMOJIS } from '../../common/emoji-options'

function PlacesEdit() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { poiId } = useParams<{ poiId: string }>()
  const [form, setForm] = useState({
    title: '',
    latitude: '',
    longitude: '',
    color: 'blue',
    emoji: '📍'
  })

  const { data, loading } = useGetPoiQuery({
    skip: !poiId,
    variables: { id: poiId || '' }
  })
  const [updatePoi, { loading: updating }] = useUpdatePoiMutation({
    onCompleted: (res) => {
      toast.success(res.updatePOI.message)
      navigate('/places')
    },
    onError: (err) => toast.error(err.message)
  })

  useEffect(() => {
    const poi = data?.poi
    if (!poi) return
    setForm({
      title: poi.title,
      latitude: String(poi.latitude),
      longitude: String(poi.longitude),
      color: poi.color,
      emoji: poi.emoji || '📍'
    })
  }, [data?.poi])

  const labelClass = 'mb-2 block text-sm font-semibold'
  const inputClass = 'glass-input-base w-full rounded-full border px-4 py-2 text-sm outline-none transition'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!poiId) return
    await updatePoi({
      variables: {
        id: poiId,
        input: {
          title: form.title,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          color: form.color,
          emoji: form.emoji
        }
      }
    })
  }

  return (
    <PageShell title={t('places.editPoi')} backTo="/places">
      {loading && <p className="text-center text-[var(--text-muted)]">{t('ui.loading')}</p>}
      {!loading && (
        <form onSubmit={handleSubmit} className="mx-auto max-w-[420px] space-y-4">
          <div>
            <label className={labelClass}>{t('ui.title')}</label>
            <input className={inputClass} value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} required />
          </div>
          <div>
            <label className={labelClass}>{t('ui.latitude')}</label>
            <input className={inputClass} type="number" step="any" value={form.latitude} onChange={(e) => setForm(prev => ({ ...prev, latitude: e.target.value }))} required />
          </div>
          <div>
            <label className={labelClass}>{t('ui.longitude')}</label>
            <input className={inputClass} type="number" step="any" value={form.longitude} onChange={(e) => setForm(prev => ({ ...prev, longitude: e.target.value }))} required />
          </div>
          <div>
            <label className={labelClass}>{t('ui.emoji')}</label>
            <select className={inputClass} value={form.emoji} onChange={(e) => setForm(prev => ({ ...prev, emoji: e.target.value }))}>
              {POI_EMOJIS.map((option) => (
                <option key={option.value} value={option.value}>{option.value} {option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('places.markerColor')}</label>
            <select className={inputClass} value={form.color} onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}>
              <option value="blue">{t('places.colors.blue')}</option>
              <option value="lightblue">{t('places.colors.lightblue')}</option>
              <option value="orange">{t('places.colors.orange')}</option>
              <option value="purple">{t('places.colors.purple')}</option>
              <option value="red">{t('places.colors.red')}</option>
              <option value="yellow">{t('places.colors.yellow')}</option>
            </select>
          </div>
          <div className="pt-2">
            <button className="w-full rounded-full border border-amber-500 bg-amber-400 px-4 py-2 font-semibold text-slate-800 transition hover:brightness-105 disabled:opacity-60" disabled={updating} type="submit">
              {t('places.updatePoi')}
            </button>
          </div>
        </form>
      )}
    </PageShell>
  )
}

export default PlacesEdit

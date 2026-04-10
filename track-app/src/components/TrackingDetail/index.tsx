import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../shared/MapPopupGlass.sass'
import './index.sass'
import DetailForm from './DetailForm'
import { useTrackingDetail } from '../../hooks/useTrackingDetail'
import { toast } from 'react-toastify'
import { client } from '../../apollo/client'
import { TrackRangeDocument, TrackRangeQuery, useLastTracksQuery, useLiveTracksUpdatedSubscription } from '../../generated/graphql'
import { useTranslation } from 'react-i18next'

interface TrackingDetailProps {
  darkmode: boolean
  serialNumber: string
}

function TrackingDetail({ darkmode, serialNumber }: TrackingDetailProps) {
  const { t, i18n } = useTranslation()
  const { tracker } = useTrackingDetail(serialNumber)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768
  })
  const [filtersOpen, setFiltersOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return true
  })
  const [rangeSelected, setRangeSelected] = useState<boolean>(false)
  const lastLivePanAtRef = useRef<number>(0)

  const mapRef = useRef<L.Map | null>(null)
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const startMarkerRef = useRef<L.Marker | null>(null)
  const endMarkerRef = useRef<L.Marker | null>(null)
  const liveMarkerRef = useRef<L.Marker | null>(null)
  const hoverPointRef = useRef<L.CircleMarker | null>(null)
  const trackPointMarkersRef = useRef<L.CircleMarker[]>([])
  const traceAnimationFrameRef = useRef<number | null>(null)
  const traceAnimationTokenRef = useRef<number>(0)
  const tileLightRef = useRef<L.TileLayer | null>(null)
  const tileDarkRef = useRef<L.TileLayer | null>(null)
  const { data: lastTracksData } = useLastTracksQuery({
    fetchPolicy: 'cache-and-network',
    onError: (err) => toast.error(err.message)
  })
  const { data: liveData } = useLiveTracksUpdatedSubscription()

  // ── helpers ──────────────────────────────────────────────────────────────

  const getCoords = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter()
      sessionStorage.setItem('lat', String(center.lat))
      sessionStorage.setItem('lng', String(center.lng))
      sessionStorage.setItem('zoom', String(mapRef.current.getZoom()))
    }
  }

  const initMap = () => {
    if (mapRef.current) return

    const lat = Number(sessionStorage.getItem('lat')) || 40.41665
    const lng = Number(sessionStorage.getItem('lng')) || -3.703816
    const zoom = Number(sessionStorage.getItem('zoom')) || 12

    mapRef.current = L.map('map', {
      center: [lat, lng],
      zoom,
      minZoom: 4,
      zoomControl: false
    })
    L.control.zoom({ position: 'topright' }).addTo(mapRef.current)

    tileLightRef.current = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap contributors', maxZoom: 19 }
    )
    tileDarkRef.current = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { attribution: '© CartoDB © OpenStreetMap contributors', maxZoom: 19 }
    )

    if (darkmode) {
      tileDarkRef.current.addTo(mapRef.current)
    } else {
      tileLightRef.current.addTo(mapRef.current)
    }

    // Initialize an empty polyline for the route
    polylineRef.current = L.polyline([], {
      color: '#FF0000',
      weight: 10,
      opacity: 0.45
    }).addTo(mapRef.current)
  }

  const panToTracker = (nextLat: number, nextLng: number, animate: boolean) => {
    if (!mapRef.current) return
    const map = mapRef.current
    const sidebarHeight = sidebarRef.current?.offsetHeight ?? 0
    const yOffset = isMobile && filtersOpen
      ? Math.max(70, Math.min(220, Math.round(sidebarHeight * 0.35)))
      : 0
    if (yOffset === 0) {
      map.panTo([nextLat, nextLng], { animate })
      return
    }
    const zoom = map.getZoom()
    const projected = map.project(L.latLng(nextLat, nextLng), zoom)
    const adjusted = L.point(projected.x, projected.y - yOffset)
    map.panTo(map.unproject(adjusted, zoom), { animate })
  }

  const stopTraceAnimation = () => {
    traceAnimationTokenRef.current += 1
    if (traceAnimationFrameRef.current) {
      window.cancelAnimationFrame(traceAnimationFrameRef.current)
      traceAnimationFrameRef.current = null
    }
  }

  const formatTrackDateTime = (value?: string | Date) => {
    if (!value) return ''
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return ''
    return new Intl.DateTimeFormat(i18n.language || 'es', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date)
  }

  const makeTrackPopupHtml = (title: string, dateValue?: string | Date, speed?: number | null) => `
    <div class="tracker-popup">
      <div class="tracker-popup__title">${title}</div>
      <div class="tracker-popup__meta">${formatTrackDateTime(dateValue)}</div>
      ${typeof speed === 'number' ? `
        <div class="tracker-popup__row">
          <span>${t('home.speed')}</span>
          <strong>${speed.toFixed(2)} km/h</strong>
        </div>
      ` : ''}
    </div>
  `

  const upsertLiveMarker = (lat: number, lng: number, speed: number) => {
    if (!mapRef.current) return
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#2563eb;width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🚚</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
    const popupHtml = `
      <div class="tracker-popup">
        <div class="tracker-popup__title">${tracker?.licensePlate || serialNumber}</div>
        <div class="tracker-popup__meta">${t('home.sn')}: ${serialNumber}</div>
        <div class="tracker-popup__row">
          <span>${t('home.speed')}</span>
          <strong>${speed.toFixed(2)} km/h</strong>
        </div>
      </div>
    `
    if (liveMarkerRef.current) {
      liveMarkerRef.current.setLatLng([lat, lng])
      liveMarkerRef.current.setPopupContent(popupHtml)
    } else {
      liveMarkerRef.current = L.marker([lat, lng], {
        icon,
        title: `${t('home.sn')}: ${serialNumber}`
      }).addTo(mapRef.current)
      liveMarkerRef.current.bindPopup(popupHtml, { autoPan: false })
    }

    const now = Date.now()
    if (now - lastLivePanAtRef.current >= 1200) {
      panToTracker(lat, lng, true)
      lastLivePanAtRef.current = now
    }
  }

  // ── effects ──────────────────────────────────────────────────────────────

  // Mount: initialize Leaflet map once
  useEffect(() => {
    initMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      setFiltersOpen(!mobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    const timer = window.setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 220)
    return () => window.clearTimeout(timer)
  }, [filtersOpen, isMobile])

  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return

    const invalidate = () => mapRef.current?.invalidateSize()
    const scheduleInvalidate = () => {
      invalidate()
      window.requestAnimationFrame(() => invalidate())
    }

    const resizeHandler = () => scheduleInvalidate()
    window.addEventListener('resize', resizeHandler)

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => scheduleInvalidate())
      observer.observe(mapContainerRef.current)
    }

    return () => {
      window.removeEventListener('resize', resizeHandler)
      observer?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !liveMarkerRef.current || rangeSelected) return
    const markerLatLng = liveMarkerRef.current.getLatLng()
    const timer = window.setTimeout(() => {
      panToTracker(markerLatLng.lat, markerLatLng.lng, false)
    }, 120)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersOpen, isMobile, rangeSelected])

  useEffect(() => {
    if (!mapRef.current || rangeSelected) return
    const last = lastTracksData?.lastTracks?.find(track => track.serialNumber === serialNumber)
    if (!last) return
    upsertLiveMarker(last.latitude, last.longitude, last.speed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTracksData, serialNumber, rangeSelected])

  useEffect(() => {
    if (!mapRef.current || rangeSelected) return
    const incoming = liveData?.liveTracksUpdated ?? []
    if (!incoming.length) return
    const current = incoming.find(track => track.serialNumber === serialNumber)
    if (!current) return
    upsertLiveMarker(current.latitude, current.longitude, current.speed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveData, serialNumber, rangeSelected])

  // React to darkmode changes: swap tile layers without reinitializing the map
  useEffect(() => {
    if (!mapRef.current || !tileLightRef.current || !tileDarkRef.current) return
    getCoords()
    if (darkmode) {
      tileLightRef.current.remove()
      tileDarkRef.current.addTo(mapRef.current)
    } else {
      tileDarkRef.current.remove()
      tileLightRef.current.addTo(mapRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkmode])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      if (liveMarkerRef.current) {
        liveMarkerRef.current = null
      }
      trackPointMarkersRef.current.forEach(marker => marker.remove())
      trackPointMarkersRef.current = []
      stopTraceAnimation()
    }
  }, [])

  // ── event handlers ───────────────────────────────────────────────────────

  const handleSubmitDetail = async (dateFrom: string, timeFrom: string, dateTo: string, timeTo: string) => {
    if (!tracker?.id) {
      toast.error(t('detail.trackerNotLoaded'))
      return
    }
    const dateF = dateFrom.split('-')
    const timeF = timeFrom.split(':')
    const dateT = dateTo.split('-')
    const timeT = timeTo.split(':')
    const startTime = new Date(
      Number(dateF[0]), Number(dateF[1]) - 1, Number(dateF[2]),
      Number(timeF[0]), Number(timeF[1])
    ).toISOString()
    const endTime = new Date(
      Number(dateT[0]), Number(dateT[1]) - 1, Number(dateT[2]),
      Number(timeT[0]), Number(timeT[1])
    ).toISOString()

    setRangeSelected(true)
    if (liveMarkerRef.current) {
      liveMarkerRef.current.remove()
      liveMarkerRef.current = null
    }

    try {
      const result = await client.query<TrackRangeQuery>({
        query: TrackRangeDocument,
        variables: { trackerId: tracker.id, start: startTime, end: endTime },
        fetchPolicy: 'network-only'
      })

      const tracks = result?.data?.trackRange || []
      if (!tracks.length) {
        toast.info(t('detail.noTracksInRange'))
        return
      }

      // Translate tracks into [lat, lng] pairs
      const coords: [number, number][] = tracks.map(item => [item.latitude, item.longitude])

      stopTraceAnimation()

      // Remove previous start/end markers if any
      if (startMarkerRef.current) {
        startMarkerRef.current.remove()
        startMarkerRef.current = null
      }
      if (endMarkerRef.current) {
        endMarkerRef.current.remove()
        endMarkerRef.current = null
      }
      if (hoverPointRef.current) {
        hoverPointRef.current.remove()
        hoverPointRef.current = null
      }
      trackPointMarkersRef.current.forEach(marker => marker.remove())
      trackPointMarkersRef.current = []
      if (!polylineRef.current || !mapRef.current || coords.length === 0) return

      const startIcon = L.divIcon({
        className: '',
        html: `<div style="background:#2563eb;width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🚦</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })

      const endIcon = L.divIcon({
        className: '',
        html: `<div style="background:#16a34a;width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🏁</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })

      // Show the start point immediately, then animate the route.
      const firstCoord = coords[0]
      const lastCoord = coords[coords.length - 1]
      const firstTrack = tracks[0]
      const lastTrack = tracks[tracks.length - 1]
      startMarkerRef.current = L.marker(firstCoord, { icon: startIcon }).addTo(mapRef.current)
      startMarkerRef.current.bindPopup(
        makeTrackPopupHtml(t('detail.startPoint'), firstTrack?.date, firstTrack?.speed),
        { autoPan: false }
      )
      startMarkerRef.current.on('mouseover', () => startMarkerRef.current?.openPopup())
      startMarkerRef.current.on('mouseout', () => startMarkerRef.current?.closePopup())

      const durationMs = 3000
      const token = ++traceAnimationTokenRef.current
      let startTs = 0
      polylineRef.current.setLatLngs([firstCoord])

      // Frame the full route up-front so animation is visible without jumps.
      const fullBounds = L.latLngBounds(coords)
      if (fullBounds.isValid()) {
        mapRef.current.fitBounds(fullBounds, {
          padding: [36, 36],
          maxZoom: 16,
          animate: true
        })
      }

      const draw = (ts: number) => {
        if (token !== traceAnimationTokenRef.current || !polylineRef.current || !mapRef.current) return
        if (!startTs) startTs = ts
        const progress = Math.min((ts - startTs) / durationMs, 1)
        const visibleCount = Math.min(
          coords.length,
          Math.max(1, Math.floor(progress * (coords.length - 1)) + 1)
        )

        polylineRef.current.setLatLngs(coords.slice(0, visibleCount))

        if (progress < 1) {
          traceAnimationFrameRef.current = window.requestAnimationFrame(draw)
          return
        }

        endMarkerRef.current = L.marker(lastCoord, { icon: endIcon }).addTo(mapRef.current)
        endMarkerRef.current.bindPopup(
          makeTrackPopupHtml(t('detail.endPoint'), lastTrack?.date, lastTrack?.speed),
          { autoPan: false }
        )
        endMarkerRef.current.on('mouseover', () => endMarkerRef.current?.openPopup())
        endMarkerRef.current.on('mouseout', () => endMarkerRef.current?.closePopup())

        // Paint every sampled track point with a subtle marker.
        trackPointMarkersRef.current = coords.map((point, idx) => {
          const trackPoint = tracks[idx]
          const marker = L.circleMarker(point, {
            radius: 3,
            color: '#ffffff',
            weight: 1,
            fillColor: '#ffffff',
            fillOpacity: 0,
            opacity: 0.55
          }).addTo(mapRef.current!)

          marker.bindPopup(
            makeTrackPopupHtml(t('detail.routePoint'), trackPoint?.date, trackPoint?.speed),
            { autoPan: false, closeButton: false }
          )
          marker.on('mouseover', () => marker.openPopup())
          marker.on('mouseout', () => marker.closePopup())
          return marker
        })

        polylineRef.current.off('mousemove')
        polylineRef.current.off('mouseout')
        polylineRef.current.on('mousemove', (event: L.LeafletMouseEvent) => {
          if (!mapRef.current) return
          const mouseLatLng = event.latlng
          let closestIdx = 0
          let closestDist = Number.POSITIVE_INFINITY
          for (let i = 0; i < coords.length; i += 1) {
            const point = coords[i]
            const dist = mapRef.current.distance(mouseLatLng, L.latLng(point[0], point[1]))
            if (dist < closestDist) {
              closestDist = dist
              closestIdx = i
            }
          }
          const nearest = coords[closestIdx]
          const nearestTrack = tracks[closestIdx]
          if (!nearest || !nearestTrack) return
          if (!hoverPointRef.current) {
            hoverPointRef.current = L.circleMarker(nearest, {
              radius: 6,
              color: '#ffffff',
              weight: 2,
              fillColor: '#2563eb',
              fillOpacity: 1
            }).addTo(mapRef.current)
            hoverPointRef.current.bindPopup('', {
              autoPan: false,
              closeButton: false
            })
          } else {
            hoverPointRef.current.setLatLng(nearest)
          }
          hoverPointRef.current.setPopupContent(makeTrackPopupHtml(t('detail.routePoint'), nearestTrack.date, nearestTrack.speed))
          if (!hoverPointRef.current.isPopupOpen()) hoverPointRef.current.openPopup()
        })
        polylineRef.current.on('mouseout', () => {
          if (!hoverPointRef.current) return
          hoverPointRef.current.closePopup()
          hoverPointRef.current.remove()
          hoverPointRef.current = null
        })

        traceAnimationFrameRef.current = null
      }
      traceAnimationFrameRef.current = window.requestAnimationFrame(draw)

      if (isMobile) setFiltersOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.toLowerCase().includes('without tracks')) {
        toast.info(t('detail.noTracksInRange'))
      } else {
        toast.error(message || t('detail.trackerNotLoaded'))
      }
    }
  }

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <section className="tracking-detail">
      {isMobile && !filtersOpen && (
        <button
          className="tracking-detail__filters-toggle"
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-expanded={false}
        >
          {t('detail.showFilters')}
        </button>
      )}
      <div
        ref={sidebarRef}
        className={`tracking-detail__sidebar ${isMobile ? (filtersOpen ? 'tracking-detail__sidebar--expanded' : 'tracking-detail__sidebar--collapsed') : ''}`}
      >
        {isMobile && filtersOpen && (
          <button
            className="tracking-detail__close-filters"
            type="button"
            onClick={() => setFiltersOpen(false)}
            aria-label={t('detail.hideFilters')}
            title={t('detail.hideFilters')}
          >
            ×
          </button>
        )}
        <DetailForm
          onSubmitDetail={handleSubmitDetail}
          licensePlate={tracker?.licensePlate}
          serialNumber={tracker?.serialNumber}
        />
      </div>
      <div className="tracking-detail__map">
        <div ref={mapContainerRef} className="map-map" id="map"></div>
      </div>
    </section>
  )
}

export default TrackingDetail

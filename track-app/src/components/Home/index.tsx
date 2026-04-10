import React, { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../shared/MapPopupGlass.sass'
import './index.sass'
import { useLiveTracks, HomePoi, HomeTracker, LiveTrack } from '../../hooks/useLiveTracks'
import { useTranslation } from 'react-i18next'

interface HomeProps {
  darkmode: boolean
}

function Home({ darkmode }: HomeProps) {
  const { t } = useTranslation()
  const { pois, trackers, lastTracks, livePositions, deletePOI, goToDetail } = useLiveTracks()
  const location = useLocation()
  const licenseBySerial = useMemo(
    () => new Map(trackers.map(tracker => [tracker.serialNumber, tracker.licensePlate || tracker.serialNumber])),
    [trackers]
  )

  const mapRef = useRef<L.Map | null>(null)
  const poiMarkRef = useRef<L.Marker[]>([])
  // Truck markers indexed by serialNumber for O(1) update without destroy/recreate
  const truckMarkRef = useRef<Map<string, L.Marker>>(new Map())
  const tileLightRef = useRef<L.TileLayer | null>(null)
  const tileDarkRef = useRef<L.TileLayer | null>(null)
  const lastFocusedSerialRef = useRef<string | null>(null)
  const followSerialRef = useRef<string | null>(null)
  const lastFollowPanAtRef = useRef<number>(0)
  const truckPopupSignatureRef = useRef<Map<string, string>>(new Map())

  // ── helpers ──────────────────────────────────────────────────────────────

  const getCoords = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter()
      sessionStorage.setItem('lat', String(center.lat))
      sessionStorage.setItem('lng', String(center.lng))
      sessionStorage.setItem('zoom', String(mapRef.current.getZoom()))
    }
  }

  const clearPOIMarkers = () => {
    poiMarkRef.current.forEach(m => m.remove())
    poiMarkRef.current = []
  }

  const clearTruckMarkers = () => {
    truckMarkRef.current.forEach(m => m.remove())
    truckMarkRef.current.clear()
  }

  const renderPOIMarkers = (items: HomePoi[]) => {
    if (!mapRef.current) return
    clearPOIMarkers()
    items.forEach(poi => {
      const poiIcon = L.divIcon({
        className: '',
        html: `<div style="background:${poi.color || '#3b82f6'};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
      const marker = L.marker([poi.latitude, poi.longitude], { icon: poiIcon })
      const popupHtml = `
        <div class="tracker-popup">
          <div class="tracker-popup__title">${poi.title}</div>
          <div class="tracker-popup__meta">${t('ui.latitude')}: ${poi.latitude}</div>
          <div class="tracker-popup__meta">${t('ui.longitude')}: ${poi.longitude}</div>
          <button data-action="delete-poi" data-id="${poi.id}" class="tracker-popup__button tracker-popup__button--danger">${t('home.deletePoi')}</button>
        </div>
      `
      marker.bindPopup(popupHtml)
      marker.on('popupopen', () => {
        const popupNode = marker.getPopup()?.getElement()
        if (!popupNode) return
        const deleteBtn = popupNode.querySelector<HTMLButtonElement>('[data-action="delete-poi"]')
        if (deleteBtn) {
          deleteBtn.onclick = (event) => {
            event.preventDefault()
            event.stopPropagation()
            deletePOI(deleteBtn.dataset.id || '')
          }
        }
      })
      marker.addTo(mapRef.current!)
      poiMarkRef.current.push(marker)
    })
  }

  const makeTruckIcon = (status?: string | null) => {
    const bgColor = status === 'ON' ? '#22c55e' : '#ef4444'
    return L.divIcon({
      className: '',
      html: `<div style="background:${bgColor};width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🚚</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }

  const telemetryFreshness = (dateValue?: string | Date) => {
    if (!dateValue) return { label: t('home.stale'), color: '#f59e0b' }
    const ts = new Date(dateValue).getTime()
    if (!Number.isFinite(ts)) return { label: t('home.stale'), color: '#f59e0b' }
    const ageMs = Date.now() - ts
    // Consider telemetry live if updated in the last 60 seconds.
    return ageMs <= 60_000
      ? { label: t('home.live'), color: '#22c55e' }
      : { label: t('home.stale'), color: '#f59e0b' }
  }

  const bindTrackerPopupActions = (marker: L.Marker) => {
    const popupNode = marker.getPopup()?.getElement()
    if (!popupNode) return
    const detailBtn = popupNode.querySelector<HTMLButtonElement>('[data-action="detail-tracker"]')
    if (detailBtn) {
      detailBtn.onclick = (event) => {
        event.preventDefault()
        event.stopPropagation()
        getCoords()
        goToDetail(detailBtn.dataset.serial || '')
      }
    }
  }

  /**
   * Upsert truck markers — never destroys existing markers.
   * - New truck → create marker and add to map
   * - Known truck → move existing marker with setLatLng + update icon
   * This prevents the flicker/disappear effect caused by destroy+recreate.
   */
  const upsertTruckMarkers = (trucks: Array<LiveTrack | HomeTracker>) => {
    if (!mapRef.current) return
    trucks.forEach(truck => {
      const lat = 'latitude' in truck ? (truck.latitude ?? 0) : 0
      const lng = 'longitude' in truck ? (truck.longitude ?? 0) : 0
      const speed = 'speed' in truck ? (truck.speed ?? 0) : 0
      const status = 'status' in truck ? truck.status : undefined
      const freshness = 'date' in truck ? telemetryFreshness(truck.date) : { label: 'STALE', color: '#f59e0b' }
      const sn = truck.serialNumber
      const lp = truck.licensePlate || licenseBySerial.get(sn) || sn
      const popupSignature = `${lp}|${status || ''}|${speed.toFixed(2)}|${freshness.label}`
      const popupHtml = `
        <div class="tracker-popup">
          <div class="tracker-popup__title">${lp}</div>
          <div class="tracker-popup__meta">${t('home.sn')}: ${sn}</div>
          <div class="tracker-popup__row">
            <span>${t('home.speed')}</span>
            <strong>${speed.toFixed(2)} km/h</strong>
          </div>
          <div class="tracker-popup__row">
            <span>${t('home.telemetry')}</span>
            <strong style="color:${freshness.color}">${freshness.label}</strong>
          </div>
          <button data-action="detail-tracker" data-serial="${sn}" class="tracker-popup__button">${t('home.viewDetail')}</button>
        </div>
      `

      const existing = truckMarkRef.current.get(sn)
      if (existing) {
        // Move existing marker — no flicker
        existing.setLatLng([lat, lng])
        const nextTitle = `${t('home.sn')}: ${sn} - ${t('home.speed')}: ${speed} Km/h`
        if (existing.options.title !== nextTitle) existing.options.title = nextTitle

        const prevSignature = truckPopupSignatureRef.current.get(sn)
        // Only rewrite popup/icon when visible popup data changed.
        if (prevSignature !== popupSignature) {
          existing.setIcon(makeTruckIcon(status))
          if (existing.isPopupOpen()) {
            existing.setPopupContent(popupHtml)
            // Leaflet recreates popup DOM when content changes; rebind actions immediately.
            bindTrackerPopupActions(existing)
          } else {
            existing.getPopup()?.setContent(popupHtml)
          }
          truckPopupSignatureRef.current.set(sn, popupSignature)
        }
        if (followSerialRef.current === sn && existing.isPopupOpen() && mapRef.current) {
          const now = Date.now()
          // Throttle follow pan for smoother UX.
          if (now - lastFollowPanAtRef.current >= 1200) {
            mapRef.current.panTo(existing.getLatLng(), { animate: false })
            lastFollowPanAtRef.current = now
          }
        }
      } else {
        // First time seeing this truck — create marker
        const marker = L.marker([lat, lng], {
          icon: makeTruckIcon(status),
          title: `${t('home.sn')}: ${sn} - ${t('home.speed')}: ${speed} Km/h`
        })
        marker.bindPopup(popupHtml, {
          autoClose: false,
          closeOnClick: false,
          closeButton: true,
          autoPan: false
        })
        marker.on('click', () => {
          marker.openPopup()
        })
        marker.on('popupopen', () => {
          followSerialRef.current = sn
          lastFollowPanAtRef.current = 0
          bindTrackerPopupActions(marker)
        })
        marker.on('popupclose', () => {
          if (followSerialRef.current === sn) followSerialRef.current = null
        })
        marker.addTo(mapRef.current!)
        truckMarkRef.current.set(sn, marker)
        truckPopupSignatureRef.current.set(sn, popupSignature)
      }
    })
  }

  const focusTrackerIfRequested = () => {
    const focusSerial = (location.state as { focusSerial?: string } | null)?.focusSerial
    if (!focusSerial || !mapRef.current) return
    if (lastFocusedSerialRef.current === focusSerial) return

    let marker = truckMarkRef.current.get(focusSerial)
    if (!marker) {
      // Fallback: if marker is not mounted yet, try with last known track snapshot.
      const lastKnown = lastTracks.find(track => track.serialNumber === focusSerial)
      if (lastKnown) {
        upsertTruckMarkers([lastKnown])
        marker = truckMarkRef.current.get(focusSerial)
      }
    }
    if (!marker) return

    mapRef.current.setView(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 13), { animate: true })
    marker.openPopup()
    lastFocusedSerialRef.current = focusSerial
  }

  const initMap = (initialPois: HomePoi[]) => {
    if (mapRef.current) return

    let lati = 20
    let lngi = 0
    let defaultZoom = 3

    if (initialPois && initialPois.length >= 1) {
      lati = initialPois[0].latitude
      lngi = initialPois[0].longitude
      defaultZoom = 8
    }

    const savedLat = sessionStorage.getItem('lat')
    const savedLng = sessionStorage.getItem('lng')
    const savedZoom = sessionStorage.getItem('zoom')
    const hasSavedView = Boolean(savedLat && savedLng && savedZoom)

    const lat = hasSavedView ? Number(savedLat) : lati
    const lng = hasSavedView ? Number(savedLng) : lngi
    const zoom = hasSavedView ? Number(savedZoom) : defaultZoom

    mapRef.current = L.map('map', {
      center: [lat, lng],
      zoom,
      minZoom: 3,
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
  }

  // ── effects ──────────────────────────────────────────────────────────────

  // Initialize map once POI data arrives
  useEffect(() => {
    initMap(pois)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois])

  // Re-render POI markers whenever POI data changes
  useEffect(() => {
    if (!mapRef.current) return
    renderPOIMarkers(pois)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois])

  // Update truck markers on live subscription data — upsert, never destroy
  useEffect(() => {
    if (!mapRef.current || !livePositions.length) return
    upsertTruckMarkers(livePositions)
    focusTrackerIfRequested()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePositions])

  useEffect(() => {
    if (!mapRef.current || !lastTracks.length) return
    upsertTruckMarkers(lastTracks)
    focusTrackerIfRequested()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTracks])

  useEffect(() => {
    focusTrackerIfRequested()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

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

  // Recalculate Leaflet viewport when navbar minimize/expand changes layout.
  useEffect(() => {
    const root = document.documentElement
    let timeoutId: number | null = null

    const invalidateMapSize = () => {
      if (!mapRef.current) return
      mapRef.current.invalidateSize()
    }

    const scheduleInvalidate = () => {
      invalidateMapSize()
      window.requestAnimationFrame(() => invalidateMapSize())
      if (timeoutId) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => invalidateMapSize(), 380)
    }

    const observer = new MutationObserver((mutations) => {
      const changed = mutations.some(m => m.type === 'attributes' && m.attributeName === 'class')
      if (changed) scheduleInvalidate()
    })

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => {
      observer.disconnect()
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <main className="map-section">
      <div className="map-map" id="map"></div>
    </main>
  )
}

export default Home

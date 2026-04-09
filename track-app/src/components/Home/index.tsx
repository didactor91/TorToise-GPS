import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './index.sass'
import { useLiveTracks, HomePoi, HomeTracker, LiveTrack } from '../../hooks/useLiveTracks'

interface HomeProps {
  darkmode: boolean
}

function Home({ darkmode }: HomeProps) {
  const { pois, trackers, lastTracks, livePositions, deletePOI, deleteTracker, goToDetail } = useLiveTracks()
  const location = useLocation()

  const mapRef = useRef<L.Map | null>(null)
  const poiMarkRef = useRef<L.Marker[]>([])
  // Truck markers indexed by serialNumber for O(1) update without destroy/recreate
  const truckMarkRef = useRef<Map<string, L.Marker>>(new Map())
  const tileLightRef = useRef<L.TileLayer | null>(null)
  const tileDarkRef = useRef<L.TileLayer | null>(null)
  const lastFocusedSerialRef = useRef<string | null>(null)
  const followSerialRef = useRef<string | null>(null)

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
      const popupHtml = `<h2>${poi.title}</h2><p>lat: ${poi.latitude}</p><p>lng: ${poi.longitude}</p><hr/><button id="deletePOI" value="${poi.id}">DELETE</button>`
      marker.bindPopup(popupHtml)
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
      const sn = truck.serialNumber
      const lp = truck.licensePlate ?? sn
      const popupHtml = `<h2>LP: ${lp}</h2><p>SN: ${sn}</p><hr/><button id="detailTracker" value="${sn}">DETAIL</button><hr/><button id="deleteTracker" value="${sn}">DELETE</button>`

      const existing = truckMarkRef.current.get(sn)
      if (existing) {
        // Move existing marker — no flicker
        existing.setLatLng([lat, lng])
        existing.setIcon(makeTruckIcon(status))
        existing.setPopupContent(popupHtml)
        existing.options.title = `SN: ${sn} - Speed: ${speed} Km/h`
        if (followSerialRef.current === sn && mapRef.current) {
          mapRef.current.panTo(existing.getLatLng(), { animate: true })
        }
      } else {
        // First time seeing this truck — create marker
        const marker = L.marker([lat, lng], {
          icon: makeTruckIcon(status),
          title: `SN: ${sn} - Speed: ${speed} Km/h`
        })
        marker.bindPopup(popupHtml)
        marker.on('click', () => {
          followSerialRef.current = sn
          if (mapRef.current) mapRef.current.panTo(marker.getLatLng(), { animate: true })
        })
        marker.addTo(mapRef.current!)
        truckMarkRef.current.set(sn, marker)
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
    followSerialRef.current = focusSerial
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
      zoomControl: true
    })

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

  // Initial truck markers from tracker list (before any WS frame arrives)
  useEffect(() => {
    if (!mapRef.current || !trackers.length) return
    // Only paint trackers that don't have a live position yet
    const unknown = trackers.filter(t => !truckMarkRef.current.has(t.serialNumber))
    if (unknown.length) upsertTruckMarkers(unknown)
    focusTrackerIfRequested()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackers])

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

  // Set up click delegation for map popup buttons
  useEffect(() => {
    const handleMapClick = (e: MouseEvent) => {
      const target = e.target as HTMLButtonElement
      if (!target?.id) return
      if (target.id === 'deletePOI') deletePOI(target.value)
      if (target.id === 'deleteTracker') deleteTracker(target.value)
      if (target.id === 'detailTracker') {
        getCoords()
        goToDetail(target.value)
      }
    }
    window.addEventListener('click', handleMapClick)
    return () => window.removeEventListener('click', handleMapClick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackers])

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

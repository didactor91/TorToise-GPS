import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './index.sass'
import { useLiveTracks, HomePoi, HomeTracker, LiveTrack } from '../../hooks/useLiveTracks'

interface HomeProps {
  darkmode: boolean
}

function Home({ darkmode }: HomeProps) {
  const { pois, trackers, liveTracks, deletePOI, deleteTracker, goToDetail } = useLiveTracks()

  const mapRef = useRef<L.Map | null>(null)
  const poiMarkRef = useRef<L.Marker[]>([])
  const truckMarkRef = useRef<L.Marker[]>([])
  const tileLightRef = useRef<L.TileLayer | null>(null)
  const tileDarkRef = useRef<L.TileLayer | null>(null)

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
    truckMarkRef.current = []
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

  const renderTruckMarkers = (trucks: LiveTrack[] | HomeTracker[]) => {
    if (!mapRef.current) return
    clearTruckMarkers()
    trucks.forEach(truck => {
      const bgColor = 'status' in truck && truck.status === 'ON' ? '#22c55e' : '#ef4444'
      const truckIcon = L.divIcon({
        className: '',
        html: `<div style="background:${bgColor};width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🚚</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
      const lat = 'latitude' in truck ? truck.latitude : 0
      const lng = 'longitude' in truck ? truck.longitude : 0
      const speed = 'speed' in truck ? truck.speed : 0
      const marker = L.marker([lat, lng], {
        icon: truckIcon,
        title: `SN: ${truck.serialNumber} - Speed: ${speed} Km/h`
      })
      const popupHtml = `<h2>LP: ${truck.licensePlate}</h2><p>SN: ${truck.serialNumber}</p><hr/><button id="detailTracker" value="${truck.serialNumber}">DETAIL</button><hr/><button id="deleteTracker" value="${truck.serialNumber}">DELETE</button>`
      marker.bindPopup(popupHtml)
      marker.addTo(mapRef.current!)
      truckMarkRef.current.push(marker)
    })
  }

  const initMap = (initialPois: HomePoi[]) => {
    if (mapRef.current) return

    let lati = 40.41665
    let lngi = -3.703816

    if (initialPois && initialPois.length >= 1) {
      lati = initialPois[0].latitude
      lngi = initialPois[0].longitude
    }

    const lat = Number(sessionStorage.getItem('lat')) || lati
    const lng = Number(sessionStorage.getItem('lng')) || lngi
    const zoom = Number(sessionStorage.getItem('zoom')) || 8

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

  // Update truck markers imperatively on live subscription data
  useEffect(() => {
    if (!mapRef.current || !liveTracks.length) return
    renderTruckMarkers(liveTracks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTracks])

  // Re-render truck markers whenever tracker list changes (initial load)
  useEffect(() => {
    if (!mapRef.current || !trackers.length) return
    renderTruckMarkers(trackers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackers])

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

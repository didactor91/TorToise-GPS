import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './index.sass'
import DetailForm from './DetailForm'
import { useTrackingDetail } from '../../hooks/useTrackingDetail'
import { toast } from 'react-toastify'
import { client } from '../../apollo/client'
import { TrackRangeDocument, TrackRangeQuery } from '../../generated/graphql'

interface TrackingDetailProps {
  darkmode: boolean
  serialNumber: string
}

function TrackingDetail({ darkmode, serialNumber }: TrackingDetailProps) {
  const { tracker } = useTrackingDetail(serialNumber)

  const mapRef = useRef<L.Map | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
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

  const initMap = () => {
    if (mapRef.current) return

    const lat = Number(sessionStorage.getItem('lat')) || 40.41665
    const lng = Number(sessionStorage.getItem('lng')) || -3.703816
    const zoom = Number(sessionStorage.getItem('zoom')) || 12

    mapRef.current = L.map('map', {
      center: [lat, lng],
      zoom,
      minZoom: 4,
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

    // Initialize an empty polyline for the route
    polylineRef.current = L.polyline([], {
      color: '#FF0000',
      weight: 10,
      opacity: 1.0
    }).addTo(mapRef.current)
  }

  // ── effects ──────────────────────────────────────────────────────────────

  // Mount: initialize Leaflet map once
  useEffect(() => {
    initMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    }
  }, [])

  // ── event handlers ───────────────────────────────────────────────────────

  const handleSubmitDetail = async (dateFrom: string, timeFrom: string, dateTo: string, timeTo: string) => {
    if (!tracker?.id) {
      toast.error('Tracker not loaded yet')
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

    const result = await client.query<TrackRangeQuery>({
      query: TrackRangeDocument,
      variables: { trackerId: tracker.id, start: startTime, end: endTime },
      fetchPolicy: 'network-only'
    })

    const tracks = result?.data?.trackRange || []

    // Translate tracks into [lat, lng] pairs
    const coords: [number, number][] = tracks.map(item => [item.latitude, item.longitude])

    // Update existing polyline — no map reinitialization needed
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(coords)
    }

    // Remove previous truck marker if any
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }

    // Place a truck marker at the latest position in the route
    if (coords.length > 0 && mapRef.current) {
      const lastCoord = coords[coords.length - 1]
      const truckIcon = L.divIcon({
        className: '',
        html: `<div style="background:#22c55e;width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🚚</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
      markerRef.current = L.marker(lastCoord, { icon: truckIcon }).addTo(mapRef.current)

      // Fit map to the polyline bounds
      if (polylineRef.current) {
        const bounds = polylineRef.current.getBounds()
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds)
        }
      }
    }
  }

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <section className="tracking-detail">
      <div className="tracking-detail__sidebar">
        <DetailForm
          onSubmitDetail={handleSubmitDetail}
          licensePlate={tracker?.licensePlate}
          serialNumber={tracker?.serialNumber}
        />
      </div>
      <div className="tracking-detail__map">
        <div className="map-map" id="map"></div>
      </div>
    </section>
  )
}

export default TrackingDetail

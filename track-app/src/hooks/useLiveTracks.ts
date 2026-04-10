import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGetPoIsQuery,
  useDeletePoiMutation,
  useGetTrackersQuery,
  useDeleteTrackerMutation,
  useLastTracksQuery,
  useLiveTracksUpdatedSubscription,
  GetPoIsQuery,
  GetTrackersQuery,
  LiveTracksUpdatedSubscription
} from '../generated/graphql'
import { toast } from 'react-toastify'

export type HomePoi = NonNullable<NonNullable<GetPoIsQuery['pois']>['items']>[number]
export type HomeTracker = NonNullable<NonNullable<GetTrackersQuery['trackers']>['items']>[number]
export type LiveTrack = NonNullable<LiveTracksUpdatedSubscription['liveTracksUpdated']>[number]

export function useLiveTracks() {
  const navigate = useNavigate()

  // POIs
  const { data: poisData, refetch: refetchPois } = useGetPoIsQuery({
    fetchPolicy: 'cache-and-network',
    variables: { offset: 0, limit: 200 },
    onError: (err) => toast.error(err.message)
  })
  const [deletePoiMutation] = useDeletePoiMutation({
    onCompleted: () => { refetchPois(); refetchTrackers() },
    onError: (err) => toast.error(err.message)
  })

  // Trackers
  const { data: trackersData, refetch: refetchTrackers } = useGetTrackersQuery({
    fetchPolicy: 'cache-and-network',
    variables: { offset: 0, limit: 200 },
    onError: (err) => toast.error(err.message)
  })
  const [deleteTrackerMutation] = useDeleteTrackerMutation({
    onCompleted: () => refetchTrackers(),
    onError: (err) => toast.error(err.message)
  })

  // Last known tracks snapshot (fallback for centering and initial render)
  const { data: lastTracksData } = useLastTracksQuery({
    fetchPolicy: 'cache-and-network',
    onError: (err) => toast.error(err.message)
  })

  // Live subscription — accumulate last known position per serialNumber
  // Each WS frame carries only 1 truck. We merge into a persistent map so
  // all trucks are always present on the map, never disappearing.
  const positionsMapRef = useRef<Map<string, LiveTrack>>(new Map())
  const [livePositions, setLivePositions] = useState<LiveTrack[]>([])

  const { data: liveData } = useLiveTracksUpdatedSubscription()

  useEffect(() => {
    const incoming = liveData?.liveTracksUpdated ?? []
    if (!incoming.length) return

    const ownSerials = new Set((trackersData?.trackers?.items ?? []).map(t => t.serialNumber))
    const scopedIncoming = incoming.filter(track => ownSerials.has(track.serialNumber))
    if (!scopedIncoming.length) return

    // Upsert each incoming track into the accumulated map
    scopedIncoming.forEach(track => {
      positionsMapRef.current.set(track.serialNumber, track)
    })

    // Emit a new array snapshot to trigger map update
    setLivePositions([...positionsMapRef.current.values()])
  }, [liveData, trackersData])

  useEffect(() => {
    const ownSerials = new Set((trackersData?.trackers?.items ?? []).map(t => t.serialNumber))
    if (!ownSerials.size) {
      positionsMapRef.current.clear()
      setLivePositions([])
      return
    }

    const next = [...positionsMapRef.current.values()].filter(track => ownSerials.has(track.serialNumber))
    positionsMapRef.current = new Map(next.map(track => [track.serialNumber, track]))
    setLivePositions(next)
  }, [trackersData])

  const pois: HomePoi[] = poisData?.pois?.items ?? []
  const trackers: HomeTracker[] = trackersData?.trackers?.items ?? []
  const lastTracks: LiveTrack[] = lastTracksData?.lastTracks ?? []

  const deletePOI = (id: string) => deletePoiMutation({ variables: { id } })
  const deleteTracker = (id: string) => {
    const tracker = trackers.find(t => t.serialNumber === id)
    if (tracker) deleteTrackerMutation({ variables: { id: tracker.id } })
  }
  const goToDetail = (serialNumber: string) => navigate(`/detail/${serialNumber}`)

  return { pois, trackers, lastTracks, livePositions, deletePOI, deleteTracker, goToDetail, refetchPois, refetchTrackers }
}

import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGetPoIsQuery,
  useDeletePoiMutation,
  useGetTrackersQuery,
  useDeleteTrackerMutation,
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

  // Live subscription — accumulate last known position per serialNumber
  // Each WS frame carries only 1 truck. We merge into a persistent map so
  // all trucks are always present on the map, never disappearing.
  const positionsMapRef = useRef<Map<string, LiveTrack>>(new Map())
  const [livePositions, setLivePositions] = useState<LiveTrack[]>([])

  const { data: liveData } = useLiveTracksUpdatedSubscription()

  useEffect(() => {
    const incoming = liveData?.liveTracksUpdated ?? []
    if (!incoming.length) return

    // Upsert each incoming track into the accumulated map
    incoming.forEach(track => {
      positionsMapRef.current.set(track.serialNumber, track)
    })

    // Emit a new array snapshot to trigger map update
    setLivePositions([...positionsMapRef.current.values()])
  }, [liveData])

  const pois: HomePoi[] = poisData?.pois?.items ?? []
  const trackers: HomeTracker[] = trackersData?.trackers?.items ?? []

  const deletePOI = (id: string) => deletePoiMutation({ variables: { id } })
  const deleteTracker = (id: string) => {
    const tracker = trackers.find(t => t.serialNumber === id)
    if (tracker) deleteTrackerMutation({ variables: { id: tracker.id } })
  }
  const goToDetail = (serialNumber: string) => navigate(`/detail/${serialNumber}`)

  return { pois, trackers, livePositions, deletePOI, deleteTracker, goToDetail, refetchPois, refetchTrackers }
}

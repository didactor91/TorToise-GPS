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

export type HomePoi = NonNullable<GetPoIsQuery['pois']>[number]
export type HomeTracker = NonNullable<GetTrackersQuery['trackers']>[number]
export type LiveTrack = NonNullable<LiveTracksUpdatedSubscription['liveTracksUpdated']>[number]

export function useLiveTracks() {
  const navigate = useNavigate()

  // POIs
  const { data: poisData, refetch: refetchPois } = useGetPoIsQuery({
    fetchPolicy: 'cache-and-network',
    onError: (err) => toast.error(err.message)
  })
  const [deletePoiMutation] = useDeletePoiMutation({
    onCompleted: () => { refetchPois(); refetchTrackers() },
    onError: (err) => toast.error(err.message)
  })

  // Trackers
  const { data: trackersData, refetch: refetchTrackers } = useGetTrackersQuery({
    fetchPolicy: 'cache-and-network',
    onError: (err) => toast.error(err.message)
  })
  const [deleteTrackerMutation] = useDeleteTrackerMutation({
    onCompleted: () => refetchTrackers(),
    onError: (err) => toast.error(err.message)
  })

  // Live subscription
  const { data: liveData } = useLiveTracksUpdatedSubscription()

  const pois: HomePoi[] = poisData?.pois ?? []
  const trackers: HomeTracker[] = trackersData?.trackers ?? []
  const liveTracks: LiveTrack[] = liveData?.liveTracksUpdated ?? []

  const deletePOI = (id: string) => deletePoiMutation({ variables: { id } })
  const deleteTracker = (id: string) => {
    const tracker = trackers.find(t => t.serialNumber === id)
    if (tracker) deleteTrackerMutation({ variables: { id: tracker.id } })
  }
  const goToDetail = (serialNumber: string) => navigate(`/detail/${serialNumber}`)

  return { pois, trackers, liveTracks, deletePOI, deleteTracker, goToDetail, refetchPois, refetchTrackers }
}

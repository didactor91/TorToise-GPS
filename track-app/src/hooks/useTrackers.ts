import { toast } from 'react-toastify'
import { useGetTrackersQuery, useDeleteTrackerMutation, useLastTracksQuery, GetTrackersQuery } from '../generated/graphql'

export type Tracker = NonNullable<GetTrackersQuery['trackers']>[number]

export function useTrackers() {
  const { data, loading, refetch } = useGetTrackersQuery({ fetchPolicy: 'cache-and-network' })
  const { data: lastTracksData, loading: lastTracksLoading } = useLastTracksQuery({ fetchPolicy: 'cache-and-network' })

  const [deleteTrackerMutation] = useDeleteTrackerMutation({
    onCompleted: () => {
      toast.success('Tracker deleted')
      refetch()
    },
    onError: (err) => toast.error(err.message)
  })

  const trackers: Tracker[] = data?.trackers ?? []
  const lastTracks = lastTracksData?.lastTracks ?? []
  const statusBySerial = new Map(lastTracks.map(track => [track.serialNumber, track.status]))
  const dateBySerial = new Map(lastTracks.map(track => [track.serialNumber, track.date]))

  const deleteTracker = (id: string) => deleteTrackerMutation({ variables: { id } })

  return { trackers, loading: loading || lastTracksLoading, deleteTracker, refetch, statusBySerial, dateBySerial }
}

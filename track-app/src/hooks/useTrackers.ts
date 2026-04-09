import { toast } from 'react-toastify'
import { useGetTrackersQuery, useDeleteTrackerMutation, useLastTracksQuery, GetTrackersQuery } from '../generated/graphql'

export type Tracker = NonNullable<NonNullable<GetTrackersQuery['trackers']>['items']>[number]

export function useTrackers(page = 1, pageSize = 20) {
  const offset = Math.max(0, (page - 1) * pageSize)
  const { data, loading, refetch } = useGetTrackersQuery({
    fetchPolicy: 'cache-and-network',
    variables: { offset, limit: pageSize }
  })
  const { data: lastTracksData, loading: lastTracksLoading } = useLastTracksQuery({ fetchPolicy: 'cache-and-network' })

  const [deleteTrackerMutation] = useDeleteTrackerMutation({
    onCompleted: () => {
      toast.success('Tracker deleted')
      refetch()
    },
    onError: (err) => toast.error(err.message)
  })

  const trackers: Tracker[] = data?.trackers?.items ?? []
  const totalCount = data?.trackers?.totalCount ?? 0
  const lastTracks = lastTracksData?.lastTracks ?? []
  const statusBySerial = new Map(lastTracks.map(track => [track.serialNumber, track.status]))
  const dateBySerial = new Map(lastTracks.map(track => [track.serialNumber, track.date]))

  const deleteTracker = (id: string) => deleteTrackerMutation({ variables: { id } })

  return { trackers, totalCount, loading: loading || lastTracksLoading, deleteTracker, refetch, statusBySerial, dateBySerial }
}

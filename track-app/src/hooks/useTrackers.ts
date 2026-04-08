import { toast } from 'react-toastify'
import { useGetTrackersQuery, useDeleteTrackerMutation, GetTrackersQuery } from '../generated/graphql'

export type Tracker = NonNullable<GetTrackersQuery['trackers']>[number]

export function useTrackers() {
  const { data, loading, refetch } = useGetTrackersQuery({ fetchPolicy: 'cache-and-network' })

  const [deleteTrackerMutation] = useDeleteTrackerMutation({
    onCompleted: () => {
      toast.success('Tracker deleted')
      refetch()
    },
    onError: (err) => toast.error(err.message)
  })

  const trackers: Tracker[] = data?.trackers ?? []
  const deleteTracker = (id: string) => deleteTrackerMutation({ variables: { id } })

  return { trackers, loading, deleteTracker, refetch }
}

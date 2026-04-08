import { useTrackerBySnQuery, useTrackRangeLazyQuery, TrackerBySnQuery, TrackRangeQuery } from '../generated/graphql'
import { toast } from 'react-toastify'

export type TrackingTracker = NonNullable<TrackerBySnQuery['trackerBySN']>
export type TrackPoint = NonNullable<TrackRangeQuery['trackRange']>[number]

export function useTrackingDetail(serialNumber: string) {
  const { data: trackerData, loading: trackerLoading } = useTrackerBySnQuery({
    variables: { serialNumber },
    skip: !serialNumber,
    fetchPolicy: 'cache-and-network',
    onError: (err) => toast.error(err.message)
  })

  const [fetchRange, { data: rangeData, loading: rangeLoading }] = useTrackRangeLazyQuery({
    onError: (err) => toast.error(err.message)
  })

  const tracker: TrackingTracker | null = trackerData?.trackerBySN ?? null
  const trackRange: TrackPoint[] = rangeData?.trackRange ?? []

  const loadTrackRange = (trackerId: string, start: string, end: string) =>
    fetchRange({ variables: { trackerId, start: new Date(start).toISOString(), end: new Date(end).toISOString() } })

  return { tracker, trackerLoading, trackRange, rangeLoading, loadTrackRange }
}

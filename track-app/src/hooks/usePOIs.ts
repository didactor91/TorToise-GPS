import { toast } from 'react-toastify'
import { useGetPoIsQuery, useDeletePoiMutation, GetPoIsQuery } from '../generated/graphql'

export type Poi = NonNullable<NonNullable<GetPoIsQuery['pois']>['items']>[number]

export function usePOIs(page = 1, pageSize = 20) {
  const offset = Math.max(0, (page - 1) * pageSize)
  const { data, loading, refetch } = useGetPoIsQuery({
    fetchPolicy: 'cache-and-network',
    variables: { offset, limit: pageSize }
  })

  const [deletePoiMutation] = useDeletePoiMutation({
    onCompleted: () => {
      toast.success('POI deleted')
      refetch()
    },
    onError: (err) => toast.error(err.message)
  })

  const pois: Poi[] = data?.pois?.items ?? []
  const totalCount = data?.pois?.totalCount ?? 0
  const deletePOI = (id: string) => deletePoiMutation({ variables: { id } })

  return { pois, totalCount, loading, deletePOI, refetch }
}

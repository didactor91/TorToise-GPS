import { toast } from 'react-toastify'
import { useGetPoIsQuery, useDeletePoiMutation, GetPoIsQuery } from '../generated/graphql'

export type Poi = NonNullable<GetPoIsQuery['pois']>[number]

export function usePOIs() {
  const { data, loading, refetch } = useGetPoIsQuery({ fetchPolicy: 'cache-and-network' })

  const [deletePoiMutation] = useDeletePoiMutation({
    onCompleted: () => {
      toast.success('POI deleted')
      refetch()
    },
    onError: (err) => toast.error(err.message)
  })

  const pois: Poi[] = data?.pois ?? []
  const deletePOI = (id: string) => deletePoiMutation({ variables: { id } })

  return { pois, loading, deletePOI, refetch }
}

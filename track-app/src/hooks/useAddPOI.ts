import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAddPoiMutation, AddPoiInput } from '../generated/graphql'

export function useAddPOI() {
  const navigate = useNavigate()
  const [addPoiMutation, { loading }] = useAddPoiMutation({
    onCompleted: (data) => {
      toast.success(data.addPOI.message)
      navigate('/places')
    },
    onError: (err) => toast.error(err.message)
  })

  const addPOI = (input: AddPoiInput) => addPoiMutation({ variables: { input } })

  return { addPOI, loading }
}

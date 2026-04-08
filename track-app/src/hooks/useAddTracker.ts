import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAddTrackerMutation, AddTrackerInput } from '../generated/graphql'

export function useAddTracker() {
  const navigate = useNavigate()
  const [addTrackerMutation, { loading }] = useAddTrackerMutation({
    onCompleted: (data) => {
      toast.success(data.addTracker.message)
      navigate('/trackers')
    },
    onError: (err) => toast.error(err.message)
  })

  const addTracker = (input: AddTrackerInput) => addTrackerMutation({ variables: { input } })

  return { addTracker, loading }
}

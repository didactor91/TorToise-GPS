import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useMeQuery, useUpdateUserMutation, useDeleteUserMutation, UpdateUserInput } from '../generated/graphql'

export function useProfile() {
  const navigate = useNavigate()
  const { data, loading } = useMeQuery({ fetchPolicy: 'cache-and-network' })

  const [updateUserMutation] = useUpdateUserMutation({
    onCompleted: (d) => {
      toast.success(d.updateUser.message)
    },
    onError: (err) => toast.error(err.message),
    refetchQueries: ['Me']
  })

  const [deleteUserMutation] = useDeleteUserMutation({
    onCompleted: () => {
      sessionStorage.clear()
      navigate('/')
    },
    onError: (err) => toast.error(err.message)
  })

  const user = data?.me ?? null
  const updateUser = (input: UpdateUserInput) => updateUserMutation({ variables: { input } })
  const deleteUser = () => deleteUserMutation()

  return { user, loading, updateUser, deleteUser }
}

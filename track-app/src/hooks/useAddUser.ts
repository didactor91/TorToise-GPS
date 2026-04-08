import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useBackofficeCreateUserMutation, useMeQuery } from '../generated/graphql'

type AddUserInput = {
    name: string
    surname: string
    email: string
    password: string
    role: string
}

export function useAddUser() {
    const navigate = useNavigate()
    const { data } = useMeQuery({ fetchPolicy: 'cache-first' })
    const companyId = data?.me?.companyId

    const [createUserMutation, { loading }] = useBackofficeCreateUserMutation({
        onCompleted: (res) => {
            toast.success(res.backofficeCreateUser.message)
            navigate('/users')
        },
        onError: (err) => toast.error(err.message)
    })

    const addUser = async (input: AddUserInput) => {
        if (!companyId) {
            toast.error('Company not found for current user')
            return
        }
        await createUserMutation({
            variables: {
                input: {
                    ...input,
                    companyId
                }
            }
        })
    }

    return { addUser, loading, companyId: companyId || null }
}

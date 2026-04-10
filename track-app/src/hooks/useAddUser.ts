import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useBackofficeCreateUserMutation, useMeQuery } from '../generated/graphql'
import i18n from '../i18n'

type AddUserInput = {
    name: string
    surname: string
    email: string
    password: string
    language: string
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
            toast.error(i18n.t('users.companyNotFound'))
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

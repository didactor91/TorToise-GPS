import { useMemo } from 'react'
import { toast } from 'react-toastify'
import { useBackofficeUsersQuery, useMeQuery } from '../generated/graphql'

export type CompanyUser = {
    id: string
    name: string
    surname: string
    email: string
    role: string
}

export function useUsers() {
    const { data: meData, loading: meLoading } = useMeQuery({ fetchPolicy: 'cache-and-network' })
    const companyId = meData?.me?.companyId

    const { data, loading, refetch } = useBackofficeUsersQuery({
        fetchPolicy: 'cache-and-network',
        skip: !companyId,
        variables: { companyId: companyId || undefined },
        onError: (err) => toast.error(err.message)
    })

    const users = useMemo<CompanyUser[]>(
        () => (data?.backofficeUsers ?? []).map((user) => ({
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role
        })),
        [data]
    )

    return { users, loading: meLoading || loading, companyId: companyId || null, refetch }
}

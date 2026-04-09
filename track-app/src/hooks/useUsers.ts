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

export function useUsers(page = 1, pageSize = 20) {
    const { data: meData, loading: meLoading } = useMeQuery({ fetchPolicy: 'cache-and-network' })
    const companyId = meData?.me?.companyId
    const offset = Math.max(0, (page - 1) * pageSize)

    const { data, loading, refetch } = useBackofficeUsersQuery({
        fetchPolicy: 'cache-and-network',
        skip: !companyId,
        variables: { companyId: companyId || undefined, offset, limit: pageSize },
        onError: (err) => toast.error(err.message)
    })

    const users = useMemo<CompanyUser[]>(
        () => (data?.backofficeUsers?.items ?? []).map((user) => ({
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role
        })),
        [data]
    )

    return {
        users,
        totalCount: data?.backofficeUsers?.totalCount ?? 0,
        loading: meLoading || loading,
        companyId: companyId || null,
        refetch
    }
}

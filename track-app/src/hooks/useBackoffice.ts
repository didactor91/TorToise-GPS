import { useMemo } from 'react'
import { toast } from 'react-toastify'
import {
    BackofficeCompaniesDocument,
    BackofficeUsersDocument,
    useBackofficeCompaniesQuery,
    useBackofficeCreateCompanyMutation,
    useBackofficeCreateUserMutation,
    useBackofficeUpdateCompanyMutation,
    useBackofficeUpdateUserMutation,
    useBackofficeUsersQuery
} from '../generated/graphql'

export type BackofficeCompany = {
    id: string
    name: string
    slug: string
    active: boolean
    featureKeys: string[]
}

export type BackofficeUser = {
    id: string
    name: string
    surname: string
    email: string
    role: string
    companyId: string | null
    permissionKeys: string[]
}

export function useBackoffice(usersPage = 1, pageSize = 20, enableUsersQuery = true) {
    const offset = Math.max(0, (usersPage - 1) * pageSize)
    const companiesQuery = useBackofficeCompaniesQuery({
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
        onError: (err) => toast.error(err.message)
    })
    const usersQuery = useBackofficeUsersQuery({
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
        skip: !enableUsersQuery,
        variables: { offset, limit: pageSize },
        onError: (err) => toast.error(err.message)
    })

    const [createCompanyMutation] = useBackofficeCreateCompanyMutation({
        onError: (err) => toast.error(err.message),
        refetchQueries: [{ query: BackofficeCompaniesDocument }]
    })

    const [updateCompanyMutation] = useBackofficeUpdateCompanyMutation({
        onError: (err) => toast.error(err.message),
        refetchQueries: [{ query: BackofficeCompaniesDocument }]
    })

    const [createUserMutation] = useBackofficeCreateUserMutation({
        onError: (err) => toast.error(err.message),
        refetchQueries: [{ query: BackofficeUsersDocument }]
    })

    const [updateUserMutation] = useBackofficeUpdateUserMutation({
        onError: (err) => toast.error(err.message),
        refetchQueries: [{ query: BackofficeUsersDocument }]
    })

    const companies = useMemo<BackofficeCompany[]>(
        () => (companiesQuery.data?.backofficeCompanies ?? []).map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            active: c.active,
            featureKeys: c.featureKeys ?? []
        })),
        [companiesQuery.data]
    )

    const users = useMemo<BackofficeUser[]>(
        () => (usersQuery.data?.backofficeUsers?.items ?? []).map(u => ({
            id: u.id,
            name: u.name,
            surname: u.surname,
            email: u.email,
            role: u.role,
            companyId: u.companyId ?? null,
            permissionKeys: u.permissionKeys ?? []
        })),
        [usersQuery.data]
    )

    const createCompany = async (name: string, active: boolean, featureKeys?: string[]) => {
        const res = await createCompanyMutation({ variables: { input: { name, active, featureKeys } } })
        if (res.data?.backofficeCreateCompany.success) toast.success(res.data.backofficeCreateCompany.message)
    }

    const updateCompany = async (id: string, name: string, slug: string, active: boolean, featureKeys?: string[]) => {
        const res = await updateCompanyMutation({ variables: { id, input: { name, slug, active, featureKeys } } })
        if (res.data?.backofficeUpdateCompany.success) toast.success(res.data.backofficeUpdateCompany.message)
    }

    const createUser = async (input: {
        name: string
        surname: string
        email: string
        password: string
        role: string
        companyId: string
        permissionKeys?: string[]
    }) => {
        const res = await createUserMutation({ variables: { input } })
        if (res.data?.backofficeCreateUser.success) toast.success(res.data.backofficeCreateUser.message)
    }

    const updateUser = async (id: string, input: {
        name?: string
        surname?: string
        email?: string
        role?: string
        companyId?: string
        permissionKeys?: string[]
    }) => {
        const res = await updateUserMutation({ variables: { id, input } })
        if (res.data?.backofficeUpdateUser.success) toast.success(res.data.backofficeUpdateUser.message)
    }

    return {
        companies,
        users,
        usersTotalCount: enableUsersQuery ? (usersQuery.data?.backofficeUsers?.totalCount ?? 0) : 0,
        loading: companiesQuery.loading || usersQuery.loading,
        createCompany,
        updateCompany,
        createUser,
        updateUser
    }
}

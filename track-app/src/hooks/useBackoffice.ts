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
}

export type BackofficeUser = {
    id: string
    name: string
    surname: string
    email: string
    role: string
    companyId: string | null
}

export function useBackoffice() {
    const companiesQuery = useBackofficeCompaniesQuery({ fetchPolicy: 'cache-and-network' })
    const usersQuery = useBackofficeUsersQuery({ fetchPolicy: 'cache-and-network' })

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
            active: c.active
        })),
        [companiesQuery.data]
    )

    const users = useMemo<BackofficeUser[]>(
        () => (usersQuery.data?.backofficeUsers ?? []).map(u => ({
            id: u.id,
            name: u.name,
            surname: u.surname,
            email: u.email,
            role: u.role,
            companyId: u.companyId ?? null
        })),
        [usersQuery.data]
    )

    const createCompany = async (name: string, slug: string, active: boolean) => {
        const res = await createCompanyMutation({ variables: { input: { name, slug, active } } })
        if (res.data?.backofficeCreateCompany.success) toast.success(res.data.backofficeCreateCompany.message)
    }

    const updateCompany = async (id: string, name: string, slug: string, active: boolean) => {
        const res = await updateCompanyMutation({ variables: { id, input: { name, slug, active } } })
        if (res.data?.backofficeUpdateCompany.success) toast.success(res.data.backofficeUpdateCompany.message)
    }

    const createUser = async (input: {
        name: string
        surname: string
        email: string
        password: string
        role: string
        companyId: string
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
    }) => {
        const res = await updateUserMutation({ variables: { id, input } })
        if (res.data?.backofficeUpdateUser.success) toast.success(res.data.backofficeUpdateUser.message)
    }

    return {
        companies,
        users,
        loading: companiesQuery.loading || usersQuery.loading,
        createCompany,
        updateCompany,
        createUser,
        updateUser
    }
}

import { useMemo } from 'react'
import { gql, useMutation } from '@apollo/client'
import { toast } from 'react-toastify'
import {
    BackofficeTrackerDocument,
    BackofficeTrackersDocument,
    BackofficeCompaniesDocument,
    BackofficeUsersDocument,
    useBackofficeCompaniesQuery,
    useBackofficeTrackerQuery,
    useBackofficeTrackersQuery,
    useBackofficeCreateCompanyMutation,
    useBackofficeCreateTrackerMutation,
    useBackofficeCreateUserMutation,
    useBackofficeUpdateTrackerAliasMutation,
    useBackofficeUpdateCompanyMutation,
    useBackofficeUpdateUserMutation,
    useBackofficeUsersQuery
} from '../generated/graphql'

const BACKOFFICE_UPDATE_TRACKER_MUTATION = gql`
    mutation BackofficeUpdateTracker($id: ID!, $input: BackofficeUpdateTrackerInput!) {
        backofficeUpdateTracker(id: $id, input: $input) {
            success
            message
        }
    }
`

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
    language: string
    role: string
    companyId: string | null
    permissionKeys: string[]
}

export type BackofficeTracker = {
    id: string
    serialNumber: string
    alias: string | null
    emoji: string | null
}

export function useBackoffice(
    usersPage = 1,
    pageSize = 20,
    enableUsersQuery = true,
    trackersPage = 1,
    trackersPageSize = 20,
    enableTrackersQuery = false,
    trackerId?: string
) {
    const offset = Math.max(0, (usersPage - 1) * pageSize)
    const trackersOffset = Math.max(0, (trackersPage - 1) * trackersPageSize)
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
    const trackersQuery = useBackofficeTrackersQuery({
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
        skip: !enableTrackersQuery,
        variables: { offset: trackersOffset, limit: trackersPageSize },
        onError: (err) => toast.error(err.message)
    })
    const trackerDetailQuery = useBackofficeTrackerQuery({
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
        skip: !trackerId,
        variables: { id: trackerId || '' },
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

    const [createTrackerMutation] = useBackofficeCreateTrackerMutation({
        onError: (err) => toast.error(err.message),
        refetchQueries: [{ query: BackofficeCompaniesDocument }]
    })

    const [updateUserMutation] = useBackofficeUpdateUserMutation({
        onError: (err) => toast.error(err.message),
        refetchQueries: [{ query: BackofficeUsersDocument }]
    })
    const [updateTrackerAliasMutation] = useBackofficeUpdateTrackerAliasMutation({
        onError: (err) => toast.error(err.message)
    })
    const [updateTrackerMutation] = useMutation(BACKOFFICE_UPDATE_TRACKER_MUTATION, {
        onError: (err) => toast.error(err.message)
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
            language: u.language || 'en',
            role: u.role,
            companyId: u.companyId ?? null,
            permissionKeys: u.permissionKeys ?? []
        })),
        [usersQuery.data]
    )
    const trackers = useMemo<BackofficeTracker[]>(
        () => (trackersQuery.data?.backofficeTrackers?.items ?? []).map(t => ({
            id: t.id,
            serialNumber: t.serialNumber,
            alias: t.alias ?? null,
            emoji: t.emoji ?? '🚚'
        })),
        [trackersQuery.data]
    )
    const trackerDetail = useMemo<BackofficeTracker | null>(() => {
        const t = trackerDetailQuery.data?.backofficeTracker
        if (!t) return null
        return {
            id: t.id,
            serialNumber: t.serialNumber,
            alias: t.alias ?? null,
            emoji: t.emoji ?? '🚚'
        }
    }, [trackerDetailQuery.data])

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
        language?: string
        role: string
        companyId: string
        permissionKeys?: string[]
    }) => {
        const res = await createUserMutation({ variables: { input } })
        if (res.data?.backofficeCreateUser.success) toast.success(res.data.backofficeCreateUser.message)
    }

    const createTracker = async (input: {
        serialNumber: string
        alias?: string
        emoji?: string
        companyId: string
    }) => {
        const res = await createTrackerMutation({ variables: { input } })
        if (res.data?.backofficeCreateTracker.success) toast.success(res.data.backofficeCreateTracker.message)
    }

    const updateUser = async (id: string, input: {
        name?: string
        surname?: string
        email?: string
        language?: string
        role?: string
        companyId?: string
        permissionKeys?: string[]
    }) => {
        const res = await updateUserMutation({ variables: { id, input } })
        if (res.data?.backofficeUpdateUser.success) toast.success(res.data.backofficeUpdateUser.message)
    }
    const updateTrackerAlias = async (id: string, alias: string) => {
        const res = await updateTrackerAliasMutation({
            variables: { id, alias },
            refetchQueries: [
                { query: BackofficeTrackersDocument },
                { query: BackofficeTrackerDocument, variables: { id } }
            ]
        })
        if (res.data?.backofficeUpdateTrackerAlias.success) toast.success(res.data.backofficeUpdateTrackerAlias.message)
    }
    const updateTracker = async (id: string, input: { alias?: string, emoji?: string }) => {
        const res = await updateTrackerMutation({
            variables: { id, input },
            refetchQueries: [
                { query: BackofficeTrackersDocument },
                { query: BackofficeTrackerDocument, variables: { id } }
            ]
        })
        if (res.data?.backofficeUpdateTracker?.success) toast.success(res.data.backofficeUpdateTracker.message)
    }

    return {
        companies,
        users,
        trackers,
        trackerDetail,
        usersTotalCount: enableUsersQuery ? (usersQuery.data?.backofficeUsers?.totalCount ?? 0) : 0,
        trackersTotalCount: enableTrackersQuery ? (trackersQuery.data?.backofficeTrackers?.totalCount ?? 0) : 0,
        loading: companiesQuery.loading || usersQuery.loading || trackersQuery.loading || trackerDetailQuery.loading,
        createCompany,
        updateCompany,
        createUser,
        createTracker,
        updateUser,
        updateTrackerAlias,
        updateTracker
    }
}

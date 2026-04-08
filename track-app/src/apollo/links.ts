import { ApolloLink, HttpLink, split, from } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { onError } from '@apollo/client/link/error'
import { setContext } from '@apollo/client/link/context'
import { isTokenExpired, notifySessionExpired } from './session'

const apiUrl: string | undefined = import.meta.env.VITE_API_URL
const GQL_HTTP = (apiUrl || '/api').replace('/api', '') + '/graphql'
const GQL_WS   = GQL_HTTP.replace(/^http/, 'ws')

// Pre-flight expiry check — abort before sending if token is stale
const sessionLink = new ApolloLink((operation, forward) => {
  const token = sessionStorage.getItem('userToken')
  if (token && isTokenExpired(token)) {
    notifySessionExpired()
    return null
  }
  return forward(operation)
})

// Attach Authorization header
const authLink = setContext((_, { headers }) => {
  const token = sessionStorage.getItem('userToken')
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {})
    }
  }
})

// Handle UNAUTHENTICATED from server
const errorLink = onError(({ graphQLErrors }) => {
  if (graphQLErrors?.some(e => e.extensions?.code === 'UNAUTHENTICATED'))
    notifySessionExpired()
})

const httpLink = new HttpLink({ uri: GQL_HTTP })

const wsLink = new GraphQLWsLink(createClient({
  url: GQL_WS,

  // Auth token sent on every (re)connection attempt
  connectionParams: (): Record<string, string> | undefined => {
    const token = sessionStorage.getItem('userToken')
    return token ? { authorization: `Bearer ${token}` } : undefined
  },

  // Reconnect automatically on any abnormal close
  shouldRetry: () => true,

  // Exponential backoff: 1s → 2s → 4s → 8s → cap at 30s
  retryAttempts: Infinity,
  retryWait: async (attempt: number) => {
    const delay = Math.min(1000 * 2 ** attempt, 30_000)
    await new Promise(resolve => setTimeout(resolve, delay))
  },

  // Keep connection alive — ping every 30s, timeout after 5s silence
  keepAlive: 30_000,

  on: {
    connected: () => console.debug('[WS] Connected'),
    closed: (event) => console.debug('[WS] Closed', (event as CloseEvent).code),
    error: (err) => console.debug('[WS] Error', err),
    connecting: () => console.debug('[WS] Reconnecting…'),
  }
}))

// Send subscriptions over WS, everything else over HTTP
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query)
    return def.kind === 'OperationDefinition' && def.operation === 'subscription'
  },
  wsLink,
  httpLink
)

export const link = from([errorLink, sessionLink, authLink, splitLink])

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
  connectionParams: (): Record<string, string> | undefined => {
    const token = sessionStorage.getItem('userToken')
    return token ? { authorization: `Bearer ${token}` } : undefined
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

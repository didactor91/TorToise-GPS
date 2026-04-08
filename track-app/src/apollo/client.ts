import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { link } from './links'

export const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link,
  cache: new InMemoryCache()
})

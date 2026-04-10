// AUTO-GENERATED — do not edit manually
// Run: npm run codegen (requires API server)
// Local:  npm run codegen
// CI/CD:  GRAPHQL_SCHEMA_URL=https://api.yourdomain.com/graphql npm run codegen

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
};

export type AddPoiInput = {
  color: Scalars['String']['input'];
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  title: Scalars['String']['input'];
};

export type AddTrackerInput = {
  licensePlate?: InputMaybe<Scalars['String']['input']>;
  serialNumber: Scalars['String']['input'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
};

export type BackofficeCreateCompanyInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  featureKeys?: InputMaybe<Array<Scalars['String']['input']>>;
  name: Scalars['String']['input'];
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type BackofficeCreateUserInput = {
  companyId: Scalars['ID']['input'];
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  permissionKeys?: InputMaybe<Array<Scalars['String']['input']>>;
  role: Scalars['String']['input'];
  surname: Scalars['String']['input'];
};

export type BackofficeUpdateCompanyInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  featureKeys?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type BackofficeUpdateUserInput = {
  companyId?: InputMaybe<Scalars['ID']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  permissionKeys?: InputMaybe<Array<Scalars['String']['input']>>;
  role?: InputMaybe<Scalars['String']['input']>;
  surname?: InputMaybe<Scalars['String']['input']>;
};

export type BackofficeUser = {
  __typename?: 'BackofficeUser';
  companyId?: Maybe<Scalars['ID']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissionKeys: Array<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  surname: Scalars['String']['output'];
};

export type Company = {
  __typename?: 'Company';
  active: Scalars['Boolean']['output'];
  featureKeys: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type LiveTrack = {
  __typename?: 'LiveTrack';
  date: Scalars['DateTime']['output'];
  latitude: Scalars['Float']['output'];
  licensePlate?: Maybe<Scalars['String']['output']>;
  longitude: Scalars['Float']['output'];
  serialNumber: Scalars['String']['output'];
  speed: Scalars['Float']['output'];
  status: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addPOI: MutationResult;
  addTracker: MutationResult;
  backofficeCreateCompany: MutationResult;
  backofficeCreateUser: MutationResult;
  backofficeUpdateCompany: MutationResult;
  backofficeUpdateUser: MutationResult;
  deletePOI: MutationResult;
  deleteTracker: MutationResult;
  deleteUser: MutationResult;
  loginUser: AuthPayload;
  registerUser: MutationResult;
  updatePOI: MutationResult;
  updateTracker: MutationResult;
  updateUser: MutationResult;
};


export type MutationAddPoiArgs = {
  input: AddPoiInput;
};


export type MutationAddTrackerArgs = {
  input: AddTrackerInput;
};


export type MutationBackofficeCreateCompanyArgs = {
  input: BackofficeCreateCompanyInput;
};


export type MutationBackofficeCreateUserArgs = {
  input: BackofficeCreateUserInput;
};


export type MutationBackofficeUpdateCompanyArgs = {
  id: Scalars['ID']['input'];
  input: BackofficeUpdateCompanyInput;
};


export type MutationBackofficeUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: BackofficeUpdateUserInput;
};


export type MutationDeletePoiArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTrackerArgs = {
  id: Scalars['ID']['input'];
};


export type MutationLoginUserArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRegisterUserArgs = {
  input: RegisterUserInput;
};


export type MutationUpdatePoiArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePoiInput;
};


export type MutationUpdateTrackerArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTrackerInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};

export type MutationResult = {
  __typename?: 'MutationResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Poi = {
  __typename?: 'POI';
  color: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  title: Scalars['String']['output'];
};

export type PagedBackofficeUsers = {
  __typename?: 'PagedBackofficeUsers';
  items: Array<BackofficeUser>;
  totalCount: Scalars['Int']['output'];
};

export type PagedPoIs = {
  __typename?: 'PagedPOIs';
  items: Array<Poi>;
  totalCount: Scalars['Int']['output'];
};

export type PagedTrackers = {
  __typename?: 'PagedTrackers';
  items: Array<Tracker>;
  totalCount: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  backofficeCompanies: Array<Company>;
  backofficeUsers: PagedBackofficeUsers;
  lastTrack?: Maybe<Track>;
  lastTracks: Array<LiveTrack>;
  me: User;
  poi: Poi;
  pois: PagedPoIs;
  trackRange: Array<Track>;
  tracker: Tracker;
  trackerByLP: Tracker;
  trackerBySN: Tracker;
  trackers: PagedTrackers;
};


export type QueryBackofficeUsersArgs = {
  companyId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLastTrackArgs = {
  trackerId: Scalars['ID']['input'];
};


export type QueryPoiArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPoisArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTrackRangeArgs = {
  end: Scalars['DateTime']['input'];
  start: Scalars['DateTime']['input'];
  trackerId: Scalars['ID']['input'];
};


export type QueryTrackerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTrackerByLpArgs = {
  licensePlate: Scalars['String']['input'];
};


export type QueryTrackerBySnArgs = {
  serialNumber: Scalars['String']['input'];
};


export type QueryTrackersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type RegisterUserInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  surname: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  liveTracksUpdated: Array<LiveTrack>;
};

export type Track = {
  __typename?: 'Track';
  date: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  serialNumber: Scalars['String']['output'];
  speed: Scalars['Float']['output'];
  status: Scalars['String']['output'];
};

export type Tracker = {
  __typename?: 'Tracker';
  id: Scalars['ID']['output'];
  licensePlate?: Maybe<Scalars['String']['output']>;
  serialNumber: Scalars['String']['output'];
};

export type UpdatePoiInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTrackerInput = {
  licensePlate?: InputMaybe<Scalars['String']['input']>;
  serialNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  currentPassword?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  newPassword?: InputMaybe<Scalars['String']['input']>;
  surname?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  companyId?: Maybe<Scalars['ID']['output']>;
  email: Scalars['String']['output'];
  featureKeys: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissionKeys: Array<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  surname: Scalars['String']['output'];
};

export type BackofficeCompaniesQueryVariables = Exact<{ [key: string]: never; }>;


export type BackofficeCompaniesQuery = { __typename?: 'Query', backofficeCompanies: Array<{ __typename?: 'Company', id: string, name: string, slug: string, active: boolean, featureKeys: Array<string> }> };

export type BackofficeUsersQueryVariables = Exact<{
  companyId?: InputMaybe<Scalars['ID']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type BackofficeUsersQuery = { __typename?: 'Query', backofficeUsers: { __typename?: 'PagedBackofficeUsers', totalCount: number, items: Array<{ __typename?: 'BackofficeUser', id: string, name: string, surname: string, email: string, role: string, companyId?: string | null, permissionKeys: Array<string> }> } };

export type BackofficeCreateCompanyMutationVariables = Exact<{
  input: BackofficeCreateCompanyInput;
}>;


export type BackofficeCreateCompanyMutation = { __typename?: 'Mutation', backofficeCreateCompany: { __typename?: 'MutationResult', success: boolean, message: string } };

export type BackofficeUpdateCompanyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: BackofficeUpdateCompanyInput;
}>;


export type BackofficeUpdateCompanyMutation = { __typename?: 'Mutation', backofficeUpdateCompany: { __typename?: 'MutationResult', success: boolean, message: string } };

export type BackofficeCreateUserMutationVariables = Exact<{
  input: BackofficeCreateUserInput;
}>;


export type BackofficeCreateUserMutation = { __typename?: 'Mutation', backofficeCreateUser: { __typename?: 'MutationResult', success: boolean, message: string } };

export type BackofficeUpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: BackofficeUpdateUserInput;
}>;


export type BackofficeUpdateUserMutation = { __typename?: 'Mutation', backofficeUpdateUser: { __typename?: 'MutationResult', success: boolean, message: string } };

export type GetTrackersQueryVariables = Exact<{
  offset?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTrackersQuery = { __typename?: 'Query', trackers: { __typename?: 'PagedTrackers', totalCount: number, items: Array<{ __typename?: 'Tracker', id: string, serialNumber: string, licensePlate?: string | null }> } };

export type TrackerBySnQueryVariables = Exact<{
  serialNumber: Scalars['String']['input'];
}>;


export type TrackerBySnQuery = { __typename?: 'Query', trackerBySN: { __typename?: 'Tracker', id: string, serialNumber: string, licensePlate?: string | null } };

export type AddTrackerMutationVariables = Exact<{
  input: AddTrackerInput;
}>;


export type AddTrackerMutation = { __typename?: 'Mutation', addTracker: { __typename?: 'MutationResult', success: boolean, message: string } };

export type DeleteTrackerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTrackerMutation = { __typename?: 'Mutation', deleteTracker: { __typename?: 'MutationResult', success: boolean, message: string } };

export type UpdateTrackerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateTrackerInput;
}>;


export type UpdateTrackerMutation = { __typename?: 'Mutation', updateTracker: { __typename?: 'MutationResult', success: boolean, message: string } };

export type LoginUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginUserMutation = { __typename?: 'Mutation', loginUser: { __typename?: 'AuthPayload', token: string } };

export type RegisterUserMutationVariables = Exact<{
  input: RegisterUserInput;
}>;


export type RegisterUserMutation = { __typename?: 'Mutation', registerUser: { __typename?: 'MutationResult', success: boolean, message: string } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, name: string, surname: string, email: string, role: string, companyId?: string | null, permissionKeys: Array<string>, featureKeys: Array<string> } };

export type UpdateUserMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'MutationResult', success: boolean, message: string } };

export type DeleteUserMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser: { __typename?: 'MutationResult', success: boolean, message: string } };

export type GetPoIsQueryVariables = Exact<{
  offset?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPoIsQuery = { __typename?: 'Query', pois: { __typename?: 'PagedPOIs', totalCount: number, items: Array<{ __typename?: 'POI', id: string, title: string, color: string, latitude: number, longitude: number }> } };

export type AddPoiMutationVariables = Exact<{
  input: AddPoiInput;
}>;


export type AddPoiMutation = { __typename?: 'Mutation', addPOI: { __typename?: 'MutationResult', success: boolean, message: string } };

export type DeletePoiMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePoiMutation = { __typename?: 'Mutation', deletePOI: { __typename?: 'MutationResult', success: boolean, message: string } };

export type LastTracksQueryVariables = Exact<{ [key: string]: never; }>;


export type LastTracksQuery = { __typename?: 'Query', lastTracks: Array<{ __typename?: 'LiveTrack', serialNumber: string, latitude: number, longitude: number, speed: number, status: string, date: any, licensePlate?: string | null }> };

export type TrackRangeQueryVariables = Exact<{
  trackerId: Scalars['ID']['input'];
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type TrackRangeQuery = { __typename?: 'Query', trackRange: Array<{ __typename?: 'Track', id: string, serialNumber: string, latitude: number, longitude: number, speed: number, status: string, date: any }> };

export type LiveTracksUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type LiveTracksUpdatedSubscription = { __typename?: 'Subscription', liveTracksUpdated: Array<{ __typename?: 'LiveTrack', serialNumber: string, latitude: number, longitude: number, speed: number, status: string, date: any, licensePlate?: string | null }> };


export const BackofficeCompaniesDocument = gql`
    query BackofficeCompanies {
  backofficeCompanies {
    id
    name
    slug
    active
    featureKeys
  }
}
    `;

/**
 * __useBackofficeCompaniesQuery__
 *
 * To run a query within a React component, call `useBackofficeCompaniesQuery` and pass it any options that fit your needs.
 * When your component renders, `useBackofficeCompaniesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBackofficeCompaniesQuery({
 *   variables: {
 *   },
 * });
 */
export function useBackofficeCompaniesQuery(baseOptions?: Apollo.QueryHookOptions<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>(BackofficeCompaniesDocument, options);
      }
export function useBackofficeCompaniesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>(BackofficeCompaniesDocument, options);
        }
// @ts-ignore
export function useBackofficeCompaniesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>): Apollo.UseSuspenseQueryResult<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>;
export function useBackofficeCompaniesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>): Apollo.UseSuspenseQueryResult<BackofficeCompaniesQuery | undefined, BackofficeCompaniesQueryVariables>;
export function useBackofficeCompaniesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>(BackofficeCompaniesDocument, options);
        }
export type BackofficeCompaniesQueryHookResult = ReturnType<typeof useBackofficeCompaniesQuery>;
export type BackofficeCompaniesLazyQueryHookResult = ReturnType<typeof useBackofficeCompaniesLazyQuery>;
export type BackofficeCompaniesSuspenseQueryHookResult = ReturnType<typeof useBackofficeCompaniesSuspenseQuery>;
export type BackofficeCompaniesQueryResult = Apollo.QueryResult<BackofficeCompaniesQuery, BackofficeCompaniesQueryVariables>;
export const BackofficeUsersDocument = gql`
    query BackofficeUsers($companyId: ID, $offset: Int = 0, $limit: Int = 20) {
  backofficeUsers(companyId: $companyId, offset: $offset, limit: $limit) {
    totalCount
    items {
      id
      name
      surname
      email
      role
      companyId
      permissionKeys
    }
  }
}
    `;

/**
 * __useBackofficeUsersQuery__
 *
 * To run a query within a React component, call `useBackofficeUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useBackofficeUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBackofficeUsersQuery({
 *   variables: {
 *      companyId: // value for 'companyId'
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useBackofficeUsersQuery(baseOptions?: Apollo.QueryHookOptions<BackofficeUsersQuery, BackofficeUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BackofficeUsersQuery, BackofficeUsersQueryVariables>(BackofficeUsersDocument, options);
      }
export function useBackofficeUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BackofficeUsersQuery, BackofficeUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BackofficeUsersQuery, BackofficeUsersQueryVariables>(BackofficeUsersDocument, options);
        }
// @ts-ignore
export function useBackofficeUsersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<BackofficeUsersQuery, BackofficeUsersQueryVariables>): Apollo.UseSuspenseQueryResult<BackofficeUsersQuery, BackofficeUsersQueryVariables>;
export function useBackofficeUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BackofficeUsersQuery, BackofficeUsersQueryVariables>): Apollo.UseSuspenseQueryResult<BackofficeUsersQuery | undefined, BackofficeUsersQueryVariables>;
export function useBackofficeUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BackofficeUsersQuery, BackofficeUsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BackofficeUsersQuery, BackofficeUsersQueryVariables>(BackofficeUsersDocument, options);
        }
export type BackofficeUsersQueryHookResult = ReturnType<typeof useBackofficeUsersQuery>;
export type BackofficeUsersLazyQueryHookResult = ReturnType<typeof useBackofficeUsersLazyQuery>;
export type BackofficeUsersSuspenseQueryHookResult = ReturnType<typeof useBackofficeUsersSuspenseQuery>;
export type BackofficeUsersQueryResult = Apollo.QueryResult<BackofficeUsersQuery, BackofficeUsersQueryVariables>;
export const BackofficeCreateCompanyDocument = gql`
    mutation BackofficeCreateCompany($input: BackofficeCreateCompanyInput!) {
  backofficeCreateCompany(input: $input) {
    success
    message
  }
}
    `;
export type BackofficeCreateCompanyMutationFn = Apollo.MutationFunction<BackofficeCreateCompanyMutation, BackofficeCreateCompanyMutationVariables>;

/**
 * __useBackofficeCreateCompanyMutation__
 *
 * To run a mutation, you first call `useBackofficeCreateCompanyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBackofficeCreateCompanyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [backofficeCreateCompanyMutation, { data, loading, error }] = useBackofficeCreateCompanyMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useBackofficeCreateCompanyMutation(baseOptions?: Apollo.MutationHookOptions<BackofficeCreateCompanyMutation, BackofficeCreateCompanyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<BackofficeCreateCompanyMutation, BackofficeCreateCompanyMutationVariables>(BackofficeCreateCompanyDocument, options);
      }
export type BackofficeCreateCompanyMutationHookResult = ReturnType<typeof useBackofficeCreateCompanyMutation>;
export type BackofficeCreateCompanyMutationResult = Apollo.MutationResult<BackofficeCreateCompanyMutation>;
export type BackofficeCreateCompanyMutationOptions = Apollo.BaseMutationOptions<BackofficeCreateCompanyMutation, BackofficeCreateCompanyMutationVariables>;
export const BackofficeUpdateCompanyDocument = gql`
    mutation BackofficeUpdateCompany($id: ID!, $input: BackofficeUpdateCompanyInput!) {
  backofficeUpdateCompany(id: $id, input: $input) {
    success
    message
  }
}
    `;
export type BackofficeUpdateCompanyMutationFn = Apollo.MutationFunction<BackofficeUpdateCompanyMutation, BackofficeUpdateCompanyMutationVariables>;

/**
 * __useBackofficeUpdateCompanyMutation__
 *
 * To run a mutation, you first call `useBackofficeUpdateCompanyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBackofficeUpdateCompanyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [backofficeUpdateCompanyMutation, { data, loading, error }] = useBackofficeUpdateCompanyMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useBackofficeUpdateCompanyMutation(baseOptions?: Apollo.MutationHookOptions<BackofficeUpdateCompanyMutation, BackofficeUpdateCompanyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<BackofficeUpdateCompanyMutation, BackofficeUpdateCompanyMutationVariables>(BackofficeUpdateCompanyDocument, options);
      }
export type BackofficeUpdateCompanyMutationHookResult = ReturnType<typeof useBackofficeUpdateCompanyMutation>;
export type BackofficeUpdateCompanyMutationResult = Apollo.MutationResult<BackofficeUpdateCompanyMutation>;
export type BackofficeUpdateCompanyMutationOptions = Apollo.BaseMutationOptions<BackofficeUpdateCompanyMutation, BackofficeUpdateCompanyMutationVariables>;
export const BackofficeCreateUserDocument = gql`
    mutation BackofficeCreateUser($input: BackofficeCreateUserInput!) {
  backofficeCreateUser(input: $input) {
    success
    message
  }
}
    `;
export type BackofficeCreateUserMutationFn = Apollo.MutationFunction<BackofficeCreateUserMutation, BackofficeCreateUserMutationVariables>;

/**
 * __useBackofficeCreateUserMutation__
 *
 * To run a mutation, you first call `useBackofficeCreateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBackofficeCreateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [backofficeCreateUserMutation, { data, loading, error }] = useBackofficeCreateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useBackofficeCreateUserMutation(baseOptions?: Apollo.MutationHookOptions<BackofficeCreateUserMutation, BackofficeCreateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<BackofficeCreateUserMutation, BackofficeCreateUserMutationVariables>(BackofficeCreateUserDocument, options);
      }
export type BackofficeCreateUserMutationHookResult = ReturnType<typeof useBackofficeCreateUserMutation>;
export type BackofficeCreateUserMutationResult = Apollo.MutationResult<BackofficeCreateUserMutation>;
export type BackofficeCreateUserMutationOptions = Apollo.BaseMutationOptions<BackofficeCreateUserMutation, BackofficeCreateUserMutationVariables>;
export const BackofficeUpdateUserDocument = gql`
    mutation BackofficeUpdateUser($id: ID!, $input: BackofficeUpdateUserInput!) {
  backofficeUpdateUser(id: $id, input: $input) {
    success
    message
  }
}
    `;
export type BackofficeUpdateUserMutationFn = Apollo.MutationFunction<BackofficeUpdateUserMutation, BackofficeUpdateUserMutationVariables>;

/**
 * __useBackofficeUpdateUserMutation__
 *
 * To run a mutation, you first call `useBackofficeUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBackofficeUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [backofficeUpdateUserMutation, { data, loading, error }] = useBackofficeUpdateUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useBackofficeUpdateUserMutation(baseOptions?: Apollo.MutationHookOptions<BackofficeUpdateUserMutation, BackofficeUpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<BackofficeUpdateUserMutation, BackofficeUpdateUserMutationVariables>(BackofficeUpdateUserDocument, options);
      }
export type BackofficeUpdateUserMutationHookResult = ReturnType<typeof useBackofficeUpdateUserMutation>;
export type BackofficeUpdateUserMutationResult = Apollo.MutationResult<BackofficeUpdateUserMutation>;
export type BackofficeUpdateUserMutationOptions = Apollo.BaseMutationOptions<BackofficeUpdateUserMutation, BackofficeUpdateUserMutationVariables>;
export const GetTrackersDocument = gql`
    query GetTrackers($offset: Int = 0, $limit: Int = 20) {
  trackers(offset: $offset, limit: $limit) {
    totalCount
    items {
      id
      serialNumber
      licensePlate
    }
  }
}
    `;

/**
 * __useGetTrackersQuery__
 *
 * To run a query within a React component, call `useGetTrackersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTrackersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTrackersQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetTrackersQuery(baseOptions?: Apollo.QueryHookOptions<GetTrackersQuery, GetTrackersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTrackersQuery, GetTrackersQueryVariables>(GetTrackersDocument, options);
      }
export function useGetTrackersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTrackersQuery, GetTrackersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTrackersQuery, GetTrackersQueryVariables>(GetTrackersDocument, options);
        }
// @ts-ignore
export function useGetTrackersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetTrackersQuery, GetTrackersQueryVariables>): Apollo.UseSuspenseQueryResult<GetTrackersQuery, GetTrackersQueryVariables>;
export function useGetTrackersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTrackersQuery, GetTrackersQueryVariables>): Apollo.UseSuspenseQueryResult<GetTrackersQuery | undefined, GetTrackersQueryVariables>;
export function useGetTrackersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTrackersQuery, GetTrackersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTrackersQuery, GetTrackersQueryVariables>(GetTrackersDocument, options);
        }
export type GetTrackersQueryHookResult = ReturnType<typeof useGetTrackersQuery>;
export type GetTrackersLazyQueryHookResult = ReturnType<typeof useGetTrackersLazyQuery>;
export type GetTrackersSuspenseQueryHookResult = ReturnType<typeof useGetTrackersSuspenseQuery>;
export type GetTrackersQueryResult = Apollo.QueryResult<GetTrackersQuery, GetTrackersQueryVariables>;
export const TrackerBySnDocument = gql`
    query TrackerBySN($serialNumber: String!) {
  trackerBySN(serialNumber: $serialNumber) {
    id
    serialNumber
    licensePlate
  }
}
    `;

/**
 * __useTrackerBySnQuery__
 *
 * To run a query within a React component, call `useTrackerBySnQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrackerBySnQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrackerBySnQuery({
 *   variables: {
 *      serialNumber: // value for 'serialNumber'
 *   },
 * });
 */
export function useTrackerBySnQuery(baseOptions: Apollo.QueryHookOptions<TrackerBySnQuery, TrackerBySnQueryVariables> & ({ variables: TrackerBySnQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TrackerBySnQuery, TrackerBySnQueryVariables>(TrackerBySnDocument, options);
      }
export function useTrackerBySnLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TrackerBySnQuery, TrackerBySnQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TrackerBySnQuery, TrackerBySnQueryVariables>(TrackerBySnDocument, options);
        }
// @ts-ignore
export function useTrackerBySnSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TrackerBySnQuery, TrackerBySnQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerBySnQuery, TrackerBySnQueryVariables>;
export function useTrackerBySnSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerBySnQuery, TrackerBySnQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerBySnQuery | undefined, TrackerBySnQueryVariables>;
export function useTrackerBySnSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerBySnQuery, TrackerBySnQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TrackerBySnQuery, TrackerBySnQueryVariables>(TrackerBySnDocument, options);
        }
export type TrackerBySnQueryHookResult = ReturnType<typeof useTrackerBySnQuery>;
export type TrackerBySnLazyQueryHookResult = ReturnType<typeof useTrackerBySnLazyQuery>;
export type TrackerBySnSuspenseQueryHookResult = ReturnType<typeof useTrackerBySnSuspenseQuery>;
export type TrackerBySnQueryResult = Apollo.QueryResult<TrackerBySnQuery, TrackerBySnQueryVariables>;
export const AddTrackerDocument = gql`
    mutation AddTracker($input: AddTrackerInput!) {
  addTracker(input: $input) {
    success
    message
  }
}
    `;
export type AddTrackerMutationFn = Apollo.MutationFunction<AddTrackerMutation, AddTrackerMutationVariables>;

/**
 * __useAddTrackerMutation__
 *
 * To run a mutation, you first call `useAddTrackerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddTrackerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addTrackerMutation, { data, loading, error }] = useAddTrackerMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddTrackerMutation(baseOptions?: Apollo.MutationHookOptions<AddTrackerMutation, AddTrackerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddTrackerMutation, AddTrackerMutationVariables>(AddTrackerDocument, options);
      }
export type AddTrackerMutationHookResult = ReturnType<typeof useAddTrackerMutation>;
export type AddTrackerMutationResult = Apollo.MutationResult<AddTrackerMutation>;
export type AddTrackerMutationOptions = Apollo.BaseMutationOptions<AddTrackerMutation, AddTrackerMutationVariables>;
export const DeleteTrackerDocument = gql`
    mutation DeleteTracker($id: ID!) {
  deleteTracker(id: $id) {
    success
    message
  }
}
    `;
export type DeleteTrackerMutationFn = Apollo.MutationFunction<DeleteTrackerMutation, DeleteTrackerMutationVariables>;

/**
 * __useDeleteTrackerMutation__
 *
 * To run a mutation, you first call `useDeleteTrackerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTrackerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTrackerMutation, { data, loading, error }] = useDeleteTrackerMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTrackerMutation(baseOptions?: Apollo.MutationHookOptions<DeleteTrackerMutation, DeleteTrackerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteTrackerMutation, DeleteTrackerMutationVariables>(DeleteTrackerDocument, options);
      }
export type DeleteTrackerMutationHookResult = ReturnType<typeof useDeleteTrackerMutation>;
export type DeleteTrackerMutationResult = Apollo.MutationResult<DeleteTrackerMutation>;
export type DeleteTrackerMutationOptions = Apollo.BaseMutationOptions<DeleteTrackerMutation, DeleteTrackerMutationVariables>;
export const UpdateTrackerDocument = gql`
    mutation UpdateTracker($id: ID!, $input: UpdateTrackerInput!) {
  updateTracker(id: $id, input: $input) {
    success
    message
  }
}
    `;
export type UpdateTrackerMutationFn = Apollo.MutationFunction<UpdateTrackerMutation, UpdateTrackerMutationVariables>;

/**
 * __useUpdateTrackerMutation__
 *
 * To run a mutation, you first call `useUpdateTrackerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTrackerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTrackerMutation, { data, loading, error }] = useUpdateTrackerMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateTrackerMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTrackerMutation, UpdateTrackerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateTrackerMutation, UpdateTrackerMutationVariables>(UpdateTrackerDocument, options);
      }
export type UpdateTrackerMutationHookResult = ReturnType<typeof useUpdateTrackerMutation>;
export type UpdateTrackerMutationResult = Apollo.MutationResult<UpdateTrackerMutation>;
export type UpdateTrackerMutationOptions = Apollo.BaseMutationOptions<UpdateTrackerMutation, UpdateTrackerMutationVariables>;
export const LoginUserDocument = gql`
    mutation LoginUser($email: String!, $password: String!) {
  loginUser(email: $email, password: $password) {
    token
  }
}
    `;
export type LoginUserMutationFn = Apollo.MutationFunction<LoginUserMutation, LoginUserMutationVariables>;

/**
 * __useLoginUserMutation__
 *
 * To run a mutation, you first call `useLoginUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginUserMutation, { data, loading, error }] = useLoginUserMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginUserMutation(baseOptions?: Apollo.MutationHookOptions<LoginUserMutation, LoginUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginUserMutation, LoginUserMutationVariables>(LoginUserDocument, options);
      }
export type LoginUserMutationHookResult = ReturnType<typeof useLoginUserMutation>;
export type LoginUserMutationResult = Apollo.MutationResult<LoginUserMutation>;
export type LoginUserMutationOptions = Apollo.BaseMutationOptions<LoginUserMutation, LoginUserMutationVariables>;
export const RegisterUserDocument = gql`
    mutation RegisterUser($input: RegisterUserInput!) {
  registerUser(input: $input) {
    success
    message
  }
}
    `;
export type RegisterUserMutationFn = Apollo.MutationFunction<RegisterUserMutation, RegisterUserMutationVariables>;

/**
 * __useRegisterUserMutation__
 *
 * To run a mutation, you first call `useRegisterUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerUserMutation, { data, loading, error }] = useRegisterUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterUserMutation(baseOptions?: Apollo.MutationHookOptions<RegisterUserMutation, RegisterUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterUserMutation, RegisterUserMutationVariables>(RegisterUserDocument, options);
      }
export type RegisterUserMutationHookResult = ReturnType<typeof useRegisterUserMutation>;
export type RegisterUserMutationResult = Apollo.MutationResult<RegisterUserMutation>;
export type RegisterUserMutationOptions = Apollo.BaseMutationOptions<RegisterUserMutation, RegisterUserMutationVariables>;
export const MeDocument = gql`
    query Me {
  me {
    id
    name
    surname
    email
    role
    companyId
    permissionKeys
    featureKeys
  }
}
    `;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
// @ts-ignore
export function useMeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery | undefined, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const UpdateUserDocument = gql`
    mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
    success
    message
  }
}
    `;
export type UpdateUserMutationFn = Apollo.MutationFunction<UpdateUserMutation, UpdateUserMutationVariables>;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, options);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;
export type UpdateUserMutationResult = Apollo.MutationResult<UpdateUserMutation>;
export type UpdateUserMutationOptions = Apollo.BaseMutationOptions<UpdateUserMutation, UpdateUserMutationVariables>;
export const DeleteUserDocument = gql`
    mutation DeleteUser {
  deleteUser {
    success
    message
  }
}
    `;
export type DeleteUserMutationFn = Apollo.MutationFunction<DeleteUserMutation, DeleteUserMutationVariables>;

/**
 * __useDeleteUserMutation__
 *
 * To run a mutation, you first call `useDeleteUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUserMutation, { data, loading, error }] = useDeleteUserMutation({
 *   variables: {
 *   },
 * });
 */
export function useDeleteUserMutation(baseOptions?: Apollo.MutationHookOptions<DeleteUserMutation, DeleteUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteUserMutation, DeleteUserMutationVariables>(DeleteUserDocument, options);
      }
export type DeleteUserMutationHookResult = ReturnType<typeof useDeleteUserMutation>;
export type DeleteUserMutationResult = Apollo.MutationResult<DeleteUserMutation>;
export type DeleteUserMutationOptions = Apollo.BaseMutationOptions<DeleteUserMutation, DeleteUserMutationVariables>;
export const GetPoIsDocument = gql`
    query GetPOIs($offset: Int = 0, $limit: Int = 20) {
  pois(offset: $offset, limit: $limit) {
    totalCount
    items {
      id
      title
      color
      latitude
      longitude
    }
  }
}
    `;

/**
 * __useGetPoIsQuery__
 *
 * To run a query within a React component, call `useGetPoIsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPoIsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPoIsQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetPoIsQuery(baseOptions?: Apollo.QueryHookOptions<GetPoIsQuery, GetPoIsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPoIsQuery, GetPoIsQueryVariables>(GetPoIsDocument, options);
      }
export function useGetPoIsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPoIsQuery, GetPoIsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPoIsQuery, GetPoIsQueryVariables>(GetPoIsDocument, options);
        }
// @ts-ignore
export function useGetPoIsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPoIsQuery, GetPoIsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPoIsQuery, GetPoIsQueryVariables>;
export function useGetPoIsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPoIsQuery, GetPoIsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPoIsQuery | undefined, GetPoIsQueryVariables>;
export function useGetPoIsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPoIsQuery, GetPoIsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPoIsQuery, GetPoIsQueryVariables>(GetPoIsDocument, options);
        }
export type GetPoIsQueryHookResult = ReturnType<typeof useGetPoIsQuery>;
export type GetPoIsLazyQueryHookResult = ReturnType<typeof useGetPoIsLazyQuery>;
export type GetPoIsSuspenseQueryHookResult = ReturnType<typeof useGetPoIsSuspenseQuery>;
export type GetPoIsQueryResult = Apollo.QueryResult<GetPoIsQuery, GetPoIsQueryVariables>;
export const AddPoiDocument = gql`
    mutation AddPOI($input: AddPOIInput!) {
  addPOI(input: $input) {
    success
    message
  }
}
    `;
export type AddPoiMutationFn = Apollo.MutationFunction<AddPoiMutation, AddPoiMutationVariables>;

/**
 * __useAddPoiMutation__
 *
 * To run a mutation, you first call `useAddPoiMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddPoiMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addPoiMutation, { data, loading, error }] = useAddPoiMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddPoiMutation(baseOptions?: Apollo.MutationHookOptions<AddPoiMutation, AddPoiMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddPoiMutation, AddPoiMutationVariables>(AddPoiDocument, options);
      }
export type AddPoiMutationHookResult = ReturnType<typeof useAddPoiMutation>;
export type AddPoiMutationResult = Apollo.MutationResult<AddPoiMutation>;
export type AddPoiMutationOptions = Apollo.BaseMutationOptions<AddPoiMutation, AddPoiMutationVariables>;
export const DeletePoiDocument = gql`
    mutation DeletePOI($id: ID!) {
  deletePOI(id: $id) {
    success
    message
  }
}
    `;
export type DeletePoiMutationFn = Apollo.MutationFunction<DeletePoiMutation, DeletePoiMutationVariables>;

/**
 * __useDeletePoiMutation__
 *
 * To run a mutation, you first call `useDeletePoiMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePoiMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePoiMutation, { data, loading, error }] = useDeletePoiMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePoiMutation(baseOptions?: Apollo.MutationHookOptions<DeletePoiMutation, DeletePoiMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeletePoiMutation, DeletePoiMutationVariables>(DeletePoiDocument, options);
      }
export type DeletePoiMutationHookResult = ReturnType<typeof useDeletePoiMutation>;
export type DeletePoiMutationResult = Apollo.MutationResult<DeletePoiMutation>;
export type DeletePoiMutationOptions = Apollo.BaseMutationOptions<DeletePoiMutation, DeletePoiMutationVariables>;
export const LastTracksDocument = gql`
    query LastTracks {
  lastTracks {
    serialNumber
    latitude
    longitude
    speed
    status
    date
    licensePlate
  }
}
    `;

/**
 * __useLastTracksQuery__
 *
 * To run a query within a React component, call `useLastTracksQuery` and pass it any options that fit your needs.
 * When your component renders, `useLastTracksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLastTracksQuery({
 *   variables: {
 *   },
 * });
 */
export function useLastTracksQuery(baseOptions?: Apollo.QueryHookOptions<LastTracksQuery, LastTracksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LastTracksQuery, LastTracksQueryVariables>(LastTracksDocument, options);
      }
export function useLastTracksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LastTracksQuery, LastTracksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LastTracksQuery, LastTracksQueryVariables>(LastTracksDocument, options);
        }
// @ts-ignore
export function useLastTracksSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<LastTracksQuery, LastTracksQueryVariables>): Apollo.UseSuspenseQueryResult<LastTracksQuery, LastTracksQueryVariables>;
export function useLastTracksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LastTracksQuery, LastTracksQueryVariables>): Apollo.UseSuspenseQueryResult<LastTracksQuery | undefined, LastTracksQueryVariables>;
export function useLastTracksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LastTracksQuery, LastTracksQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<LastTracksQuery, LastTracksQueryVariables>(LastTracksDocument, options);
        }
export type LastTracksQueryHookResult = ReturnType<typeof useLastTracksQuery>;
export type LastTracksLazyQueryHookResult = ReturnType<typeof useLastTracksLazyQuery>;
export type LastTracksSuspenseQueryHookResult = ReturnType<typeof useLastTracksSuspenseQuery>;
export type LastTracksQueryResult = Apollo.QueryResult<LastTracksQuery, LastTracksQueryVariables>;
export const TrackRangeDocument = gql`
    query TrackRange($trackerId: ID!, $start: DateTime!, $end: DateTime!) {
  trackRange(trackerId: $trackerId, start: $start, end: $end) {
    id
    serialNumber
    latitude
    longitude
    speed
    status
    date
  }
}
    `;

/**
 * __useTrackRangeQuery__
 *
 * To run a query within a React component, call `useTrackRangeQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrackRangeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrackRangeQuery({
 *   variables: {
 *      trackerId: // value for 'trackerId'
 *      start: // value for 'start'
 *      end: // value for 'end'
 *   },
 * });
 */
export function useTrackRangeQuery(baseOptions: Apollo.QueryHookOptions<TrackRangeQuery, TrackRangeQueryVariables> & ({ variables: TrackRangeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TrackRangeQuery, TrackRangeQueryVariables>(TrackRangeDocument, options);
      }
export function useTrackRangeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TrackRangeQuery, TrackRangeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TrackRangeQuery, TrackRangeQueryVariables>(TrackRangeDocument, options);
        }
// @ts-ignore
export function useTrackRangeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TrackRangeQuery, TrackRangeQueryVariables>): Apollo.UseSuspenseQueryResult<TrackRangeQuery, TrackRangeQueryVariables>;
export function useTrackRangeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackRangeQuery, TrackRangeQueryVariables>): Apollo.UseSuspenseQueryResult<TrackRangeQuery | undefined, TrackRangeQueryVariables>;
export function useTrackRangeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackRangeQuery, TrackRangeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TrackRangeQuery, TrackRangeQueryVariables>(TrackRangeDocument, options);
        }
export type TrackRangeQueryHookResult = ReturnType<typeof useTrackRangeQuery>;
export type TrackRangeLazyQueryHookResult = ReturnType<typeof useTrackRangeLazyQuery>;
export type TrackRangeSuspenseQueryHookResult = ReturnType<typeof useTrackRangeSuspenseQuery>;
export type TrackRangeQueryResult = Apollo.QueryResult<TrackRangeQuery, TrackRangeQueryVariables>;
export const LiveTracksUpdatedDocument = gql`
    subscription LiveTracksUpdated {
  liveTracksUpdated {
    serialNumber
    latitude
    longitude
    speed
    status
    date
    licensePlate
  }
}
    `;

/**
 * __useLiveTracksUpdatedSubscription__
 *
 * To run a query within a React component, call `useLiveTracksUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useLiveTracksUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLiveTracksUpdatedSubscription({
 *   variables: {
 *   },
 * });
 */
export function useLiveTracksUpdatedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<LiveTracksUpdatedSubscription, LiveTracksUpdatedSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<LiveTracksUpdatedSubscription, LiveTracksUpdatedSubscriptionVariables>(LiveTracksUpdatedDocument, options);
      }
export type LiveTracksUpdatedSubscriptionHookResult = ReturnType<typeof useLiveTracksUpdatedSubscription>;
export type LiveTracksUpdatedSubscriptionResult = Apollo.SubscriptionResult<LiveTracksUpdatedSubscription>;
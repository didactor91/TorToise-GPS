// @ts-check
const { GraphQLScalarType, Kind } = require('graphql')
const identityResolver = require('./identity.resolver')
const fleetResolver = require('./fleet.resolver')
const poiResolver = require('./poi.resolver')
const trackingResolver = require('./tracking.resolver')
const backofficeResolver = require('./backoffice.resolver')

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 date-time string scalar',
  parseValue: (value) => new Date(/** @type {string} */ (value)),
  serialize: (value) => new Date(/** @type {string|Date} */ (value)).toISOString(),
  parseLiteral: (ast) => ast.kind === Kind.STRING ? new Date(ast.value) : null
})

const resolvers = {
  DateTime: DateTimeScalar,

  Query: {
    ...identityResolver.Query,
    ...fleetResolver.Query,
    ...poiResolver.Query,
    ...trackingResolver.Query,
    ...backofficeResolver.Query
  },

  Mutation: {
    ...identityResolver.Mutation,
    ...fleetResolver.Mutation,
    ...poiResolver.Mutation,
    ...backofficeResolver.Mutation
  },

  Subscription: {
    ...trackingResolver.Subscription
  }
}

module.exports = resolvers

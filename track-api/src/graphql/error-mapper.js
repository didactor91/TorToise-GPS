// @ts-check
const { GraphQLError } = require('graphql')
const { errors: { LogicError, InputError, UnauthorizedError } } = require('track-utils')

/**
 * Converts a domain error to a GraphQLError with the appropriate extension code.
 * @param {Error} err
 * @returns {GraphQLError}
 */
function toGraphQLError(err) {
  if (err instanceof UnauthorizedError)
    return new GraphQLError(err.message, { extensions: { code: 'UNAUTHENTICATED' } })
  if (err instanceof InputError)
    return new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } })
  if (err instanceof LogicError)
    return new GraphQLError(err.message, { extensions: { code: 'LOGIC_ERROR' } })
  return new GraphQLError('Internal server error', { extensions: { code: 'INTERNAL_SERVER_ERROR' } })
}

module.exports = { toGraphQLError }

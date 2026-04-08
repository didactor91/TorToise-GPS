// @ts-check
const jwt = require('jsonwebtoken')

/**
 * Apollo context function — works for both HTTP requests and WebSocket connections.
 * @param {{ req?: import('express').Request, connectionParams?: Record<string,string> }} args
 * @returns {{ userId: string|null }}
 */
function buildContext({ req, connectionParams }) {
  const JWT_SECRET = process.env.JWT_SECRET
  let token = null
  if (req?.headers?.authorization) {
    token = req.headers.authorization.slice(7)
  } else if (connectionParams?.authorization) {
    token = connectionParams.authorization.slice(7)
  }
  if (!token) return { userId: null }
  try {
    const { sub } = /** @type {{ sub: string }} */ (jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }))
    return { userId: sub }
  } catch {
    return { userId: null }
  }
}

/**
 * Helper used in resolvers — throws UNAUTHENTICATED if not logged in.
 * @param {{ userId: string|null }} ctx
 * @returns {string}
 */
function requireAuth(ctx) {
  if (!ctx.userId) {
    const { GraphQLError } = require('graphql')
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
  }
  return ctx.userId
}

module.exports = { buildContext, requireAuth }

// @ts-check
/**
 * GraphQL behavioral tests.
 *
 * Tests auth context, UNAUTHENTICATED error mapping, and resolver auth enforcement.
 * Resolvers are called directly (no HTTP layer needed) against the in-memory MongoDB
 * provided by the shared test/setup.js.
 */
const { models: { User } } = require('track-data')
const argon2 = require('argon2')
const jwt = require('jsonwebtoken')
const { GraphQLError } = require('graphql')

const identityResolver = require('../resolvers/identity.resolver')
const { buildContext, requireAuth } = require('../context')

// JWT_SECRET is loaded from .env via test/setup.js (dotenv.config)
const JWT_SECRET = process.env.JWT_SECRET

describe('GraphQL behavioral tests', () => {
  let name, surname, email, password

  beforeEach(async () => {
    name = `name-${Math.random()}`
    surname = `surname-${Math.random()}`
    email = `email-${Math.random()}@mail.com`
    password = `password-${Math.random()}`
    await User.deleteMany()
  })

  // ─── buildContext ────────────────────────────────────────────────────────────

  describe('buildContext', () => {
    it('returns userId: null when no token provided', () => {
      const ctx = buildContext({ req: { headers: {} }, connectionParams: {} })
      expect(ctx.userId).toBeNull()
    })

    it('returns userId from a valid Bearer token in HTTP header', () => {
      const token = jwt.sign({ sub: 'user-123' }, JWT_SECRET, { algorithm: 'HS256' })
      const ctx = buildContext({
        req: { headers: { authorization: `Bearer ${token}` } }
      })
      expect(ctx.userId).toBe('user-123')
    })

    it('returns userId from a valid Bearer token in connectionParams (WebSocket)', () => {
      const token = jwt.sign({ sub: 'ws-user-456' }, JWT_SECRET, { algorithm: 'HS256' })
      const ctx = buildContext({
        connectionParams: { authorization: `Bearer ${token}` }
      })
      expect(ctx.userId).toBe('ws-user-456')
    })

    it('returns userId: null for an expired token', () => {
      const token = jwt.sign({ sub: 'user-expired' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: -1 })
      const ctx = buildContext({
        req: { headers: { authorization: `Bearer ${token}` } }
      })
      expect(ctx.userId).toBeNull()
    })

    it('returns userId: null for a tampered token', () => {
      const ctx = buildContext({
        req: { headers: { authorization: 'Bearer tampered.token.value' } }
      })
      expect(ctx.userId).toBeNull()
    })
  })

  // ─── requireAuth ─────────────────────────────────────────────────────────────

  describe('requireAuth', () => {
    it('returns userId when authenticated', () => {
      const result = requireAuth({ userId: 'valid-user-id' })
      expect(result).toBe('valid-user-id')
    })

    it('throws GraphQLError with UNAUTHENTICATED code when userId is null', () => {
      try {
        requireAuth({ userId: null })
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(GraphQLError)
        expect(err.extensions.code).toBe('UNAUTHENTICATED')
      }
    })

    it('throws GraphQLError with UNAUTHENTICATED code when context has no userId', () => {
      try {
        requireAuth({})
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(GraphQLError)
        expect(err.extensions.code).toBe('UNAUTHENTICATED')
      }
    })
  })

  // ─── loginUser mutation ───────────────────────────────────────────────────────

  describe('Mutation.loginUser', () => {
    let user

    beforeEach(async () => {
      const _password = await argon2.hash(password)
      user = await User.create({ name, surname, email, password: _password })
    })

    it('returns a token on valid credentials', async () => {
      const result = await identityResolver.Mutation.loginUser(
        null,
        { email, password },
        {}
      )
      expect(result).toHaveProperty('token')
      expect(typeof result.token).toBe('string')

      // Verify the token contains the user id
      const decoded = /** @type {{ sub: string }} */ (jwt.verify(result.token, JWT_SECRET))
      expect(decoded.sub).toBe(user.id)
    })

    it('throws on wrong password', async () => {
      await expect(
        identityResolver.Mutation.loginUser(null, { email, password: 'wrong' }, {})
      ).rejects.toBeInstanceOf(GraphQLError)
    })

    it('throws on non-existent email', async () => {
      await expect(
        identityResolver.Mutation.loginUser(null, { email: 'no@one.com', password }, {})
      ).rejects.toBeInstanceOf(GraphQLError)
    })
  })

  // ─── Query.me ────────────────────────────────────────────────────────────────

  describe('Query.me', () => {
    let user

    beforeEach(async () => {
      const _password = await argon2.hash(password)
      user = await User.create({ name, surname, email, password: _password })
    })

    it('returns the authenticated user profile when userId is valid', async () => {
      const ctx = { userId: user.id }
      const result = await identityResolver.Query.me(null, {}, ctx)

      expect(result).toBeDefined()
      expect(result.id).toBe(user.id)
      expect(result.name).toBe(name)
      expect(result.email).toBe(email)
    })

    it('throws UNAUTHENTICATED when no userId in context', async () => {
      try {
        await identityResolver.Query.me(null, {}, { userId: null })
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(GraphQLError)
        expect(err.extensions.code).toBe('UNAUTHENTICATED')
      }
    })
  })
})

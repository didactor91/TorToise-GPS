// @ts-check
const jwt = require('jsonwebtoken')
const service = require('../../identity/identity.service')
const { toGraphQLError } = require('../error-mapper')
const { requireAuth } = require('../context')

const identityResolver = {
  Query: {
    /**
     * @param {unknown} _
     * @param {unknown} __
     * @param {{ userId: string|null }} ctx
     */
    async me(_, __, ctx) {
      const userId = requireAuth(ctx)
      try {
        const user = await service.retrieveUser(userId)
        return { id: userId, ...user }
      } catch (err) {
        throw toGraphQLError(err)
      }
    }
  },

  Mutation: {
    /**
     * @param {unknown} _
     * @param {{ input: { name: string, surname: string, email: string, password: string } }} args
     */
    async registerUser(_, { input }) {
      try {
        await service.registerUser(input.name, input.surname, input.email, input.password)
        return { success: true, message: 'Ok, user registered.' }
      } catch (err) {
        throw toGraphQLError(err)
      }
    },

    /**
     * @param {unknown} _
     * @param {{ email: string, password: string }} args
     */
    async loginUser(_, { email, password }) {
      try {
        const sub = await service.authenticateUser(email, password)
        const token = jwt.sign({ sub }, process.env.JWT_SECRET, { expiresIn: '8h' })
        return { token }
      } catch (err) {
        throw toGraphQLError(err)
      }
    },

    /**
     * @param {unknown} _
     * @param {{ input: { name?: string, surname?: string, email?: string } }} args
     * @param {{ userId: string|null }} ctx
     */
    async updateUser(_, { input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.updateUser(userId, input)
        return { success: true, message: 'Ok, user updated.' }
      } catch (err) {
        throw toGraphQLError(err)
      }
    },

    /**
     * @param {unknown} _
     * @param {unknown} __
     * @param {{ userId: string|null }} ctx
     */
    async deleteUser(_, __, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.deleteUser(userId)
        return { success: true, message: 'Ok, user removed.' }
      } catch (err) {
        throw toGraphQLError(err)
      }
    }
  }
}

module.exports = identityResolver

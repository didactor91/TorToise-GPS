// @ts-check
const service = require('../../backoffice/backoffice.service')
const { toGraphQLError } = require('../error-mapper')
const { requireAuth } = require('../context')
const {
  effectiveFeatureKeysForCompany,
  effectivePermissionKeysForUser
} = require('../../shared/access-control')

/**
 * @param {{ _id: { toString: () => string }, name: string, slug: string, active: boolean }} company
 */
function mapCompany(company) {
  return {
    id: company._id.toString(),
    name: company.name,
    slug: company.slug,
    active: company.active,
    featureKeys: [...effectiveFeatureKeysForCompany(company)]
  }
}

/**
 * @param {{ _id: { toString: () => string }, name: string, surname: string, email: string, role: string, companyId?: { toString: () => string }|null }} user
 */
function mapUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    surname: user.surname,
    email: user.email,
    role: user.role,
    companyId: user.companyId ? user.companyId.toString() : null,
    permissionKeys: [...effectivePermissionKeysForUser(user)]
  }
}

const backofficeResolver = {
  Query: {
    /**
     * @param {unknown} _
     * @param {unknown} __
     * @param {{ userId: string|null }} ctx
     */
    async backofficeCompanies(_, __, ctx) {
      const userId = requireAuth(ctx)
      try {
        const companies = await service.listCompanies(userId)
        return (companies || []).map(mapCompany)
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ companyId?: string|null }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeUsers(_, { companyId }, ctx) {
      const userId = requireAuth(ctx)
      try {
        const users = await service.listUsers(userId, /** @type {any} */ (companyId))
        return (users || []).map(mapUser)
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    }
  },

  Mutation: {
    /**
     * @param {unknown} _
     * @param {{ input: { name: string, slug: string, active?: boolean } }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeCreateCompany(_, { input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.createCompany(userId, input)
        return { success: true, message: 'Ok, company created.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string, input: { name?: string, slug?: string, active?: boolean } }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeUpdateCompany(_, { id, input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.updateCompany(userId, id, input)
        return { success: true, message: 'Ok, company updated.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ input: { name: string, surname: string, email: string, password: string, role: string, companyId: string } }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeCreateUser(_, { input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.createUser(userId, input)
        return { success: true, message: 'Ok, user created.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string, input: { name?: string, surname?: string, email?: string, role?: string, companyId?: string } }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeUpdateUser(_, { id, input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.updateUser(userId, id, input)
        return { success: true, message: 'Ok, user updated.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    }
  }
}

module.exports = backofficeResolver

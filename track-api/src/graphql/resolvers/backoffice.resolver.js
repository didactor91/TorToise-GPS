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
 * @param {{ _id: { toString: () => string }, name: string, surname: string, email: string, language?: string, role: string, companyId?: { toString: () => string }|null }} user
 */
function mapUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    surname: user.surname,
    email: user.email,
    language: user.language || 'en',
    role: user.role,
    companyId: user.companyId ? user.companyId.toString() : null,
    permissionKeys: [...effectivePermissionKeysForUser(user)]
  }
}

/**
 * @param {{ _id: { toString: () => string }, serialNumber: string, alias?: string|null, emoji?: string|null }} tracker
 */
function mapTracker(tracker) {
  return {
    id: tracker._id.toString(),
    serialNumber: tracker.serialNumber,
    alias: tracker.alias || null,
    emoji: tracker.emoji || '🚚'
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
     * @param {{ id: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeCompany(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        const company = await service.retrieveCompany(userId, id)
        return mapCompany(company)
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ companyId?: string|null, offset?: number, limit?: number }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeUsers(_, { companyId, offset, limit }, ctx) {
      const userId = requireAuth(ctx)
      try {
        const result = await service.listUsers(
          userId,
          /** @type {any} */ (companyId),
          { offset, limit }
        )
        const totalCount = await service.countUsers(userId, /** @type {any} */ (companyId))
        const rows = /** @type {any[]} */ (Array.isArray(result) ? result : [])
        return {
          items: rows.map(mapUser),
          totalCount: Number(totalCount || 0)
        }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeUser(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        const user = await service.retrieveUser(userId, id)
        return mapUser(user)
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ companyId?: string|null, offset?: number, limit?: number }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeTrackers(_, { companyId, offset, limit }, ctx) {
      const userId = requireAuth(ctx)
      try {
        const [result, totalCount] = await Promise.all([
          service.listTrackers(userId, /** @type {any} */ (companyId), { offset, limit }),
          service.countTrackers(userId, /** @type {any} */ (companyId))
        ])
        const rows = /** @type {any[]} */ (Array.isArray(result) ? result : [])
        return {
          items: rows.map(mapTracker),
          totalCount: Number(totalCount || 0)
        }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeTracker(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        const tracker = await service.retrieveTracker(userId, id)
        return mapTracker(tracker)
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
     * @param {{ input: { name: string, surname: string, email: string, password: string, role: string, companyId: string, language?: string, permissionKeys?: string[] } }} args
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
     * @param {{ input: { serialNumber: string, alias?: string, emoji?: string, companyId: string } }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeCreateTracker(_, { input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.createTracker(userId, input)
        return { success: true, message: 'Ok, tracker created.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string, input: { name?: string, surname?: string, email?: string, language?: string, role?: string, companyId?: string, permissionKeys?: string[] } }} args
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
    },

    /**
     * @param {unknown} _
     * @param {{ id: string, alias: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeUpdateTrackerAlias(_, { id, alias }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.updateTrackerAlias(userId, id, alias)
        return { success: true, message: 'Ok, tracker alias updated.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string, input: { alias?: string, emoji?: string } }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeUpdateTracker(_, { id, input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.updateTracker(userId, id, input)
        return { success: true, message: 'Ok, tracker updated.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeDeleteCompany(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.deleteCompany(userId, id)
        return { success: true, message: 'Ok, company deleted.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeDeleteUser(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.deleteUser(userId, id)
        return { success: true, message: 'Ok, user deleted.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async backofficeDeleteTracker(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await service.deleteTracker(userId, id)
        return { success: true, message: 'Ok, tracker deleted.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    }
  }
}

module.exports = backofficeResolver

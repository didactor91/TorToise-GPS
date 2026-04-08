// @ts-check
const service = require('../../fleet/fleet.service')
const { toGraphQLError } = require('../error-mapper')
const { requireAuth } = require('../context')
const { requireAccess } = require('../../shared/authorization.service')

const fleetResolver = {
  Query: {
    /**
     * @param {unknown} _
     * @param {unknown} __
     * @param {{ userId: string|null }} ctx
     */
    async trackers(_, __, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'fleet', permission: 'fleet.read' })
        const trackers = await service.retrieveAllTrackers(userId)
        return (trackers || []).map(t => ({
          id: t._id.toString(),
          serialNumber: t.serialNumber,
          licensePlate: t.licensePlate || null
        }))
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async tracker(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'fleet', permission: 'fleet.read' })
        const t = await service.retrieveTracker(userId, id)
        return { id: t._id.toString(), serialNumber: t.serialNumber, licensePlate: t.licensePlate || null }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ serialNumber: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async trackerBySN(_, { serialNumber }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'fleet', permission: 'fleet.read' })
        const t = await service.retrieveTrackerBySN(userId, serialNumber)
        return { id: t._id.toString(), serialNumber: t.serialNumber, licensePlate: t.licensePlate || null }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ licensePlate: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async trackerByLP(_, { licensePlate }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'fleet', permission: 'fleet.read' })
        const t = await service.retrieveTrackerByLicense(userId, licensePlate)
        return { id: t._id.toString(), serialNumber: t.serialNumber, licensePlate: t.licensePlate || null }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    }
  },

  Mutation: {
    /**
     * @param {unknown} _
     * @param {{ input: { serialNumber: string, licensePlate?: string } }} args
     * @param {{ userId: string|null }} ctx
     */
    async addTracker(_, { input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'fleet', permission: 'fleet.create' })
        await service.addTracker(userId, input)
        return { success: true, message: 'Ok, tracker added.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string, input: { serialNumber?: string, licensePlate?: string } }} args
     * @param {{ userId: string|null }} ctx
     */
    async updateTracker(_, { id, input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'fleet', permission: 'fleet.update' })
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
    async deleteTracker(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'fleet', permission: 'fleet.delete' })
        await service.deleteTracker(userId, id)
        return { success: true, message: 'Ok, tracker deleted.' }
      } catch (err) {
        throw toGraphQLError(/** @type {Error} */ (err))
      }
    }
  }
}

module.exports = fleetResolver

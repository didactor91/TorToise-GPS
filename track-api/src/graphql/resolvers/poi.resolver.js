// @ts-check
const service = require('../../poi/poi.service')
const { toGraphQLError } = require('../error-mapper')
const { requireAuth } = require('../context')
const { requireAccess } = require('../../shared/authorization.service')

const poiResolver = {
  Query: {
    /**
     * @param {unknown} _
     * @param {{ offset?: number, limit?: number }} args
     * @param {{ userId: string|null }} ctx
     */
    async pois(_, { offset, limit }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'poi', permission: 'poi.read' })
        const [rows, totalCount] = await Promise.all([
          service.retrieveAllPOI(userId, { offset, limit }),
          service.countPOI(userId)
        ])
        return {
          items: rows.map(p => ({
            id: p._id.toString(),
            title: p.title,
            color: p.color,
            emoji: p.emoji || '📍',
            latitude: p.latitude,
            longitude: p.longitude
          })),
          totalCount: Number(totalCount || 0)
        }
      } catch (err) {
        throw toGraphQLError(err)
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async poi(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'poi', permission: 'poi.read' })
        const p = await service.retrieveOnePOI(userId, id)
        return { id: p._id.toString(), title: p.title, color: p.color, emoji: p.emoji || '📍', latitude: p.latitude, longitude: p.longitude }
      } catch (err) {
        throw toGraphQLError(err)
      }
    }
  },

  Mutation: {
    /**
     * @param {unknown} _
     * @param {{ input: { title: string, color: string, latitude: number, longitude: number } }} args
     * @param {{ userId: string|null }} ctx
     */
    async addPOI(_, { input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'poi', permission: 'poi.create' })
        await service.addPOI(userId, input)
        return { success: true, message: 'Ok, POI added.' }
      } catch (err) {
        throw toGraphQLError(err)
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string, input: { title?: string, color?: string, latitude?: number, longitude?: number } }} args
     * @param {{ userId: string|null }} ctx
     */
    async updatePOI(_, { id, input }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'poi', permission: 'poi.update' })
        await service.updatePOI(userId, id, input)
        return { success: true, message: 'Ok, POI updated.' }
      } catch (err) {
        throw toGraphQLError(err)
      }
    },

    /**
     * @param {unknown} _
     * @param {{ id: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async deletePOI(_, { id }, ctx) {
      const userId = requireAuth(ctx)
      try {
        await requireAccess(userId, { feature: 'poi', permission: 'poi.delete' })
        await service.deletePOI(userId, id)
        return { success: true, message: 'Ok, POI deleted.' }
      } catch (err) {
        throw toGraphQLError(err)
      }
    }
  }
}

module.exports = poiResolver

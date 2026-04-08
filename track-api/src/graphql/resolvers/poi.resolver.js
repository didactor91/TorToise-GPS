// @ts-check
const service = require('../../poi/poi.service')
const { toGraphQLError } = require('../error-mapper')
const { requireAuth } = require('../context')

const poiResolver = {
  Query: {
    /**
     * @param {unknown} _
     * @param {unknown} __
     * @param {{ userId: string|null }} ctx
     */
    async pois(_, __, ctx) {
      const userId = requireAuth(ctx)
      try {
        const pois = await service.retrieveAllPOI(userId)
        return (pois || []).map(p => ({
          id: p._id.toString(),
          title: p.title,
          color: p.color,
          latitude: p.latitude,
          longitude: p.longitude
        }))
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
        const p = await service.retrieveOnePOI(userId, id)
        return { id: p._id.toString(), title: p.title, color: p.color, latitude: p.latitude, longitude: p.longitude }
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
        await service.deletePOI(userId, id)
        return { success: true, message: 'Ok, POI deleted.' }
      } catch (err) {
        throw toGraphQLError(err)
      }
    }
  }
}

module.exports = poiResolver

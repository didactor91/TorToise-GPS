// @ts-check
const service = require('../../tracking/tracking.service')
const pubsub = require('../pubsub')
const { toGraphQLError } = require('../error-mapper')
const { requireAuth } = require('../context')

const trackingResolver = {
  Query: {
    /**
     * @param {unknown} _
     * @param {unknown} __
     * @param {{ userId: string|null }} ctx
     */
    async lastTracks(_, __, ctx) {
      const userId = requireAuth(ctx)
      try {
        const tracks = await service.retrieveAllLastTracks(userId)
        return (tracks || []).map(t => ({
          serialNumber: t.serialNumber,
          latitude: t.latitude,
          longitude: t.longitude,
          speed: t.speed,
          status: t.status,
          date: t.date,
          licensePlate: t.licensePlate || null
        }))
      } catch (err) {
        throw toGraphQLError(err)
      }
    },

    /**
     * @param {unknown} _
     * @param {{ trackerId: string }} args
     * @param {{ userId: string|null }} ctx
     */
    async lastTrack(_, { trackerId }, ctx) {
      const userId = requireAuth(ctx)
      try {
        const track = await service.retrieveLastTrack(userId, trackerId)
        if (!track) return null
        return {
          id: track._id ? track._id.toString() : undefined,
          serialNumber: track.serialNumber,
          latitude: track.latitude,
          longitude: track.longitude,
          speed: track.speed,
          status: track.status,
          date: track.date
        }
      } catch (err) {
        throw toGraphQLError(err)
      }
    },

    /**
     * @param {unknown} _
     * @param {{ trackerId: string, start: Date, end: Date }} args
     * @param {{ userId: string|null }} ctx
     */
    async trackRange(_, { trackerId, start, end }, ctx) {
      const userId = requireAuth(ctx)
      try {
        const tracks = await service.retrieveRangeOfTracks(
          userId,
          trackerId,
          new Date(start).toISOString(),
          new Date(end).toISOString()
        )
        return (tracks || []).map(t => ({
          id: t._id ? t._id.toString() : undefined,
          serialNumber: t.serialNumber,
          latitude: t.latitude,
          longitude: t.longitude,
          speed: t.speed,
          status: t.status,
          date: t.date
        }))
      } catch (err) {
        throw toGraphQLError(err)
      }
    }
  },

  Subscription: {
    liveTracksUpdated: {
      /**
       * @param {unknown} _
       * @param {unknown} __
       * @param {{ userId: string|null }} ctx
       */
      subscribe: (_, __, ctx) => {
        requireAuth(ctx) // throws UNAUTHENTICATED if no userId
        return pubsub.asyncIterator(['LIVE_TRACKS_UPDATED'])
      }
    }
  }
}

module.exports = trackingResolver

const { models: { Track } } = require('track-data')
const { models: { User } } = require('track-data')

module.exports = {
    async createTrack(data) {
        return Track.create(data)
    },

    async findLastBySerial(serialNumber) {
        return Track.findOne({ serialNumber }).sort({ date: -1 }).lean()
    },

    /**
     * For each serialNumber in the array, fetch the most recent track.
     * Uses a single aggregation instead of N separate queries.
     * Returns a Map<serialNumber, Track>.
     */
    async findLastBySerials(serialNumbers) {
        const docs = await Track.aggregate([
            { $match: { serialNumber: { $in: serialNumbers } } },
            { $sort: { serialNumber: 1, date: -1 } },
            { $group: { _id: '$serialNumber', doc: { $first: '$$ROOT' } } }
        ])
        const map = new Map()
        docs.forEach(({ _id, doc }) => map.set(_id, doc))
        return map
    },

    async findRangeBySerial(serialNumber, start, end) {
        return Track.find({ serialNumber, date: { $gte: start, $lte: end } }).lean()
    },

    async findOwnerBySerial(serialNumber) {
        return User.findOne({ 'trackers.serialNumber': serialNumber }).lean()
    },

    async deleteOlderThanBySerials(serialNumbers, cutoffDate) {
        const result = await Track.deleteMany({
            serialNumber: { $in: serialNumbers },
            date: { $lt: cutoffDate }
        })

        return result.deletedCount || 0
    }
}

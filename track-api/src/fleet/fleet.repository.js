const { models: { User, Tracker } } = require('track-data')
const { mongoose } = require('track-data')

module.exports = {
    async findUserById(id) {
        return User.findById(id)
    },

    async findTrackerBySerial(serialNumber) {
        return Tracker.findOne({ serialNumber })
    },

    async findTrackerByAlias(alias) {
        return Tracker.findOne({ alias })
    },

    async findTrackersByCompany(companyId, { offset = 0, limit } = {}) {
        const query = Tracker.find({ companyId }).sort({ createdAt: -1 }).skip(offset)
        if (typeof limit === 'number') query.limit(limit)
        return query.lean()
    },

    async countTrackersByCompany(companyId) {
        return Tracker.countDocuments({ companyId })
    },

    async findTrackerByIdAndCompany(trackerID, companyId) {
        if (!mongoose.Types.ObjectId.isValid(trackerID)) return null
        return Tracker.findOne({ _id: trackerID, companyId }).lean()
    },

    async findTrackerBySNAndCompany(serialNumber, companyId) {
        return Tracker.findOne({ serialNumber, companyId }).lean()
    },

    async findTrackerByAliasAndCompany(alias, companyId) {
        return Tracker.findOne({ alias, companyId }).lean()
    },

    async createTracker(data) {
        return Tracker.create(data)
    },

    async updateTrackerByIdAndCompany(trackerID, companyId, patch) {
        if (!mongoose.Types.ObjectId.isValid(trackerID)) return null
        return Tracker.findOneAndUpdate({ _id: trackerID, companyId }, { $set: patch }, { new: true })
    },

    async deleteTrackerByIdAndCompany(trackerID, companyId) {
        if (!mongoose.Types.ObjectId.isValid(trackerID)) return null
        return Tracker.findOneAndDelete({ _id: trackerID, companyId })
    },

    async syncLegacyTrackers(companyId, legacyTrackers = []) {
        for (const tracker of legacyTrackers) {
            if (!tracker?.serialNumber) continue
            const existing = await Tracker.findOne({ serialNumber: tracker.serialNumber })
            if (existing) continue
            await Tracker.create({
                companyId,
                serialNumber: tracker.serialNumber,
                alias: tracker.alias || `#MIG-${tracker.serialNumber}`
            })
        }
    },

    async saveUser(user) {
        return user.save()
    }
}

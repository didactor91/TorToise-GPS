const { models: { User, POI } } = require('track-data')
const { mongoose } = require('track-data')

module.exports = {
    async findUserById(id) {
        return User.findById(id)
    },

    async findAllByCompany(companyId, { offset = 0, limit } = {}) {
        const query = POI.find({ companyId }).sort({ createdAt: -1 }).skip(offset)
        if (typeof limit === 'number') query.limit(limit)
        return query.lean()
    },

    async countByCompany(companyId) {
        return POI.countDocuments({ companyId })
    },

    async createPOI(data) {
        return POI.create(data)
    },

    async findByIdAndCompany(poiID, companyId) {
        if (!mongoose.Types.ObjectId.isValid(poiID)) return null
        return POI.findOne({ _id: poiID, companyId }).lean()
    },

    async updateByIdAndCompany(poiID, companyId, patch) {
        if (!mongoose.Types.ObjectId.isValid(poiID)) return null
        return POI.findOneAndUpdate({ _id: poiID, companyId }, { $set: patch }, { new: true })
    },

    async deleteByIdAndCompany(poiID, companyId) {
        if (!mongoose.Types.ObjectId.isValid(poiID)) return null
        return POI.findOneAndDelete({ _id: poiID, companyId })
    },

    async syncLegacyPois(companyId, legacyPois = []) {
        for (const poi of legacyPois) {
            if (!poi?.latitude || !poi?.longitude) continue
            const existing = await POI.findOne({
                companyId,
                title: poi.title,
                latitude: poi.latitude,
                longitude: poi.longitude
            })
            if (existing) continue
            await POI.create({
                companyId,
                title: poi.title || 'Migrated POI',
                color: poi.color || '#89c800',
                latitude: poi.latitude,
                longitude: poi.longitude
            })
        }
    },

    async saveUser(user) {
        return user.save()
    }
}

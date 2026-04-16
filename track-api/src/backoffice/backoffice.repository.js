const { models: { Company, User, Tracker }, mongoose } = require('track-data')

module.exports = {
    async findUserById(id) {
        return User.findById(id)
    },

    async findUserByEmail(email) {
        return User.findOne({ email })
    },

    async findCompanyBySlug(slug) {
        return Company.findOne({ slug })
    },

    async findCompanyById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null
        return Company.findById(id)
    },

    async listCompanies() {
        return Company.find().sort({ createdAt: -1 }).lean()
    },

    async createCompany(data) {
        return Company.create(data)
    },

    async updateCompanyById(id, patch) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null
        return Company.findByIdAndUpdate(id, { $set: patch }, { new: true })
    },

    async listUsers(companyId, { offset = 0, limit } = {}) {
        const query = companyId ? { companyId } : {}
        const result = User.find(query).sort({ createdAt: -1 }).skip(offset)
        if (typeof limit === 'number') result.limit(limit)
        return result.lean()
    },

    async countUsers(companyId) {
        const query = companyId ? { companyId } : {}
        return User.countDocuments(query)
    },

    async createUser(data) {
        return User.create(data)
    },

    async updateUserById(id, patch) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null
        return User.findByIdAndUpdate(id, { $set: patch }, { new: true })
    },

    async findTrackerBySerial(serialNumber) {
        return Tracker.findOne({ serialNumber })
    },

    async findTrackerByAlias(alias) {
        return Tracker.findOne({ alias })
    },

    async createTracker(data) {
        return Tracker.create(data)
    },

    async findTrackerById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null
        return Tracker.findById(id)
    },

    async listTrackers(companyId, { offset = 0, limit } = {}) {
        const query = companyId ? { companyId } : {}
        const result = Tracker.find(query).sort({ createdAt: -1 }).skip(offset)
        if (typeof limit === 'number') result.limit(limit)
        return result.lean()
    },

    async countTrackers(companyId) {
        const query = companyId ? { companyId } : {}
        return Tracker.countDocuments(query)
    },

    async updateTrackerById(id, patch) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null
        return Tracker.findByIdAndUpdate(id, { $set: patch }, { new: true })
    }
}

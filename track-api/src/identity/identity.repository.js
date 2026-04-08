const { models: { User } } = require('track-data')

module.exports = {
    async findByEmail(email) {
        return User.findOne({ email })
    },

    async findById(id) {
        return User.findById(id)
    },

    async create(data) {
        return User.create(data)
    },

    async updateById(id, patch) {
        return User.findByIdAndUpdate(id, { $set: patch }, { new: true })
    },

    async deleteById(id) {
        return User.findByIdAndDelete(id)
    }
}

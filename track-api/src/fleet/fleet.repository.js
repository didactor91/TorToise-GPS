const { models: { User } } = require('track-data')

module.exports = {
    async findUserById(id) {
        return User.findById(id)
    },

    async findUserByTrackerSN(serialNumber) {
        return User.findOne({ 'trackers.serialNumber': serialNumber })
    },

    async findUserByLicensePlate(licensePlate) {
        return User.findOne({ 'trackers.licensePlate': licensePlate })
    },

    async saveUser(user) {
        return user.save()
    }
}

const { models: { User } } = require('track-data')

module.exports = {
    async findUserById(id) {
        return User.findById(id)
    },

    async saveUser(user) {
        return user.save()
    }
}

const mongoose = require('mongoose')
const schemas = require('./schemas')

const { user, track } = schemas


module.exports = {
    User:    mongoose.model('User', user),
    Track:   mongoose.model('Track', track),
    mongoose
}

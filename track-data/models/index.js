const mongoose = require('mongoose')
const schemas = require('./schemas')

const { user, track, company, companyTracker, poi } = schemas


module.exports = {
    User:    mongoose.model('User', user),
    Track:   mongoose.model('Track', track),
    Company: mongoose.model('Company', company),
    Tracker: mongoose.model('Tracker', companyTracker),
    POI: mongoose.model('POI', poi),
    mongoose
}

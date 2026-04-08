const { Schema } = require('mongoose')
const mongoose = require('mongoose')
const { isEmail } = require('validator')


const point = new Schema({
    title: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    color: { type: String, required: true }
})

const TrackSchema = new Schema({
    serialNumber: { type: String, required: true },
    latitude:     { type: Number, required: true },
    longitude:    { type: Number, required: true },
    speed:        { type: Number, required: true },
    status:       { type: String, default: 'ON' },
    date:         { type: Date, default: Date.now }
})
TrackSchema.index({ serialNumber: 1, date: -1 })

const tracker = new Schema({
    serialNumber: { type: String, required: true, index: true },
    licensePlate: { type: String }
})

const user = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: isEmail
    },
    password: { type: String, required: true },
    pois: [point],
    trackers: [tracker]
})


module.exports = { user, point, tracker, track: TrackSchema }

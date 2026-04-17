const { Schema } = require('mongoose')
const mongoose = require('mongoose')
const { isEmail } = require('validator')


const point = new Schema({
    title: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    color: { type: String, required: true },
    emoji: { type: String }
})

const TrackSchema = new Schema({
    serialNumber: { type: String, required: true },
    latitude:     { type: Number, required: true },
    longitude:    { type: Number, required: true },
    speed:        { type: Number, required: true },
    status:       { type: Number, enum: [0, 1], default: 1 },
    date:         { type: Date, default: Date.now }
})
TrackSchema.index({ serialNumber: 1, date: 1 })

const tracker = new Schema({
    serialNumber: { type: String, required: true, index: true },
    alias: { type: String },
    emoji: { type: String }
})

const company = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    active: { type: Boolean, default: true },
    featuresPacked: { type: String, default: '' },
    featuresVersion: { type: Number, default: 1 }
}, { timestamps: true })

const companyTracker = new Schema({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    serialNumber: { type: String, required: true, unique: true, index: true },
    alias: { type: String, required: true, index: true },
    emoji: { type: String }
}, { timestamps: true })

const poi = new Schema({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    title: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    color: { type: String, required: true },
    emoji: { type: String }
}, { timestamps: true })

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
    language: { type: String, enum: ['en', 'es', 'ca'], default: 'en' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    role: { type: String, enum: ['staff', 'owner', 'admin', 'dispatcher', 'viewer'], default: 'admin' },
    permissionsPacked: { type: String, default: '' },
    permissionsVersion: { type: Number, default: 1 },
    // Legacy embedded fields (kept for compatibility and gradual migration).
    pois: [point],
    trackers: [tracker]
})


module.exports = {
    user,
    point,
    tracker,
    company,
    companyTracker,
    poi,
    track: TrackSchema
}

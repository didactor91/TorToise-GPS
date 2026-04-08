const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const { models: { User } } = require('track-data')
const repo = require('./tracking.repository')
const { ensureUserCompany } = require('../shared/company-context')

const trackingService = {
    addTrack(userId, trackData) {
        if (!trackData) throw new InputError('incorrect track info')
        if (typeof trackData.speed === 'undefined') trackData.speed = 0
        if (typeof trackData.status === 'undefined') trackData.status = 'ON'

        let { serialNumber, latitude, longitude, speed, status, date } = trackData

        validate.arguments([
            { name: 'id', value: userId, type: String, notEmpty: true },
            { name: 'serialNumber', value: serialNumber, type: String, notEmpty: true },
            { name: 'latitude', value: latitude, type: Number, notEmpty: true },
            { name: 'longitude', value: longitude, type: Number, notEmpty: true },
            { name: 'speed', value: speed, type: Number, notEmpty: true, optional: true },
            { name: 'status', value: status, type: String, notEmpty: true, optional: true },
            { name: 'date', value: date, type: String, notEmpty: true, optional: true }
        ])
        validateTelemetry({ latitude, longitude, speed, status })

        return (async () => {
            const user = await User.findById(userId)
            if (!user) throw new LogicError(`user with id ${userId} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            const tracker = await repo.findTrackerBySerial(serialNumber)
            const legacyOwnsSerial = user.trackers.some(item => item.serialNumber === serialNumber)
            if ((!tracker || tracker.companyId.toString() !== companyId.toString()) && !legacyOwnsSerial) {
                throw new LogicError(`Tracker with SN ${serialNumber} doesn't exists`)
            }

            return repo.createTrack({ serialNumber, latitude, longitude, speed, status, date })
        })()
    },

    addTrackTCP(trackData) {
        if (!trackData) throw new InputError('incorrect track info')
        if (typeof trackData.speed === 'undefined') trackData.speed = 0
        if (typeof trackData.status === 'undefined') trackData.status = 'ON'

        let { serialNumber, latitude, longitude, speed, status, date } = trackData

        validate.arguments([
            { name: 'serialNumber', value: serialNumber, type: String, notEmpty: true },
            { name: 'latitude', value: latitude, type: Number, notEmpty: true },
            { name: 'longitude', value: longitude, type: Number, notEmpty: true },
            { name: 'speed', value: speed, type: Number, notEmpty: true, optional: true },
            { name: 'status', value: status, type: String, notEmpty: true, optional: true },
            { name: 'date', value: date, type: String, notEmpty: true, optional: true }
        ])
        validateTelemetry({ latitude, longitude, speed, status })

        return (async () => {
            let tracker = await repo.findTrackerBySerial(serialNumber)
            if (!tracker) {
                const owner = await repo.findLegacyOwnerBySerial(serialNumber)
                if (!owner) return null
                const legacy = owner.trackers.find(t => t.serialNumber === serialNumber)
                tracker = { serialNumber, licensePlate: legacy?.licensePlate || null }
            }

            const track = await repo.createTrack({ serialNumber, latitude, longitude, speed, status, date })

            const pubsub = require('../graphql/pubsub')
            pubsub.publish('LIVE_TRACKS_UPDATED', {
                liveTracksUpdated: [{
                    serialNumber,
                    latitude,
                    longitude,
                    speed,
                    status,
                    date: new Date().toISOString(),
                    licensePlate: tracker.licensePlate || null
                }]
            })

            return track
        })()
    },

    retrieveLastTrack(userId, trackerID) {
        validate.arguments([
            { name: 'id', value: userId, type: String, notEmpty: true },
            { name: 'trackerID', value: trackerID, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await User.findById(userId)
            if (!user) throw new LogicError(`user with id ${userId} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            let tracker = await repo.findTrackerByIdAndCompany(trackerID, companyId)
            if (!tracker) {
                const legacy = user.trackers.id(trackerID)
                if (legacy) tracker = { serialNumber: legacy.serialNumber }
            }
            if (!tracker) throw new LogicError(`Tracker with id ${trackerID} doesn't exists`)

            return repo.findLastBySerial(tracker.serialNumber)
        })()
    },

    retrieveAllLastTracks(userId) {
        validate.arguments([
            { name: 'id', value: userId, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await User.findById(userId).lean()
            if (!user) throw new LogicError(`user with id ${userId} doesn't exists`)
            const hydratedUser = await User.findById(userId)
            const companyId = await ensureUserCompany(hydratedUser)
            await repo.syncLegacyTrackers(companyId, hydratedUser.trackers || [])

            const companyTrackers = await repo.findTrackersByCompany(companyId)
            if (!companyTrackers.length) return []

            // Single aggregation query for all trackers — no N+1
            const serialNumbers = companyTrackers.map(t => t.serialNumber)
            const lastBySerial = await repo.findLastBySerials(serialNumbers)

            // Build a lookup map: serialNumber → licensePlate
            const lpMap = new Map(companyTrackers.map(t => [t.serialNumber, t.licensePlate]))

            return [...lastBySerial.entries()].map(([sn, track]) => ({
                ...track,
                licensePlate: lpMap.get(sn) || null
            }))
        })()
    },

    retrieveRangeOfTracks(userId, trackerID, start, end) {
        validate.arguments([
            { name: 'id', value: userId, type: String, notEmpty: true },
            { name: 'trackerID', value: trackerID, type: String, notEmpty: true },
            { name: 'startTime', value: start, type: String, notEmpty: true },
            { name: 'endTime', value: end, type: String, notEmpty: true }
        ])

        const startTime = new Date(start)
        const endTime = new Date(end)

        return (async () => {
            const user = await User.findById(userId)
            if (!user) throw new LogicError(`user with id ${userId} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            let tracker = await repo.findTrackerByIdAndCompany(trackerID, companyId)
            if (!tracker) {
                const legacy = user.trackers.id(trackerID)
                if (legacy) tracker = { serialNumber: legacy.serialNumber }
            }
            if (!tracker) throw new LogicError(`Tracker with id ${trackerID} doesn't exists`)

            const rangeTracks = await repo.findRangeBySerial(tracker.serialNumber, startTime, endTime)

            if (rangeTracks.length < 1) {
                throw new LogicError(`Tracker without tracks between ${startTime.toISOString()} and ${endTime.toISOString()}`)
            }

            return rangeTracks
        })()
    }
}

function validateTelemetry({ latitude, longitude, speed, status }) {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw new InputError('latitude out of range')
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new InputError('longitude out of range')
    }

    if (!Number.isFinite(speed) || speed < 0 || speed > 300) {
        throw new InputError('speed out of range')
    }

    if (!['ON', 'OFF'].includes(status)) {
        throw new InputError('invalid status')
    }
}

module.exports = trackingService

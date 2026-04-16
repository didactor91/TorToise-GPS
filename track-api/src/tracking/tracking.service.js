const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const { models: { User } } = require('track-data')
const repo = require('./tracking.repository')
const { ensureUserCompany } = require('../shared/company-context')

const trackingService = {
    async resolveUserCompanyId(userId) {
        validate.arguments([
            { name: 'id', value: userId, type: String, notEmpty: true }
        ])

        const user = await User.findById(userId)
        if (!user) throw new LogicError(`user with id ${userId} doesn't exists`)
        return ensureUserCompany(user)
    },

    addTrack(userId, trackData) {
        if (!trackData) throw new InputError('incorrect track info')
        if (typeof trackData.speed === 'undefined') trackData.speed = 0
        if (typeof trackData.status === 'undefined') trackData.status = 'ON'

        let { serialNumber, latitude, longitude, speed, status, date } = trackData
        status = normalizeIncomingStatus(status)
        ;({ latitude, longitude, speed } = compactTelemetry({ latitude, longitude, speed }))

        validate.arguments([
            { name: 'id', value: userId, type: String, notEmpty: true },
            { name: 'serialNumber', value: serialNumber, type: String, notEmpty: true },
            { name: 'latitude', value: latitude, type: Number, notEmpty: true },
            { name: 'longitude', value: longitude, type: Number, notEmpty: true },
            { name: 'speed', value: speed, type: Number, notEmpty: true, optional: true },
            { name: 'status', value: status, type: Number, notEmpty: true, optional: true },
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
        status = normalizeIncomingStatus(status)
        ;({ latitude, longitude, speed } = compactTelemetry({ latitude, longitude, speed }))

        validate.arguments([
            { name: 'serialNumber', value: serialNumber, type: String, notEmpty: true },
            { name: 'latitude', value: latitude, type: Number, notEmpty: true },
            { name: 'longitude', value: longitude, type: Number, notEmpty: true },
            { name: 'speed', value: speed, type: Number, notEmpty: true, optional: true },
            { name: 'status', value: status, type: Number, notEmpty: true, optional: true },
            { name: 'date', value: date, type: String, notEmpty: true, optional: true }
        ])
        validateTelemetry({ latitude, longitude, speed, status })

        return (async () => {
            let tracker = await repo.findTrackerBySerial(serialNumber)
            if (!tracker) {
                const owner = await repo.findLegacyOwnerBySerial(serialNumber)
                if (!owner) return null
                const ownerUser = await User.findById(owner._id)
                if (!ownerUser) return null
                const ownerCompanyId = await ensureUserCompany(ownerUser)
                await repo.syncLegacyTrackers(ownerCompanyId, ownerUser.trackers || [])
                tracker = await repo.findTrackerBySerial(serialNumber)
                if (!tracker) return null
            }

            const track = await repo.createTrack({ serialNumber, latitude, longitude, speed, status, date })

            const pubsub = require('../graphql/pubsub')
            const companyId = tracker.companyId ? tracker.companyId.toString() : null
            if (!companyId) return track
            pubsub.publish(`LIVE_TRACKS_UPDATED_${companyId}`, {
                liveTracksUpdated: [{
                    serialNumber,
                    latitude,
                    longitude,
                    speed,
                    status: denormalizeStoredStatus(status),
                    date: new Date().toISOString(),
                    alias: tracker.alias || null
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

            const lastTrack = await repo.findLastBySerial(tracker.serialNumber)
            return mapTrackStatusToApi(lastTrack)
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

            // Build a lookup map: serialNumber → alias
            const aliasMap = new Map(companyTrackers.map(t => [t.serialNumber, t.alias]))

            return [...lastBySerial.entries()].map(([sn, track]) => ({
                ...track,
                status: denormalizeStoredStatus(track.status),
                alias: aliasMap.get(sn) || null
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

            return rangeTracks.map(mapTrackStatusToApi)
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

    if (status !== 0 && status !== 1) {
        throw new InputError('invalid status')
    }
}

function roundTo(value, decimals) {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

function compactTelemetry({ latitude, longitude, speed }) {
    return {
        latitude: roundTo(latitude, 5),
        longitude: roundTo(longitude, 5),
        speed: roundTo(speed, 1)
    }
}

function normalizeIncomingStatus(status) {
    if (status === 1 || status === '1' || status === true) return 1
    if (status === 0 || status === '0' || status === false) return 0
    const normalized = String(status || '').trim().toUpperCase()
    if (normalized === 'ON') return 1
    if (normalized === 'OFF') return 0
    throw new InputError('invalid status')
}

function denormalizeStoredStatus(status) {
    return status === 0 || status === '0' ? 'OFF' : 'ON'
}

function mapTrackStatusToApi(track) {
    if (!track) return track
    return { ...track, status: denormalizeStoredStatus(track.status) }
}

module.exports = trackingService

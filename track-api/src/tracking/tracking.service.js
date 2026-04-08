const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const { models: { User } } = require('track-data')
const repo = require('./tracking.repository')

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

        return (async () => {
            const user = await User.findById(userId)
            if (!user) throw new LogicError(`user with id ${userId} doesn't exists`)

            const index = user.trackers.findIndex(item => item.serialNumber === serialNumber)
            if (index < 0) throw new LogicError(`Tracker with SN ${serialNumber} doesn't exists`)

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

        return (async () => {
            const owner = await repo.findOwnerBySerial(serialNumber)
            if (!owner) return null  // unknown SN — silent discard, no error

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
                    licensePlate: owner.trackers.find(t => t.serialNumber === serialNumber)?.licensePlate || null
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

            const tracker = user.trackers.id(trackerID)
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
            if (!user.trackers.length) return []

            // Single aggregation query for all trackers — no N+1
            const serialNumbers = user.trackers.map(t => t.serialNumber)
            const lastBySerial = await repo.findLastBySerials(serialNumbers)

            // Build a lookup map: serialNumber → licensePlate
            const lpMap = new Map(user.trackers.map(t => [t.serialNumber, t.licensePlate]))

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

            const tracker = user.trackers.id(trackerID)
            if (!tracker) throw new LogicError(`Tracker with id ${trackerID} doesn't exists`)

            const rangeTracks = await repo.findRangeBySerial(tracker.serialNumber, startTime, endTime)

            if (rangeTracks.length < 1) {
                throw new LogicError(`Tracker without tracks between ${startTime.toISOString()} and ${endTime.toISOString()}`)
            }

            return rangeTracks
        })()
    }
}

module.exports = trackingService

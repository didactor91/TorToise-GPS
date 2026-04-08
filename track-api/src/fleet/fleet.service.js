const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const repo = require('./fleet.repository')

const fleetService = {
    addTracker(id, trackerData) {
        if (!trackerData) throw new InputError('incorrect tracker info')

        let { serialNumber, licensePlate = '#IS-' + (Math.floor(Math.random() * (9999 - 1000)) + 1000).toString() + '-FAKE' } = trackerData

        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'serialNumber', value: serialNumber, type: String, notEmpty: true },
            { name: 'licensePlate', value: licensePlate, type: String, notEmpty: true, optional: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)

            let plate = 0
            if (licensePlate[0] !== '#') plate = await repo.findUserByLicensePlate(licensePlate)
            if (plate) throw new LogicError(`License Plate ${licensePlate} already registered`)

            const serial = await repo.findUserByTrackerSN(serialNumber)
            if (serial) throw new LogicError(`Serial Number ${serialNumber} already registered`)

            user.trackers.push({ serialNumber, licensePlate })
            await repo.saveUser(user)
        })()
    },

    retrieveAllTrackers(id) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            return user.trackers || []
        })()
    },

    retrieveTracker(id, trackerID) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'trackerID', value: trackerID, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)

            const tracker = user.trackers.id(trackerID)
            if (!tracker) throw new LogicError(`Tracker with id ${trackerID} doesn't exists`)
            return tracker
        })()
    },

    retrieveTrackerBySN(id, serialNumber) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'serialNumber', value: serialNumber, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)

            const index = user.trackers.findIndex(item => item.serialNumber === serialNumber)
            if (index === -1) throw new LogicError(`Tracker with SN ${serialNumber} doesn't exists`)
            return user.trackers[index]
        })()
    },

    retrieveTrackerByLicense(id, licensePlate) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'licensePlate', value: licensePlate, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)

            const index = user.trackers.findIndex(item => item.licensePlate === licensePlate)
            if (index === -1) throw new LogicError(`Tracker with License Plate ${licensePlate} doesn't exists`)
            return user.trackers[index]
        })()
    },

    updateTracker(id, trackerID, trackerData) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'trackerID', value: trackerID, type: String, notEmpty: true },
            { name: 'trackerData', value: trackerData, type: Object, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)

            const index = user.trackers.findIndex(item => item._id.toString() === trackerID)
            if (index < 0) throw new LogicError(`Tracker with id ${trackerID} doesn't exists`)

            if (trackerData.licensePlate && trackerData.licensePlate[0] !== '#') {
                const plate = await repo.findUserByLicensePlate(trackerData.licensePlate)
                if (plate) throw new LogicError(`License Plate ${trackerData.licensePlate} already registered`)
            }

            if (trackerData.serialNumber) {
                const serial = await repo.findUserByTrackerSN(trackerData.serialNumber)
                if (serial) throw new LogicError(`Serial Number ${trackerData.serialNumber} already registered`)
            }

            user.trackers[index].serialNumber = trackerData.serialNumber || user.trackers[index].serialNumber
            user.trackers[index].licensePlate = trackerData.licensePlate || user.trackers[index].licensePlate

            await repo.saveUser(user)
        })()
    },

    deleteTracker(id, trackerID) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'trackerID', value: trackerID, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)

            const index = user.trackers.findIndex(item => item._id.toString() === trackerID)
            if (index < 0) throw new LogicError(`Tracker with id ${trackerID} doesn't exists`)

            user.trackers.splice(index, 1)
            await repo.saveUser(user)
        })()
    }
}

module.exports = fleetService

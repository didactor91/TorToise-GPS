const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const repo = require('./fleet.repository')
const { ensureUserCompany } = require('../shared/company-context')

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
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            let plate = 0
            if (licensePlate[0] !== '#') plate = await repo.findTrackerByLicensePlate(licensePlate)
            if (plate) throw new LogicError(`License Plate ${licensePlate} already registered`)

            const serial = await repo.findTrackerBySerial(serialNumber)
            if (serial) throw new LogicError(`Serial Number ${serialNumber} already registered`)

            await repo.createTracker({ companyId, serialNumber, licensePlate })
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
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])
            return repo.findTrackersByCompany(companyId)
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
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            let tracker = await repo.findTrackerByIdAndCompany(trackerID, companyId)
            if (!tracker) {
                const legacy = user.trackers.id(trackerID)
                if (legacy) {
                    tracker = await repo.findTrackerBySNAndCompany(legacy.serialNumber, companyId)
                }
            }
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
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            const tracker = await repo.findTrackerBySNAndCompany(serialNumber, companyId)
            if (!tracker) throw new LogicError(`Tracker with SN ${serialNumber} doesn't exists`)
            return tracker
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
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            const tracker = await repo.findTrackerByLPAndCompany(licensePlate, companyId)
            if (!tracker) throw new LogicError(`Tracker with License Plate ${licensePlate} doesn't exists`)
            return tracker
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
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            let tracker = await repo.findTrackerByIdAndCompany(trackerID, companyId)
            if (!tracker) {
                const legacy = user.trackers.id(trackerID)
                if (legacy) {
                    tracker = await repo.findTrackerBySNAndCompany(legacy.serialNumber, companyId)
                }
            }
            if (!tracker) throw new LogicError(`Tracker with id ${trackerID} doesn't exists`)

            if (trackerData.licensePlate && trackerData.licensePlate[0] !== '#') {
                const plate = await repo.findTrackerByLicensePlate(trackerData.licensePlate)
                if (plate && plate._id.toString() !== trackerID) {
                    throw new LogicError(`License Plate ${trackerData.licensePlate} already registered`)
                }
            }

            if (trackerData.serialNumber) {
                const serial = await repo.findTrackerBySerial(trackerData.serialNumber)
                if (serial && serial._id.toString() !== trackerID) {
                    throw new LogicError(`Serial Number ${trackerData.serialNumber} already registered`)
                }
            }

            await repo.updateTrackerByIdAndCompany(tracker._id, companyId, {
                serialNumber: trackerData.serialNumber || tracker.serialNumber,
                licensePlate: trackerData.licensePlate || tracker.licensePlate
            })

            const legacy = user.trackers.id(trackerID) || user.trackers.find(item => item.serialNumber === tracker.serialNumber)
            if (legacy) {
                legacy.serialNumber = trackerData.serialNumber || legacy.serialNumber
                legacy.licensePlate = trackerData.licensePlate || legacy.licensePlate
                await repo.saveUser(user)
            }
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
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            let tracker = await repo.findTrackerByIdAndCompany(trackerID, companyId)
            if (!tracker) {
                const legacy = user.trackers.id(trackerID)
                if (legacy) {
                    tracker = await repo.findTrackerBySNAndCompany(legacy.serialNumber, companyId)
                }
            }
            if (!tracker) throw new LogicError(`Tracker with id ${trackerID} doesn't exists`)

            await repo.deleteTrackerByIdAndCompany(tracker._id, companyId)
            const legacyIndex = user.trackers.findIndex(item =>
                item._id.toString() === trackerID || item.serialNumber === tracker.serialNumber
            )
            if (legacyIndex >= 0) {
                user.trackers.splice(legacyIndex, 1)
                await repo.saveUser(user)
            }
        })()
    }
}

module.exports = fleetService

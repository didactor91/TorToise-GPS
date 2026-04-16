const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const repo = require('./fleet.repository')
const { ensureUserCompany } = require('../shared/company-context')

const fleetService = {
    normalizePagination(offset = 0, limit = 20) {
        const _offset = Math.max(0, Number(offset || 0))
        const _limit = Math.max(1, Math.min(200, Number(limit || 20)))
        return { offset: _offset, limit: _limit }
    },

    addTracker(id, trackerData) {
        if (!trackerData) throw new InputError('incorrect tracker info')

        let { serialNumber, alias } = trackerData
        if (!alias || (typeof alias === 'string' && !alias.trim())) {
            alias = '#IS-' + (Math.floor(Math.random() * (9999 - 1000)) + 1000).toString() + '-FAKE'
        }

        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'serialNumber', value: serialNumber, type: String, notEmpty: true },
            { name: 'alias', value: alias, type: String, notEmpty: true, optional: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            let plate = 0
            if (alias[0] !== '#') plate = await repo.findTrackerByAlias(alias)
            if (plate) throw new LogicError(`Alias ${alias} already registered`)

            const serial = await repo.findTrackerBySerial(serialNumber)
            if (serial) throw new LogicError(`Serial Number ${serialNumber} already registered`)

            await repo.createTracker({ companyId, serialNumber, alias })
            user.trackers.push({ serialNumber, alias })
            await repo.saveUser(user)
        })()
    },

    retrieveAllTrackers(id, pagination) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])
            if (!pagination) return repo.findTrackersByCompany(companyId)
            const _pagination = this.normalizePagination(pagination.offset, pagination.limit)
            return repo.findTrackersByCompany(companyId, _pagination)
        })()
    },

    countTrackers(id) {
        validate.arguments([{ name: 'id', value: id, type: String, notEmpty: true }])
        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            return repo.countTrackersByCompany(companyId)
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

    retrieveTrackerByAlias(id, alias) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'alias', value: alias, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyTrackers(companyId, user.trackers || [])

            const tracker = await repo.findTrackerByAliasAndCompany(alias, companyId)
            if (!tracker) throw new LogicError(`Tracker with alias ${alias} doesn't exists`)
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

            if (trackerData.alias && trackerData.alias[0] !== '#') {
                const plate = await repo.findTrackerByAlias(trackerData.alias)
                if (plate && plate._id.toString() !== trackerID) {
                    throw new LogicError(`Alias ${trackerData.alias} already registered`)
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
                alias: trackerData.alias || tracker.alias
            })

            const legacy = user.trackers.id(trackerID) || user.trackers.find(item => item.serialNumber === tracker.serialNumber)
            if (legacy) {
                legacy.serialNumber = trackerData.serialNumber || legacy.serialNumber
                legacy.alias = trackerData.alias || legacy.alias
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

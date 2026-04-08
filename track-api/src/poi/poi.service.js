const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const repo = require('./poi.repository')
const { ensureUserCompany } = require('../shared/company-context')

const poiService = {
    addPOI(id, poiData) {
        if (!poiData) throw new InputError('incorrect poi info')

        let { title, color, latitude, longitude } = poiData

        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'title', value: title, type: String, notEmpty: true, optional: true },
            { name: 'color', value: color, type: String, notEmpty: true, optional: true },
            { name: 'latitude', value: latitude, type: Number, notEmpty: true },
            { name: 'longitude', value: longitude, type: Number, notEmpty: true }
        ])

        title ? title = title : title = 'Kripton-' + ((Math.random() * 1000).toFixed(0)).toString()
        color ? color = color : color = '#89c800'

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyPois(companyId, user.pois || [])

            await repo.createPOI({ companyId, title, color, latitude, longitude })
            user.pois.push({ title, color, latitude, longitude })
            await repo.saveUser(user)
        })()
    },

    retrieveAllPOI(id) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyPois(companyId, user.pois || [])
            return repo.findAllByCompany(companyId)
        })()
    },

    retrieveOnePOI(id, poiID) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'poiID', value: poiID, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyPois(companyId, user.pois || [])

            let poi = await repo.findByIdAndCompany(poiID, companyId)
            if (!poi) {
                const legacy = user.pois.id(poiID)
                if (!legacy) throw new LogicError(`POI with id ${poiID} doesn't exists`)
                poi = legacy.toObject()
            }
            if (!poi) throw new LogicError(`POI with id ${poiID} doesn't exists`)
            return poi
        })()
    },

    updatePOI(id, poiID, poiData) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'poiID', value: poiID, type: String, notEmpty: true },
            { name: 'poiData', value: poiData, type: Object, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyPois(companyId, user.pois || [])

            let poi = await repo.findByIdAndCompany(poiID, companyId)
            const legacyPoi = user.pois.id(poiID)
            if (!poi && !legacyPoi) throw new LogicError(`POI with id ${poiID} doesn't exists`)
            if (!poi && legacyPoi) {
                const all = await repo.findAllByCompany(companyId)
                poi = all.find(item =>
                    item.title === legacyPoi.title &&
                    item.latitude === legacyPoi.latitude &&
                    item.longitude === legacyPoi.longitude
                )
            }
            if (!poi) throw new LogicError(`POI with id ${poiID} doesn't exists`)

            await repo.updateByIdAndCompany(poi._id || poiID, companyId, {
                title: poiData.title || poi.title,
                color: poiData.color || poi.color,
                latitude: poiData.latitude || poi.latitude,
                longitude: poiData.longitude || poi.longitude
            })
            if (legacyPoi) {
                legacyPoi.title = poiData.title || legacyPoi.title
                legacyPoi.color = poiData.color || legacyPoi.color
                legacyPoi.latitude = poiData.latitude || legacyPoi.latitude
                legacyPoi.longitude = poiData.longitude || legacyPoi.longitude
                await repo.saveUser(user)
            }
        })()
    },

    deletePOI(id, poiID) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'poiID', value: poiID, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyPois(companyId, user.pois || [])

            let poi = await repo.findByIdAndCompany(poiID, companyId)
            const legacyIndex = user.pois.findIndex(item => item._id.toString() === poiID)
            if (!poi && legacyIndex < 0) throw new LogicError(`POI with id ${poiID} doesn't exists`)

            if (poi) {
                await repo.deleteByIdAndCompany(poiID, companyId)
            }
            if (legacyIndex >= 0) {
                const legacyPoi = user.pois[legacyIndex]
                if (!poi) {
                    const all = await repo.findAllByCompany(companyId)
                    poi = all.find(item =>
                        item.title === legacyPoi.title &&
                        item.latitude === legacyPoi.latitude &&
                        item.longitude === legacyPoi.longitude
                    )
                    if (poi) await repo.deleteByIdAndCompany(poi._id, companyId)
                }
                user.pois.splice(legacyIndex, 1)
                await repo.saveUser(user)
            }
        })()
    }
}

module.exports = poiService

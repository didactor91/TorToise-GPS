const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const repo = require('./poi.repository')
const { ensureUserCompany } = require('../shared/company-context')
const { normalizePoiEmoji } = require('../shared/emoji-catalog')

const poiService = {
    normalizePagination(offset = 0, limit = 20) {
        const _offset = Math.max(0, Number(offset || 0))
        const _limit = Math.max(1, Math.min(200, Number(limit || 20)))
        return { offset: _offset, limit: _limit }
    },

    addPOI(id, poiData) {
        if (!poiData) throw new InputError('incorrect poi info')

        let { title, color, emoji, latitude, longitude } = poiData

        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true },
            { name: 'title', value: title, type: String, notEmpty: true, optional: true },
            { name: 'color', value: color, type: String, notEmpty: true, optional: true },
            { name: 'emoji', value: emoji, type: String, notEmpty: true, optional: true },
            { name: 'latitude', value: latitude, type: Number, notEmpty: true },
            { name: 'longitude', value: longitude, type: Number, notEmpty: true }
        ])

        title ? title = title : title = 'Kripton-' + ((Math.random() * 1000).toFixed(0)).toString()
        color ? color = color : color = '#89c800'
        emoji = normalizePoiEmoji(emoji)

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyPois(companyId, user.pois || [])

            await repo.createPOI({ companyId, title, color, emoji, latitude, longitude })
            user.pois.push({ title, color, emoji, latitude, longitude })
            await repo.saveUser(user)
        })()
    },

    retrieveAllPOI(id, pagination) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            await repo.syncLegacyPois(companyId, user.pois || [])
            if (!pagination) return repo.findAllByCompany(companyId)
            const _pagination = this.normalizePagination(pagination.offset, pagination.limit)
            return repo.findAllByCompany(companyId, _pagination)
        })()
    },

    countPOI(id) {
        validate.arguments([{ name: 'id', value: id, type: String, notEmpty: true }])
        return (async () => {
            const user = await repo.findUserById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            const companyId = await ensureUserCompany(user)
            return repo.countByCompany(companyId)
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
                emoji: normalizePoiEmoji(poiData.emoji || poi.emoji || '📍'),
                latitude: poiData.latitude || poi.latitude,
                longitude: poiData.longitude || poi.longitude
            })
            if (legacyPoi) {
                legacyPoi.title = poiData.title || legacyPoi.title
                legacyPoi.color = poiData.color || legacyPoi.color
                legacyPoi.emoji = normalizePoiEmoji(poiData.emoji || legacyPoi.emoji || '📍')
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

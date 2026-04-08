const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const repo = require('./poi.repository')

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
            return user.pois || []
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

            const poi = user.pois.id(poiID)
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

            const index = user.pois.findIndex(item => item._id.toString() === poiID)
            if (index < 0) throw new LogicError(`POI with id ${poiID} doesn't exists`)

            user.pois[index].title = poiData.title || user.pois[index].title
            user.pois[index].color = poiData.color || user.pois[index].color
            user.pois[index].latitude = poiData.latitude || user.pois[index].latitude
            user.pois[index].longitude = poiData.longitude || user.pois[index].longitude

            await repo.saveUser(user)
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

            const index = user.pois.findIndex(item => item._id.toString() === poiID)
            if (index < 0) throw new LogicError(`POI with id ${poiID} doesn't exists`)

            user.pois.splice(index, 1)
            await repo.saveUser(user)
        })()
    }
}

module.exports = poiService

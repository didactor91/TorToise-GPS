const express = require('express')
const auth = require('../shared/auth.middleware')
const service = require('./poi.service')

const router = express.Router()

router.post('/pois/add', auth, async (req, res) => {
    const { userId, body: { title, color, latitude, longitude } } = req

    await service.addPOI(userId, { title, color, latitude, longitude })
    res.status(201).json({ message: 'Ok, POI added.' })
})

router.get('/pois', auth, async (req, res) => {
    const { userId } = req

    const pois = await service.retrieveAllPOI(userId)
    return res.json(pois)
})

router.get('/pois/:id', auth, async (req, res) => {
    const { userId, params: { id } } = req

    const poi = await service.retrieveOnePOI(userId, id)
    return res.json(poi)
})

router.put('/pois/:id/update', auth, async (req, res) => {
    const { userId, params: { id }, body: { title, color, latitude, longitude } } = req

    await service.updatePOI(userId, id, { title, color, latitude, longitude })
    res.status(201).json({ message: 'Ok, POI updated.' })
})

router.delete('/pois/:id/delete', auth, async (req, res) => {
    const { userId, params: { id } } = req

    await service.deletePOI(userId, id)
    res.status(201).json({ message: 'Ok, POI removed.' })
})

module.exports = router

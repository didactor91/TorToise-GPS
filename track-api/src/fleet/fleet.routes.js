const express = require('express')
const auth = require('../shared/auth.middleware')
const service = require('./fleet.service')

const router = express.Router()

router.post('/trackers/add', auth, async (req, res) => {
    const { userId, body: { serialNumber, alias } } = req

    await service.addTracker(userId, { serialNumber, alias })
    res.status(201).json({ message: 'Ok, Tracker added.' })
})

router.get('/trackers', auth, async (req, res) => {
    const { userId } = req

    const trackers = await service.retrieveAllTrackers(userId)
    return res.json(trackers)
})

router.get('/trackers/id/:id', auth, async (req, res) => {
    const { userId, params: { id } } = req

    const tracker = await service.retrieveTracker(userId, id)
    return res.json(tracker)
})

router.get('/trackers/sn/:sn', auth, async (req, res) => {
    const { userId, params: { sn } } = req

    const tracker = await service.retrieveTrackerBySN(userId, sn)
    return res.json(tracker)
})

router.get('/trackers/alias/:alias', auth, async (req, res) => {
    const { userId, params: { alias } } = req

    const tracker = await service.retrieveTrackerByAlias(userId, alias)
    return res.json(tracker)
})

router.put('/trackers/:id/update', auth, async (req, res) => {
    const { userId, params: { id }, body: { serialNumber, alias } } = req

    await service.updateTracker(userId, id, { serialNumber, alias })
    res.status(201).json({ message: 'Ok, Tracker updated.' })
})

router.delete('/trackers/:id/delete', auth, async (req, res) => {
    const { userId, params: { id } } = req

    await service.deleteTracker(userId, id)
    res.status(201).json({ message: 'Ok, Tracker removed.' })
})

module.exports = router

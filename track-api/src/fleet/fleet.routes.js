const express = require('express')
const auth = require('../shared/auth.middleware')
const service = require('./fleet.service')

const router = express.Router()

router.post('/trackers/add', auth, async (req, res) => {
    const { userId, body: { serialNumber, licensePlate } } = req

    await service.addTracker(userId, { serialNumber, licensePlate })
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

router.get('/trackers/lp/:lp', auth, async (req, res) => {
    const { userId, params: { lp } } = req

    const tracker = await service.retrieveTrackerByLicense(userId, lp)
    return res.json(tracker)
})

router.put('/trackers/:id/update', auth, async (req, res) => {
    const { userId, params: { id }, body: { serialNumber, licensePlate } } = req

    await service.updateTracker(userId, id, { serialNumber, licensePlate })
    res.status(201).json({ message: 'Ok, Tracker updated.' })
})

router.delete('/trackers/:id/delete', auth, async (req, res) => {
    const { userId, params: { id } } = req

    await service.deleteTracker(userId, id)
    res.status(201).json({ message: 'Ok, Tracker removed.' })
})

module.exports = router

const express = require('express')
const auth = require('../shared/auth.middleware')
const { createRateLimiter } = require('../shared/rate-limit.middleware')
const service = require('./tracking.service')

const router = express.Router()
const tcpIngestRateLimit = createRateLimiter({ windowMs: 60 * 1000, max: 1800 })

router.post('/tracks/add', auth, async (req, res) => {
    const { userId, body: { serialNumber, latitude, longitude, speed, status } } = req

    await service.addTrack(userId, { serialNumber, latitude, longitude, speed, status })
    res.status(201).json({ message: 'Ok, Track added.' })
})

// IMPORTANT: This route is intentionally unauthenticated — TCP hardware trackers
// do not carry JWT tokens. Unknown serial numbers are silently discarded (200 OK).
router.post('/tracks/TCP/add', tcpIngestRateLimit, async (req, res) => {
    const { body: { serialNumber, latitude, longitude, speed, status } } = req
    const result = await service.addTrackTCP({ serialNumber, latitude, longitude, speed, status })
    // null = unknown SN, silently discarded. 200 either way — hardware doesn't retry on 2xx.
    if (!result) return res.status(200).json({ message: 'Ok.' })
    res.status(201).json({ message: 'Ok, Track added.' })
})

router.get('/tracks', auth, async (req, res) => {
    const { userId } = req

    const tracks = await service.retrieveAllLastTracks(userId)
    return res.json(tracks)
})

router.get('/tracks/:id', auth, async (req, res) => {
    const { userId, params: { id } } = req

    const track = await service.retrieveLastTrack(userId, id)
    return res.json(track)
})

router.get('/tracks/:id/from/:start/to/:end', auth, async (req, res) => {
    const { userId, params: { id, start, end } } = req

    const range = await service.retrieveRangeOfTracks(userId, id, start, end)
    return res.json(range)
})

module.exports = router

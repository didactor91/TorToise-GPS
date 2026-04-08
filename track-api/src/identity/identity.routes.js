const express = require('express')
const jwt = require('jsonwebtoken')
const auth = require('../shared/auth.middleware')
const { createRateLimiter } = require('../shared/rate-limit.middleware')
const service = require('./identity.service')

const { env: { JWT_SECRET } } = process

const router = express.Router()
const loginRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 })

router.post('/users', async (req, res) => {
    const { body: { name, surname, email, password } } = req

    await service.registerUser(name, surname, email, password)
    res.status(201).json({ message: 'Ok, user registered.' })
})

router.post('/users/auth', loginRateLimit, async (req, res) => {
    const { body: { email, password } } = req

    const sub = await service.authenticateUser(email, password)
    const token = jwt.sign({ sub }, JWT_SECRET, { expiresIn: '8h' })

    res.json({ token })
})

router.get('/users', auth, async (req, res) => {
    const { userId } = req

    const user = await service.retrieveUser(userId)
    return res.json(user)
})

router.put('/users/update', auth, async (req, res) => {
    const { userId, body: { name, surname, email } } = req

    await service.updateUser(userId, { name, surname, email })
    res.status(201).json({ message: 'Ok, user updated.' })
})

router.delete('/users/delete', auth, async (req, res) => {
    const { userId } = req

    await service.deleteUser(userId)
    res.status(201).json({ message: 'Ok, user removed.' })
})

module.exports = router

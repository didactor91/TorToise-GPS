const { models: { User, Track } } = require('track-data')
const { errors: { LogicError, RequirementError, InputError } } = require('track-utils')
const argon2 = require('argon2')
const trackingService = require('./tracking.service')

describe('trackingService', () => {
    let name, surname, email, password

    beforeEach(async () => {
        name = `name-${Math.random()}`
        surname = `surname-${Math.random()}`
        email = `email-${Math.random()}@mail.com`
        password = `password-${Math.random()}`

        await User.deleteMany()
        await Track.deleteMany()
    })

    describe('addTrack', () => {
        let user
        let _password
        let lat, lon
        let trackerData, trackerData2

        beforeEach(async () => {
            lat = Math.random() * 100
            lon = Math.random() * 10
            _password = await argon2.hash(password)
            trackerData2 = { serialNumber: '1234567890', licensePlate: '1234-ABC' }
            trackerData = { serialNumber: '1234567123', licensePlate: '1244-ABC' }
            user = await User.create({ name, surname, email, password: _password, trackers: [trackerData, trackerData2] })
        })

        it('should succeed on correct track data', async () => {
            const trackData = {
                serialNumber: '1234567890',
                latitude: lat,
                longitude: lon,
                speed: 123.21,
                status: 'OFF',
                date: new Date().toISOString()
            }
            await trackingService.addTrack(user.id, trackData)
            const saved = await Track.findOne({ serialNumber: '1234567890' })
            expect(saved).toBeDefined()
            expect(saved.speed).toBe(123.21)
            expect(saved.status).toBe('OFF')
        })

        it('should succeed on correct track partial data (defaults speed=0, status=ON)', async () => {
            const trackData = {
                serialNumber: '1234567890',
                latitude: lat,
                longitude: lon,
                date: new Date().toISOString()
            }
            await trackingService.addTrack(user.id, trackData)
            const saved = await Track.findOne({ serialNumber: '1234567890' })
            expect(saved).toBeDefined()
            expect(saved.speed).toBe(0)
            expect(saved.status).toBe('ON')
        })

        it('should fail on incorrect id user', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            const trackData = { serialNumber: '1234567890', latitude: lat, longitude: lon, speed: 1, status: 'ON', date: new Date().toISOString() }
            try {
                await trackingService.addTrack(wrongId, trackData)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on undefined id user', async () => {
            const trackData = { serialNumber: '1234567890', latitude: lat, longitude: lon, speed: 1, status: 'ON', date: new Date().toISOString() }
            try {
                await trackingService.addTrack(undefined, trackData)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on null id user', async () => {
            const trackData = { serialNumber: '1234567890', latitude: lat, longitude: lon, speed: 1, status: 'ON', date: new Date().toISOString() }
            try {
                await trackingService.addTrack(null, trackData)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on unexisting serial number tracker', async () => {
            const trackData = { serialNumber: '000_NO_EXIST', latitude: lat, longitude: lon, speed: 1, status: 'ON', date: new Date().toISOString() }
            try {
                await trackingService.addTrack(user.id, trackData)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`Tracker with SN 000_NO_EXIST doesn't exists`)
            }
        })

        it('should fail on undefined data track', async () => {
            try {
                await trackingService.addTrack(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(InputError)
                expect(error.message).toBe('incorrect track info')
            }
        })

        it('should fail on null data track', async () => {
            try {
                await trackingService.addTrack(user.id, null)
            } catch (error) {
                expect(error).toBeInstanceOf(InputError)
                expect(error.message).toBe('incorrect track info')
            }
        })
    })

    describe('addTrackTCP', () => {
        let user
        let _password
        let lat, lon
        let trackerData, trackerData2

        beforeEach(async () => {
            lat = Math.random() * 100
            lon = Math.random() * 10
            _password = await argon2.hash(password)
            trackerData2 = { serialNumber: '1234567890', licensePlate: '1234-ABC' }
            trackerData = { serialNumber: '1234567123', licensePlate: '1244-ABC' }
            user = await User.create({ name, surname, email, password: _password, trackers: [trackerData, trackerData2] })
        })

        it('should publish LIVE_TRACKS_UPDATED for known serial number', async () => {
            const pubsub = require('../graphql/pubsub')
            const publishSpy = vi.spyOn(pubsub, 'publish')

            const trackData = {
                serialNumber: '1234567890',
                latitude: lat,
                longitude: lon,
                speed: 55,
                status: 'ON',
                date: new Date().toISOString()
            }
            await trackingService.addTrackTCP(trackData)

            expect(publishSpy).toHaveBeenCalledWith(
                'LIVE_TRACKS_UPDATED',
                expect.objectContaining({
                    liveTracksUpdated: expect.arrayContaining([
                        expect.objectContaining({ serialNumber: '1234567890' })
                    ])
                })
            )

            publishSpy.mockRestore()
        })

        it('should NOT publish LIVE_TRACKS_UPDATED for unknown serial number', async () => {
            const pubsub = require('../graphql/pubsub')
            const publishSpy = vi.spyOn(pubsub, 'publish')

            const trackData = {
                serialNumber: '000_NO_EXIST',
                latitude: lat,
                longitude: lon,
                speed: 10,
                status: 'ON',
                date: new Date().toISOString()
            }
            const result = await trackingService.addTrackTCP(trackData)

            expect(result).toBeNull()
            expect(publishSpy).not.toHaveBeenCalled()

            publishSpy.mockRestore()
        })

        it('should succeed on correct track data and persist to Track collection', async () => {
            const trackData = {
                serialNumber: '1234567890',
                latitude: lat,
                longitude: lon,
                speed: 123.21,
                status: 'OFF',
                date: new Date().toISOString()
            }
            await trackingService.addTrackTCP(trackData)
            const saved = await Track.findOne({ serialNumber: '1234567890' })
            expect(saved).toBeDefined()
            expect(saved.speed).toBe(123.21)
            expect(saved.status).toBe('OFF')
        })

        it('should succeed on correct track partial data', async () => {
            const trackData = {
                serialNumber: '1234567890',
                latitude: lat,
                longitude: lon,
                date: new Date().toISOString()
            }
            await trackingService.addTrackTCP(trackData)
            const saved = await Track.findOne({ serialNumber: '1234567890' })
            expect(saved).toBeDefined()
            expect(saved.speed).toBe(0)
            expect(saved.status).toBe('ON')
        })

        it('should silently discard (return null, no Track persisted) on unknown serial number', async () => {
            const trackData = {
                serialNumber: '000_NO_EXIST',
                latitude: lat,
                longitude: lon,
                speed: 123.21,
                status: 'ON',
                date: new Date().toISOString()
            }
            const result = await trackingService.addTrackTCP(trackData)
            expect(result).toBeNull()
            const count = await Track.countDocuments({ serialNumber: '000_NO_EXIST' })
            expect(count).toBe(0)
        })

        it('should fail on undefined data track', async () => {
            try {
                await trackingService.addTrackTCP(undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(InputError)
                expect(error.message).toBe('incorrect track info')
            }
        })

        it('should fail on null data track', async () => {
            try {
                await trackingService.addTrackTCP(null)
            } catch (error) {
                expect(error).toBeInstanceOf(InputError)
                expect(error.message).toBe('incorrect track info')
            }
        })
    })

    describe('retrieveLastTrack', () => {
        let user
        let _password
        let lat, lon

        beforeEach(async () => {
            lat = Math.random() * 100
            lon = Math.random() * 10
            _password = await argon2.hash(password)
            user = await User.create({
                name, surname, email, password: _password,
                trackers: [{ serialNumber: '9000000001', licensePlate: 'XX-1111' }]
            })
            // Create some tracks in the standalone collection
            await Track.create({ serialNumber: '9000000001', latitude: lat, longitude: lon, speed: 10, status: 'ON', date: new Date(Date.now() - 2000) })
            await Track.create({ serialNumber: '9000000001', latitude: lat + 1, longitude: lon + 1, speed: 99, status: 'OFF', date: new Date() })
        })

        it('should return the most recent track for a tracker', async () => {
            const resp = await trackingService.retrieveLastTrack(user.id, user.trackers[0].id)
            expect(resp).toBeDefined()
            expect(resp.speed).toBe(99)
            expect(resp.status).toBe('OFF')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await trackingService.retrieveLastTrack(wrongId, user.trackers[0].id)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on undefined id user', async () => {
            try {
                await trackingService.retrieveLastTrack(undefined, user.trackers[0].id)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on null id user', async () => {
            try {
                await trackingService.retrieveLastTrack(null, user.trackers[0].id)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on unexisting tracker id', async () => {
            const badId = 'Bad_Tracker_Id'
            try {
                await trackingService.retrieveLastTrack(user.id, badId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`Tracker with id ${badId} doesn't exists`)
            }
        })

        it('should fail on undefined tracker id', async () => {
            try {
                await trackingService.retrieveLastTrack(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe('trackerID is not optional')
            }
        })

        it('should fail on null tracker id', async () => {
            try {
                await trackingService.retrieveLastTrack(user.id, null)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe('trackerID is not optional')
            }
        })
    })

    describe('retrieveAllLastTracks', () => {
        let user, _user
        let _password
        let lat, lon

        beforeEach(async () => {
            lat = Math.random() * 100
            lon = Math.random() * 10
            _password = await argon2.hash(password)
            user = await User.create({
                name, surname, email, password: _password,
                trackers: [
                    { serialNumber: '9000000010', licensePlate: 'AA-0001' },
                    { serialNumber: '9000000011', licensePlate: 'AA-0002' }
                ]
            })
            _user = await User.create({ name, surname, email: '123@123.com', password: _password })

            await Track.create({ serialNumber: '9000000010', latitude: lat, longitude: lon, speed: 50, status: 'ON', date: new Date(Date.now() - 1000) })
            await Track.create({ serialNumber: '9000000010', latitude: lat, longitude: lon, speed: 60, status: 'ON', date: new Date() })
            await Track.create({ serialNumber: '9000000011', latitude: lat, longitude: lon, speed: 80, status: 'OFF', date: new Date() })
        })

        it('should return last track for each tracker enriched with licensePlate', async () => {
            const resp = await trackingService.retrieveAllLastTracks(user.id)
            expect(resp.length).toBe(2)
            // each result should have licensePlate
            expect(resp[0].licensePlate).toBeDefined()
            expect(resp[1].licensePlate).toBeDefined()
            // last track for first tracker should be speed 60
            const t1 = resp.find(r => r.serialNumber === '9000000010')
            expect(t1).toBeDefined()
            expect(t1.speed).toBe(60)
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await trackingService.retrieveAllLastTracks(wrongId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on undefined id user', async () => {
            try {
                await trackingService.retrieveAllLastTracks(undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on null id user', async () => {
            try {
                await trackingService.retrieveAllLastTracks(null)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should return empty array for user with no trackers', async () => {
            const resp = await trackingService.retrieveAllLastTracks(_user.id)
            expect(resp).toEqual([])
        })
    })

    describe('retrieveRangeOfTracks', () => {
        let user
        let _password
        let startTime, endTime

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({
                name, surname, email, password: _password,
                trackers: [{ serialNumber: '978878981234', licensePlate: '1234-ABC' }]
            })

            // Create 60 tracks within a time window
            const base = Date.now()
            startTime = new Date(base).toISOString()
            endTime = new Date(base + 60000).toISOString()

            const trackDocs = Array.from({ length: 60 }, (_, i) => ({
                serialNumber: '978878981234',
                latitude: Math.random() * 100,
                longitude: Math.random() * 10,
                speed: 100 + i,
                status: 'ON',
                date: new Date(base + i * 900)
            }))
            await Track.insertMany(trackDocs)
        })

        it('should return tracks within the specified time range', async () => {
            const resp = await trackingService.retrieveRangeOfTracks(user.id, user.trackers[0].id, startTime, endTime)
            expect(resp).toBeDefined()
            expect(resp.length).toBeGreaterThan(0)
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await trackingService.retrieveRangeOfTracks(wrongId, user.trackers[0].id, startTime, endTime)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail when no tracks exist in range', async () => {
            const past = '2000-01-01T00:00:00.000Z'
            const pastEnd = '2000-01-02T00:00:00.000Z'
            try {
                await trackingService.retrieveRangeOfTracks(user.id, user.trackers[0].id, past, pastEnd)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toContain('Tracker without tracks between')
            }
        })

        it('should fail on undefined id user', async () => {
            try {
                await trackingService.retrieveRangeOfTracks(undefined, user.trackers[0].id, startTime, endTime)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on null id user', async () => {
            try {
                await trackingService.retrieveRangeOfTracks(null, user.trackers[0].id, startTime, endTime)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on undefined tracker id', async () => {
            try {
                await trackingService.retrieveRangeOfTracks(user.id, undefined, startTime, endTime)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe('trackerID is not optional')
            }
        })

        it('should fail on null tracker id', async () => {
            try {
                await trackingService.retrieveRangeOfTracks(user.id, null, startTime, endTime)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe('trackerID is not optional')
            }
        })

        it('should fail on undefined start time', async () => {
            try {
                await trackingService.retrieveRangeOfTracks(user.id, user.trackers[0].id, undefined, endTime)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe('startTime is not optional')
            }
        })

        it('should fail on undefined end time', async () => {
            try {
                await trackingService.retrieveRangeOfTracks(user.id, user.trackers[0].id, startTime, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe('endTime is not optional')
            }
        })
    })
})

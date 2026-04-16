const { models: { User, Track } } = require('track-data')
const { errors: { LogicError, RequirementError, InputError } } = require('track-utils')
const argon2 = require('argon2')
const trackingService = require('./tracking.service')

async function expectServiceError(run, ErrorType, message, matcher = 'toBe') {
    let caught
    try {
        await run()
    } catch (error) {
        caught = error
    }

    expect(caught).toBeInstanceOf(ErrorType)
    if (matcher === 'toContain') {
        expect(caught.message).toContain(message)
        return
    }
    expect(caught.message).toBe(message)
}

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
            lat = -80 + Math.random() * 160
            lon = Math.random() * 10
            _password = await argon2.hash(password)
            trackerData2 = { serialNumber: '1234567890', alias: '1234-ABC' }
            trackerData = { serialNumber: '1234567123', alias: '1244-ABC' }
            user = await User.create({ name, surname, email, password: _password, trackers: [trackerData, trackerData2] })
        })

        it('should succeed on correct track data', async () => {
            const trackData = {
                serialNumber: '1234567890',
                latitude: lat,
                longitude: lon,
                speed: 123.21,
                status: 0,
                date: new Date().toISOString()
            }
            await trackingService.addTrack(user.id, trackData)
            const saved = await Track.findOne({ serialNumber: '1234567890' })
            expect(saved).toBeDefined()
            expect(saved.speed).toBe(123.2)
            expect(saved.status).toBe(0)
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
            expect(saved.status).toBe(1)
        })

        it('should fail on incorrect id user', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            const trackData = { serialNumber: '1234567890', latitude: lat, longitude: lon, speed: 1, status: 1, date: new Date().toISOString() }
            await expectServiceError(() => trackingService.addTrack(wrongId, trackData), LogicError, `user with id ${wrongId} doesn't exists`)
        })

        it('should fail on undefined id user', async () => {
            const trackData = { serialNumber: '1234567890', latitude: lat, longitude: lon, speed: 1, status: 1, date: new Date().toISOString() }
            await expectServiceError(() => trackingService.addTrack(undefined, trackData), RequirementError, `id is not optional`)
        })

        it('should fail on null id user', async () => {
            const trackData = { serialNumber: '1234567890', latitude: lat, longitude: lon, speed: 1, status: 1, date: new Date().toISOString() }
            await expectServiceError(() => trackingService.addTrack(null, trackData), RequirementError, `id is not optional`)
        })

        it('should fail on unexisting serial number tracker', async () => {
            const trackData = { serialNumber: '000_NO_EXIST', latitude: lat, longitude: lon, speed: 1, status: 1, date: new Date().toISOString() }
            await expectServiceError(() => trackingService.addTrack(user.id, trackData), LogicError, `Tracker with SN 000_NO_EXIST doesn't exists`)
        })

        it('should fail on undefined data track', async () => {
            await expectServiceError(() => trackingService.addTrack(user.id, undefined), InputError, 'incorrect track info')
        })

        it('should fail on null data track', async () => {
            await expectServiceError(() => trackingService.addTrack(user.id, null), InputError, 'incorrect track info')
        })
    })

    describe('addTrackTCP', () => {
        let user
        let _password
        let lat, lon
        let trackerData, trackerData2

        beforeEach(async () => {
            lat = -80 + Math.random() * 160
            lon = Math.random() * 10
            _password = await argon2.hash(password)
            trackerData2 = { serialNumber: '1234567890', alias: '1234-ABC' }
            trackerData = { serialNumber: '1234567123', alias: '1244-ABC' }
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
                status: 1,
                date: new Date().toISOString()
            }
            await trackingService.addTrackTCP(trackData)

            expect(publishSpy).toHaveBeenCalledWith(
                expect.stringMatching(/^LIVE_TRACKS_UPDATED_/),
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
                status: 1,
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
                status: 0,
                date: new Date().toISOString()
            }
            await trackingService.addTrackTCP(trackData)
            const saved = await Track.findOne({ serialNumber: '1234567890' })
            expect(saved).toBeDefined()
            expect(saved.speed).toBe(123.2)
            expect(saved.status).toBe(0)
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
            expect(saved.status).toBe(1)
        })

        it('should silently discard (return null, no Track persisted) on unknown serial number', async () => {
            const trackData = {
                serialNumber: '000_NO_EXIST',
                latitude: lat,
                longitude: lon,
                speed: 123.21,
                status: 1,
                date: new Date().toISOString()
            }
            const result = await trackingService.addTrackTCP(trackData)
            expect(result).toBeNull()
            const count = await Track.countDocuments({ serialNumber: '000_NO_EXIST' })
            expect(count).toBe(0)
        })

        it('should fail on undefined data track', async () => {
            await expectServiceError(() => trackingService.addTrackTCP(undefined), InputError, 'incorrect track info')
        })

        it('should fail on null data track', async () => {
            await expectServiceError(() => trackingService.addTrackTCP(null), InputError, 'incorrect track info')
        })

        it('should fail on out-of-range latitude', async () => {
            const trackData = {
                serialNumber: '1234567890',
                latitude: 123.456,
                longitude: lon,
                speed: 50,
                status: 1,
                date: new Date().toISOString()
            }

            await expectServiceError(() => trackingService.addTrackTCP(trackData), InputError, 'latitude out of range')
        })
    })

    describe('retrieveLastTrack', () => {
        let user
        let _password
        let lat, lon

        beforeEach(async () => {
            lat = -80 + Math.random() * 160
            lon = Math.random() * 10
            _password = await argon2.hash(password)
            user = await User.create({
                name, surname, email, password: _password,
                trackers: [{ serialNumber: '9000000001', alias: 'XX-1111' }]
            })
            // Create some tracks in the standalone collection
            await Track.create({ serialNumber: '9000000001', latitude: lat, longitude: lon, speed: 10, status: 1, date: new Date(Date.now() - 2000) })
            await Track.create({ serialNumber: '9000000001', latitude: lat + 1, longitude: lon + 1, speed: 99, status: 0, date: new Date() })
        })

        it('should return the most recent track for a tracker', async () => {
            const resp = await trackingService.retrieveLastTrack(user.id, user.trackers[0].id)
            expect(resp).toBeDefined()
            expect(resp.speed).toBe(99)
            expect(resp.status).toBe('OFF')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            await expectServiceError(() => trackingService.retrieveLastTrack(wrongId, user.trackers[0].id), LogicError, `user with id ${wrongId} doesn't exists`)
        })

        it('should fail on undefined id user', async () => {
            await expectServiceError(() => trackingService.retrieveLastTrack(undefined, user.trackers[0].id), RequirementError, `id is not optional`)
        })

        it('should fail on null id user', async () => {
            await expectServiceError(() => trackingService.retrieveLastTrack(null, user.trackers[0].id), RequirementError, `id is not optional`)
        })

        it('should fail on unexisting tracker id', async () => {
            const badId = 'Bad_Tracker_Id'
            await expectServiceError(() => trackingService.retrieveLastTrack(user.id, badId), LogicError, `Tracker with id ${badId} doesn't exists`)
        })

        it('should fail on undefined tracker id', async () => {
            await expectServiceError(() => trackingService.retrieveLastTrack(user.id, undefined), RequirementError, 'trackerID is not optional')
        })

        it('should fail on null tracker id', async () => {
            await expectServiceError(() => trackingService.retrieveLastTrack(user.id, null), RequirementError, 'trackerID is not optional')
        })
    })

    describe('retrieveAllLastTracks', () => {
        let user, _user
        let _password
        let lat, lon

        beforeEach(async () => {
            lat = -80 + Math.random() * 160
            lon = Math.random() * 10
            _password = await argon2.hash(password)
            user = await User.create({
                name, surname, email, password: _password,
                trackers: [
                    { serialNumber: '9000000010', alias: 'AA-0001' },
                    { serialNumber: '9000000011', alias: 'AA-0002' }
                ]
            })
            _user = await User.create({ name, surname, email: '123@123.com', password: _password })

            await Track.create({ serialNumber: '9000000010', latitude: lat, longitude: lon, speed: 50, status: 1, date: new Date(Date.now() - 1000) })
            await Track.create({ serialNumber: '9000000010', latitude: lat, longitude: lon, speed: 60, status: 1, date: new Date() })
            await Track.create({ serialNumber: '9000000011', latitude: lat, longitude: lon, speed: 80, status: 0, date: new Date() })
        })

        it('should return last track for each tracker enriched with alias', async () => {
            const resp = await trackingService.retrieveAllLastTracks(user.id)
            expect(resp.length).toBe(2)
            // each result should have alias
            expect(resp[0].alias).toBeDefined()
            expect(resp[1].alias).toBeDefined()
            // last track for first tracker should be speed 60
            const t1 = resp.find(r => r.serialNumber === '9000000010')
            expect(t1).toBeDefined()
            expect(t1.speed).toBe(60)
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            await expectServiceError(() => trackingService.retrieveAllLastTracks(wrongId), LogicError, `user with id ${wrongId} doesn't exists`)
        })

        it('should fail on undefined id user', async () => {
            await expectServiceError(() => trackingService.retrieveAllLastTracks(undefined), RequirementError, `id is not optional`)
        })

        it('should fail on null id user', async () => {
            await expectServiceError(() => trackingService.retrieveAllLastTracks(null), RequirementError, `id is not optional`)
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
                trackers: [{ serialNumber: '978878981234', alias: '1234-ABC' }]
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
                status: 1,
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
            await expectServiceError(() => trackingService.retrieveRangeOfTracks(wrongId, user.trackers[0].id, startTime, endTime), LogicError, `user with id ${wrongId} doesn't exists`)
        })

        it('should fail when no tracks exist in range', async () => {
            const past = '2000-01-01T00:00:00.000Z'
            const pastEnd = '2000-01-02T00:00:00.000Z'
            await expectServiceError(() => trackingService.retrieveRangeOfTracks(user.id, user.trackers[0].id, past, pastEnd), LogicError, 'Tracker without tracks between', 'toContain')
        })

        it('should fail on undefined id user', async () => {
            await expectServiceError(() => trackingService.retrieveRangeOfTracks(undefined, user.trackers[0].id, startTime, endTime), RequirementError, `id is not optional`)
        })

        it('should fail on null id user', async () => {
            await expectServiceError(() => trackingService.retrieveRangeOfTracks(null, user.trackers[0].id, startTime, endTime), RequirementError, `id is not optional`)
        })

        it('should fail on undefined tracker id', async () => {
            await expectServiceError(() => trackingService.retrieveRangeOfTracks(user.id, undefined, startTime, endTime), RequirementError, 'trackerID is not optional')
        })

        it('should fail on null tracker id', async () => {
            await expectServiceError(() => trackingService.retrieveRangeOfTracks(user.id, null, startTime, endTime), RequirementError, 'trackerID is not optional')
        })

        it('should fail on undefined start time', async () => {
            await expectServiceError(() => trackingService.retrieveRangeOfTracks(user.id, user.trackers[0].id, undefined, endTime), RequirementError, 'startTime is not optional')
        })

        it('should fail on undefined end time', async () => {
            await expectServiceError(() => trackingService.retrieveRangeOfTracks(user.id, user.trackers[0].id, startTime, undefined), RequirementError, 'endTime is not optional')
        })
    })
})

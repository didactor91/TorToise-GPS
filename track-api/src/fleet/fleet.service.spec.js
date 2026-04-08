const { models: { User } } = require('track-data')
const { errors: { LogicError, RequirementError, InputError } } = require('track-utils')
const argon2 = require('argon2')
const service = require('./fleet.service')

describe('fleetService', () => {
    let name, surname, email, password

    beforeEach(async () => {
        name = `name-${Math.random()}`
        surname = `surname-${Math.random()}`
        email = `email-${Math.random()}@mail.com`
        password = `password-${Math.random()}`
        await User.deleteMany()
    })

    describe('create Tracker', () => {
        let user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password })
        })

        it('should succeed on correct tracker data [FULL]', async () => {
            const trackerData = { serialNumber: '1234567890', licensePlate: '1234-ABC' }
            await service.addTracker(user.id, trackerData)
            const resp = await User.findById(user.id)
            const pos = resp.trackers.length - 1
            expect(resp.trackers[pos].serialNumber).toBe('1234567890')
            expect(resp.trackers[pos].licensePlate).toBe('1234-ABC')
        })

        it('should succeed on correct data [without license plate]', async () => {
            const trackerData = { serialNumber: '1234567890' }
            await service.addTracker(user.id, trackerData)
            const resp = await User.findById(user.id)
            const pos = resp.trackers.length - 1
            expect(resp.trackers[pos].serialNumber).toBe('1234567890')
            expect(resp.trackers[pos].licensePlate).toBeDefined()
        })

        it('should fail on incorrect id user', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.addTracker(wrongId, { serialNumber: '1234567890' })
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on undefined id user', async () => {
            try {
                await service.addTracker(undefined, { serialNumber: '1234567890' })
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on null id user', async () => {
            try {
                await service.addTracker(null, { serialNumber: '1234567890' })
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on undefined data tracker', async () => {
            try {
                await service.addTracker(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(InputError)
                expect(error.message).toBe('incorrect tracker info')
            }
        })

        it('should fail on null data tracker', async () => {
            try {
                await service.addTracker(user.id, null)
            } catch (error) {
                expect(error).toBeInstanceOf(InputError)
                expect(error.message).toBe('incorrect tracker info')
            }
        })

        it('should fail on add existing tracker serial number', async () => {
            const _serialNumber = '123123123'
            try {
                await service.addTracker(user.id, { serialNumber: _serialNumber })
                await service.addTracker(user.id, { serialNumber: _serialNumber })
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`Serial Number ${_serialNumber} already registered`)
            }
        })

        it('should fail on add existing tracker license plate', async () => {
            const _serialNumber = '1234500000'
            const _licensePlate = '1234-SKY'
            const __serialNumber = '1231456456'
            try {
                await service.addTracker(user.id, { serialNumber: _serialNumber, licensePlate: _licensePlate })
                await service.addTracker(user.id, { serialNumber: __serialNumber, licensePlate: _licensePlate })
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`License Plate ${_licensePlate} already registered`)
            }
        })
    })

    describe('retrieve ALL Trackers', () => {
        let user, _user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            const trackerData = { serialNumber: '1234567890', licensePlate: '1234-ABC' }
            const trackerData2 = { serialNumber: '12332100', licensePlate: '9089-POP' }
            user = await User.create({ name, surname, email, password: _password, trackers: [trackerData, trackerData2] })
            _user = await User.create({ name, surname, email: '123@123.ccc', password: _password })
        })

        it('should succeed on correct id from existing user', async () => {
            const data = await service.retrieveAllTrackers(user.id)
            expect(data.length).toBe(2)
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.retrieveAllTrackers(wrongId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should return empty array for user without Trackers', async () => {
            const data = await service.retrieveAllTrackers(_user.id)
            expect(data).toEqual([])
        })
    })

    describe('retrieve Tracker', () => {
        let user, _user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password, trackers: [
                { serialNumber: '1234567890', licensePlate: '1234-ABC' },
                { serialNumber: '12332100', licensePlate: '9089-POP' }
            ]})
            _user = await User.create({ name, surname, email: '123@123.ccc', password: _password })
        })

        it('should succeed on correct id from existing user', async () => {
            const data = await service.retrieveTracker(user.id, user.trackers[0].id)
            expect(data.serialNumber).toBe('1234567890')
            expect(data.licensePlate).toBe('1234-ABC')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.retrieveTracker(wrongId, user.trackers[0].id)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on user with wrong Tracker id', async () => {
            const trackerId = '1234132412'
            try {
                await service.retrieveTracker(user.id, trackerId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`Tracker with id ${trackerId} doesn't exists`)
            }
        })

        it('should fail on undefined Tracker id', async () => {
            try {
                await service.retrieveTracker(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`trackerID is not optional`)
            }
        })
    })

    describe('retrieve Tracker by SN', () => {
        let user, _user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password, trackers: [
                { serialNumber: '1234567890', licensePlate: '1234-ABC' },
                { serialNumber: '12332100', licensePlate: '9089-POP' }
            ]})
            _user = await User.create({ name, surname, email: '123@123.ccc', password: _password })
        })

        it('should succeed on correct id from existing user', async () => {
            const data = await service.retrieveTrackerBySN(user.id, '1234567890')
            expect(data.serialNumber).toBe('1234567890')
            expect(data.licensePlate).toBe('1234-ABC')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.retrieveTrackerBySN(wrongId, '1234567890')
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on user with wrong Tracker SN', async () => {
            const trackerSN = 'FAKE_FAKE'
            try {
                await service.retrieveTrackerBySN(user.id, trackerSN)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`Tracker with SN ${trackerSN} doesn't exists`)
            }
        })

        it('should fail on undefined Serial Number', async () => {
            try {
                await service.retrieveTrackerBySN(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`serialNumber is not optional`)
            }
        })
    })

    describe('retrieve Tracker by License Plate', () => {
        let user, _user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password, trackers: [
                { serialNumber: '1234567890', licensePlate: '1234-ABC' },
                { serialNumber: '12332100', licensePlate: '9089-POP' }
            ]})
            _user = await User.create({ name, surname, email: '123@123.ccc', password: _password })
        })

        it('should succeed on correct id from existing user', async () => {
            const data = await service.retrieveTrackerByLicense(user.id, '1234-ABC')
            expect(data.serialNumber).toBe('1234567890')
            expect(data.licensePlate).toBe('1234-ABC')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.retrieveTrackerByLicense(wrongId, '1234-ABC')
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on user with wrong Tracker License', async () => {
            const trackerLicense = 'FAKE_FAKE'
            try {
                await service.retrieveTrackerByLicense(user.id, trackerLicense)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`Tracker with License Plate ${trackerLicense} doesn't exists`)
            }
        })

        it('should fail on undefined License', async () => {
            try {
                await service.retrieveTrackerByLicense(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`licensePlate is not optional`)
            }
        })
    })

    describe('update Tracker', () => {
        let user, _user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            _user = await User.create({ name, surname, email: '12__3@123.com', password: _password })
            user = await User.create({ name, surname, email, password: _password, trackers: [
                { serialNumber: '1234567890', licensePlate: '1234-ABC' },
                { serialNumber: '0987654321', licensePlate: '0909-CXD' }
            ]})
        })

        it('should succeed on correct id from existing user', async () => {
            const _trackerData = { serialNumber: '09-UPDATE-91', licensePlate: '0909-UPDATE' }
            await service.updateTracker(user.id, user.trackers[0].id, _trackerData)
            const data = await User.findById(user.id)
            expect(data.trackers[0].serialNumber).toBe('09-UPDATE-91')
            expect(data.trackers[0].licensePlate).toBe('0909-UPDATE')
        })

        it('should succeed on correct id from existing user [only serialnumber]', async () => {
            const _trackerData = { serialNumber: '09-UPDATE-91' }
            await service.updateTracker(user.id, user.trackers[0].id, _trackerData)
            const data = await User.findById(user.id)
            expect(data.trackers[0].serialNumber).toBe('09-UPDATE-91')
            expect(data.trackers[0].licensePlate).toBe('1234-ABC')
        })

        it('should succeed on correct id from existing user [only licenseplate]', async () => {
            const _trackerData = { licensePlate: '0909-UPDATE' }
            await service.updateTracker(user.id, user.trackers[0].id, _trackerData)
            const data = await User.findById(user.id)
            expect(data.trackers[0].serialNumber).toBe('1234567890')
            expect(data.trackers[0].licensePlate).toBe('0909-UPDATE')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.updateTracker(wrongId, user.trackers[0].id, { serialNumber: 'X' })
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on user with wrong Tracker id', async () => {
            const trackerId = '1234132412'
            try {
                await service.updateTracker(user.id, trackerId, { serialNumber: 'X' })
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`Tracker with id ${trackerId} doesn't exists`)
            }
        })

        it('should fail on undefined tracker id', async () => {
            try {
                await service.updateTracker(user.id, undefined, { serialNumber: 'X' })
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`trackerID is not optional`)
            }
        })

        it('should fail on undefined trackerData', async () => {
            try {
                await service.updateTracker(user.id, user.trackers[0].id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`trackerData is not optional`)
            }
        })
    })

    describe('delete Tracker', () => {
        let user, _user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            _user = await User.create({ name, surname, email: '12__3@123.com', password: _password })
            user = await User.create({ name, surname, email, password: _password, trackers: [
                { serialNumber: '1234567890', licensePlate: '1234-ABC' },
                { serialNumber: '0987654321', licensePlate: '0909-CXD' }
            ]})
        })

        it('should succeed on correct id from existing user', async () => {
            await service.deleteTracker(user.id, user.trackers[0].id)
            const data = await User.findById(user.id)
            expect(data.trackers.length).toBe(1)
            expect(data.trackers[0].licensePlate).toBe('0909-CXD')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.deleteTracker(wrongId, user.trackers[0].id)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on user with wrong tracker id', async () => {
            const trackerId = '1234132412'
            try {
                await service.deleteTracker(user.id, trackerId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`Tracker with id ${trackerId} doesn't exists`)
            }
        })

        it('should fail on undefined tracker id', async () => {
            try {
                await service.deleteTracker(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`trackerID is not optional`)
            }
        })
    })
})

const { models: { User } } = require('track-data')
const { errors: { LogicError, RequirementError, InputError } } = require('track-utils')
const argon2 = require('argon2')
const service = require('./poi.service')

describe('poiService', () => {
    let name, surname, email, password

    beforeEach(async () => {
        name = `name-${Math.random()}`
        surname = `surname-${Math.random()}`
        email = `email-${Math.random()}@mail.com`
        password = `password-${Math.random()}`
        await User.deleteMany()
    })

    describe('create POI', () => {
        let user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password })
        })

        it('should succeed on correct data [FULL]', async () => {
            const lat = Math.random() * 100
            const lon = Math.random() * 10
            const poiData = { title: 'My Fav', color: '#ff0000', latitude: lat, longitude: lon }
            await service.addPOI(user.id, poiData)
            const resp = await User.findById(user.id)
            const pos = resp.pois.length - 1
            expect(resp.pois[pos].title).toBe('My Fav')
            expect(resp.pois[pos].color).toBe('#ff0000')
            expect(resp.pois[pos].latitude).toBe(poiData.latitude)
            expect(resp.pois[pos].longitude).toBe(poiData.longitude)
        })

        it('should succeed on correct data [without title]', async () => {
            const lat = Math.random() * 100
            const lon = Math.random() * 10
            const poiData = { color: '#ff0000', latitude: lat, longitude: lon }
            await service.addPOI(user.id, poiData)
            const resp = await User.findById(user.id)
            const pos = resp.pois.length - 1
            expect(resp.pois[pos].title).toBeDefined()
            expect(resp.pois[pos].color).toBe('#ff0000')
        })

        it('should succeed on correct data [without color]', async () => {
            const lat = Math.random() * 100
            const lon = Math.random() * 10
            const poiData = { title: 'My Fav', latitude: lat, longitude: lon }
            await service.addPOI(user.id, poiData)
            const resp = await User.findById(user.id)
            const pos = resp.pois.length - 1
            expect(resp.pois[pos].title).toBe('My Fav')
            expect(resp.pois[pos].color).toBe('#89c800')
        })

        it('should succeed on correct data [without title & color]', async () => {
            const lat = Math.random() * 100
            const lon = Math.random() * 10
            const poiData = { latitude: lat, longitude: lon }
            await service.addPOI(user.id, poiData)
            const resp = await User.findById(user.id)
            const pos = resp.pois.length - 1
            expect(resp.pois[pos].title).toBeDefined()
            expect(resp.pois[pos].color).toBe('#89c800')
        })

        it('should fail on incorrect id user', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            const poiData = { title: 'My Fav', color: '#ff0000', latitude: 10, longitude: 2 }
            try {
                await service.addPOI(wrongId, poiData)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on undefined id user', async () => {
            try {
                await service.addPOI(undefined, { title: 'X', color: '#fff', latitude: 1, longitude: 2 })
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on null id user', async () => {
            try {
                await service.addPOI(null, { title: 'X', color: '#fff', latitude: 1, longitude: 2 })
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`id is not optional`)
            }
        })

        it('should fail on undefined data poi', async () => {
            try {
                await service.addPOI(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(InputError)
                expect(error.message).toBe('incorrect poi info')
            }
        })

        it('should fail on null data poi', async () => {
            try {
                await service.addPOI(user.id, null)
            } catch (error) {
                expect(error).toBeInstanceOf(InputError)
                expect(error.message).toBe('incorrect poi info')
            }
        })

        it('should fail on null data latitude', async () => {
            try {
                await service.addPOI(user.id, { title: 'X', color: '#fff', latitude: null, longitude: 2 })
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`latitude is not optional`)
            }
        })

        it('should fail on undefined data latitude', async () => {
            try {
                await service.addPOI(user.id, { title: 'X', color: '#fff', latitude: undefined, longitude: 2 })
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`latitude is not optional`)
            }
        })

        it('should fail on null data longitude', async () => {
            try {
                await service.addPOI(user.id, { title: 'X', color: '#fff', latitude: 1, longitude: null })
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`longitude is not optional`)
            }
        })

        it('should fail on undefined data longitude', async () => {
            try {
                await service.addPOI(user.id, { title: 'X', color: '#fff', latitude: 1, longitude: undefined })
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`longitude is not optional`)
            }
        })
    })

    describe('retrieve ALL POIS', () => {
        let user, _user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email: '123@123.bbb', password: _password })
            _user = await User.create({ name, surname, email: '123@123.aaa', password: _password })
            await service.addPOI(user.id, { title: 'My Fav', color: '#ff0000', latitude: 1, longitude: 2 })
            await service.addPOI(user.id, { title: 'Your Fav', color: '#ff9999', latitude: 1, longitude: 2 })
        })

        it('should succeed on correct id from existing user', async () => {
            const data = await service.retrieveAllPOI(user.id)
            expect(data.length).toBe(2)
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.retrieveAllPOI(wrongId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should return empty array for user without POIs', async () => {
            const data = await service.retrieveAllPOI(_user.id)
            expect(data).toEqual([])
        })
    })

    describe('retrieve POI', () => {
        let user, _user, _password
        let poiData

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password })
            _user = await User.create({ name, surname, email: '123@123.ccc', password: _password })
            poiData = { title: 'My Fav', color: '#ff0000', latitude: 10, longitude: 2 }
            await service.addPOI(user.id, poiData)
            await service.addPOI(user.id, { title: 'Your Fav', color: '#ff9999', latitude: 10, longitude: 2 })
            user = await User.findById(user.id)
        })

        it('should succeed on correct id from existing user', async () => {
            const data = await service.retrieveOnePOI(user.id, user.pois[0].id)
            expect(data.title).toBe('My Fav')
            expect(data.color).toBe('#ff0000')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.retrieveOnePOI(wrongId, user.pois[0].id)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on user with wrong POI id', async () => {
            const poiId = '1234132412'
            try {
                await service.retrieveOnePOI(user.id, poiId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`POI with id ${poiId} doesn't exists`)
            }
        })

        it('should fail on undefined POI id', async () => {
            try {
                await service.retrieveOnePOI(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`poiID is not optional`)
            }
        })
    })

    describe('update POI', () => {
        let user, _user, _password
        let lat, lon, poiData, poiData2

        beforeEach(async () => {
            _password = await argon2.hash(password)
            lat = Math.random() * 100
            lon = Math.random() * 10
            poiData = { title: 'My Fav', color: '#ff0000', latitude: lat, longitude: lon }
            poiData2 = { title: 'Your Fav', color: '#ff9999', latitude: lat, longitude: lon }
            user = await User.create({ name, surname, email, password: _password, pois: [poiData, poiData2] })
            _user = await User.create({ name, surname, email: '1235@1235.ccc', password: _password })
        })

        it('should succeed on correct id from existing user', async () => {
            const _poiData = { title: 'Your UPDATED Fav', color: '#009999', latitude: lat, longitude: lon }
            await service.updatePOI(user.id, user.pois[0].id, _poiData)
            const data = await User.findById(user.id)
            expect(data.pois[0].title).toBe('Your UPDATED Fav')
            expect(data.pois[0].color).toBe('#009999')
        })

        it('should succeed on correct id from existing user [only title]', async () => {
            await service.updatePOI(user.id, user.pois[0].id, { title: 'Your UPDATED Fav' })
            const data = await User.findById(user.id)
            expect(data.pois[0].title).toBe('Your UPDATED Fav')
            expect(data.pois[0].color).toBe('#ff0000')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.updatePOI(wrongId, user.pois[0].id, poiData)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on user with wrong POI id', async () => {
            const poiId = '1234132412'
            try {
                await service.updatePOI(user.id, poiId, poiData)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`POI with id ${poiId} doesn't exists`)
            }
        })

        it('should fail on undefined POI id', async () => {
            try {
                await service.updatePOI(user.id, undefined, poiData)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`poiID is not optional`)
            }
        })

        it('should fail on undefined poiData', async () => {
            try {
                await service.updatePOI(user.id, user.pois[0].id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`poiData is not optional`)
            }
        })
    })

    describe('delete POI', () => {
        let user, _password
        let poiData, poiData2

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password })
            poiData = { title: 'My Fav', color: '#ff0000', latitude: 10, longitude: 2 }
            poiData2 = { title: 'Your Fav', color: '#ff9999', latitude: 10, longitude: 2 }
            await service.addPOI(user.id, poiData)
            await service.addPOI(user.id, poiData2)
            user = await User.findById(user.id)
        })

        it('should succeed on correct id from existing user', async () => {
            await service.deletePOI(user.id, user.pois[0].id)
            const data = await User.findById(user.id)
            expect(data.pois.length).toBe(1)
            expect(data.pois[0].title).toBe('Your Fav')
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.deletePOI(wrongId, user.pois[0].id)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on user with wrong POI id', async () => {
            const poiId = '1234132412'
            try {
                await service.deletePOI(user.id, poiId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`POI with id ${poiId} doesn't exists`)
            }
        })

        it('should fail on undefined POI id', async () => {
            try {
                await service.deletePOI(user.id, undefined)
            } catch (error) {
                expect(error).toBeInstanceOf(RequirementError)
                expect(error.message).toBe(`poiID is not optional`)
            }
        })
    })
})

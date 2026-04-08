const { models: { User } } = require('track-data')
const { errors: { LogicError, RequirementError, ValueError, InputError } } = require('track-utils')
const argon2 = require('argon2')
const service = require('./identity.service')

describe('identityService', () => {
    let name, surname, email, password

    beforeEach(async () => {
        const users = new Array(10).fill().map(() => ({
            name: `name-${Math.random()}`,
            surname: `surname-${Math.random()}`,
            email: `email-${Math.random()}@mail.com`,
            password: `password-${Math.random()}`
        }))

        const user = users[Math.floor(Math.random() * users.length)]

        name = user.name
        surname = user.surname
        email = user.email
        password = user.password

        await User.deleteMany()
    })

    describe('register user', () => {
        it('should succeed on correct data', async () => {
            await service.registerUser(name, surname, email, password)
            const user = await User.findOne({ email })
            expect(user.name).toBe(name)
            expect(user.surname).toBe(surname)
            expect(user.email).toBe(email)
            expect(await argon2.verify(user.password, password)).toBe(true)
        })

        it('should fail on retrying to register an already existing user', async () => {
            try {
                await User.create({ name, surname, email, password })
                await service.registerUser(name, surname, email, password)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with email ${email} already exists`)
            }
        })

        it('should fail on undefined email', () => {
            expect(() => service.registerUser(name, surname, undefined, password)).toThrow(`email is not optional`)
        })

        it('should fail on null email', () => {
            expect(() => service.registerUser(name, surname, null, password)).toThrow(`email is not optional`)
        })

        it('should fail on empty email', () => {
            expect(() => service.registerUser(name, surname, '', password)).toThrow('email is empty')
        })

        it('should fail on blank email', () => {
            expect(() => service.registerUser(name, surname, ' \t    \n', password)).toThrow('email is empty')
        })

        it('should fail on undefined name', () => {
            expect(() => service.registerUser(undefined, surname, email, password)).toThrow(`name is not optional`)
        })

        it('should fail on null name', () => {
            expect(() => service.registerUser(null, surname, email, password)).toThrow(`name is not optional`)
        })

        it('should fail on empty name', () => {
            expect(() => service.registerUser('', surname, email, password)).toThrow('name is empty')
        })

        it('should fail on blank name', () => {
            expect(() => service.registerUser(' \t    \n', surname, email, password)).toThrow('name is empty')
        })

        it('should fail on undefined surname', () => {
            expect(() => service.registerUser(name, undefined, email, password)).toThrow(`surname is not optional`)
        })

        it('should fail on null surname', () => {
            expect(() => service.registerUser(name, null, email, password)).toThrow(`surname is not optional`)
        })

        it('should fail on empty surname', () => {
            expect(() => service.registerUser(name, '', email, password)).toThrow('surname is empty')
        })

        it('should fail on blank surname', () => {
            expect(() => service.registerUser(name, ' \t    \n', email, password)).toThrow('surname is empty')
        })

        it('should fail on undefined password', () => {
            expect(() => service.registerUser(name, surname, email, undefined)).toThrow(`password is not optional`)
        })

        it('should fail on null password', () => {
            expect(() => service.registerUser(name, surname, email, null)).toThrow(`password is not optional`)
        })

        it('should fail on empty password', () => {
            expect(() => service.registerUser(name, surname, email, '')).toThrow('password is empty')
        })

        it('should fail on blank password', () => {
            expect(() => service.registerUser(name, surname, email, ' \t    \n')).toThrow('password is empty')
        })
    })

    describe('authenticate user', () => {
        let user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password })
        })

        it('should succeed on correct credentials', async () => {
            const id = await service.authenticateUser(email, password)

            expect(id).toBeDefined()
            expect(id).toBeTypeOf('string')
            expect(id).toBe(user.id)
        })

        it('should fail on non-existing user', async () => {
            let _email = 'THIS_USER_EMAIL_IS_FAKE@mail.com'
            try {
                await service.authenticateUser(_email, password)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with email ${_email} doesn't exists`)
            }
        })

        it('should fail on wrong credentials', async () => {
            try {
                await service.authenticateUser(email, 'incorrect password')
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`wrong credentials`)
            }
        })
    })

    describe('retrieve user', () => {
        let user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password })
        })

        it('should succeed on correct id from existing user', async () => {
            const _user = await service.retrieveUser(user.id)

            expect(_user.id).toBeUndefined()
            expect(_user.name).toBe(name)
            expect(_user.surname).toBe(surname)
            expect(_user.email).toBe(email)
            expect(_user.password).toBeUndefined()
        })

        it('should fail on incorrect user id', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.retrieveUser(wrongId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })
    })

    describe('update user', () => {
        let user, user2, _password
        const data = { name: 'UPDATED', surname: 'UPDATED' }
        const data2 = { email: '123test@123456.com' }

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password })
            user2 = await User.create({ name, surname, email: 'alpha123@mail.com', password: _password })
        })

        it('should succeed on correct data', async () => {
            await service.updateUser(user.id, data)

            const updatedUser = await User.findById(user.id)
            expect(updatedUser.name).toBe('UPDATED')
            expect(updatedUser.surname).toBe('UPDATED')
        })

        it('should succeed on correct data with email', async () => {
            await service.updateUser(user.id, data2)

            const updatedUser = await User.findById(user.id)
            expect(updatedUser.name).toBe(user.name)
            expect(updatedUser.surname).toBe(user.surname)
        })

        it('should fail on incorrect id user', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.updateUser(wrongId, data)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })

        it('should fail on change existing user email', async () => {
            const repeatData = { email: 'alpha123@mail.com' }
            try {
                await service.updateUser(user.id, repeatData)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`email ${repeatData.email} already registered`)
            }
        })
    })

    describe('delete user', () => {
        let user, _password

        beforeEach(async () => {
            _password = await argon2.hash(password)
            user = await User.create({ name, surname, email, password: _password })
        })

        it('should succeed on correct data', async () => {
            const resp = await service.deleteUser(user.id)
            expect(resp).toBe('user deleted')
            const _resp = await User.findById(user.id)
            expect(_resp).toBe(null)
        })

        it('should fail on incorrect id user', async () => {
            const wrongId = '5cb9998f2e59ee0009eac02c'
            try {
                await service.deleteUser(wrongId)
            } catch (error) {
                expect(error).toBeInstanceOf(LogicError)
                expect(error.message).toBe(`user with id ${wrongId} doesn't exists`)
            }
        })
    })
})

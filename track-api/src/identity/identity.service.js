const argon2 = require('argon2')
const { errors: { LogicError, InputError } } = require('track-utils')
const { validate } = require('track-utils')
const { models: { User } } = require('track-data')
const repo = require('./identity.repository')
const { getOrCreateDefaultCompany } = require('../shared/company-context')

const identityService = {
    registerUser(name, surname, email, password) {
        validate.arguments([
            { name: 'name', value: name, type: String, notEmpty: true },
            { name: 'surname', value: surname, type: String, notEmpty: true },
            { name: 'email', value: email, type: String, notEmpty: true },
            { name: 'password', value: password, type: String, notEmpty: true }
        ])

        validate.email(email)

        return (async () => {
            const existing = await repo.findByEmail(email)
            if (existing) throw new LogicError(`user with email ${email} already exists`)

            const hash = await argon2.hash(password)
            const company = await getOrCreateDefaultCompany()
            const newUser = await repo.create({
                name,
                surname,
                email,
                password: hash,
                companyId: company._id,
                role: 'admin'
            })
            return newUser.id
        })()
    },

    authenticateUser(email, password) {
        validate.arguments([
            { name: 'email', value: email, type: String, notEmpty: true },
            { name: 'password', value: password, type: String, notEmpty: true }
        ])

        validate.email(email)

        return (async () => {
            const user = await repo.findByEmail(email)
            // Deliberately return the same error for user-not-found and bad password
            // to prevent user enumeration.
            if (!user) throw new LogicError('invalid credentials')
            if (await argon2.verify(user.password, password)) return user.id
            else throw new LogicError('invalid credentials')
        })()
    },

    retrieveUser(id) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await User.findById(id)
                .select('-_id name surname email companyId role')
                .lean()
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)
            return user
        })()
    },

    updateUser(id, { name, surname, email } = {}) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true }
        ])

        return (async () => {
            const existing = await repo.findById(id)
            if (!existing) throw new LogicError(`user with id ${id} doesn't exists`)

            if (email) {
                const emailOwner = await repo.findByEmail(email)
                if (emailOwner && emailOwner._id.toString() !== id) {
                    throw new LogicError(`email ${email} already registered`)
                }
            }

            const patch = {}
            if (name) patch.name = name
            if (surname) patch.surname = surname
            if (email) patch.email = email

            await repo.updateById(id, patch)
        })()
    },

    deleteUser(id) {
        validate.arguments([
            { name: 'id', value: id, type: String, notEmpty: true }
        ])

        return (async () => {
            const user = await repo.findById(id)
            if (!user) throw new LogicError(`user with id ${id} doesn't exists`)

            await repo.deleteById(id)
            return 'user deleted'
        })()
    }
}

module.exports = identityService

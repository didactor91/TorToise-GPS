const argon2 = require('argon2')
const { validate, errors: { InputError, LogicError, UnauthorizedError } } = require('track-utils')
const repo = require('./backoffice.repository')

const VALID_ROLES = new Set(['staff', 'owner', 'admin', 'dispatcher', 'viewer'])

function assertValidRole(role) {
    if (!VALID_ROLES.has(role)) throw new InputError(`invalid role ${role}`)
}

const backofficeService = {
    async assertStaff(requesterId) {
        validate.arguments([{ name: 'requesterId', value: requesterId, type: String, notEmpty: true }])
        const user = await repo.findUserById(requesterId)
        if (!user) throw new LogicError(`user with id ${requesterId} doesn't exists`)
        if (user.role !== 'staff') throw new UnauthorizedError('staff access required')
    },

    async listCompanies(requesterId) {
        await this.assertStaff(requesterId)
        return repo.listCompanies()
    },

    async createCompany(requesterId, { name, slug, active = true }) {
        await this.assertStaff(requesterId)
        validate.arguments([
            { name: 'name', value: name, type: String, notEmpty: true },
            { name: 'slug', value: slug, type: String, notEmpty: true }
        ])
        if (typeof active !== 'boolean') throw new InputError('active should be a boolean')

        const existing = await repo.findCompanyBySlug(slug)
        if (existing) throw new LogicError(`company with slug ${slug} already exists`)

        return repo.createCompany({ name, slug, active })
    },

    async updateCompany(requesterId, companyId, { name, slug, active } = {}) {
        await this.assertStaff(requesterId)
        validate.arguments([
            { name: 'companyId', value: companyId, type: String, notEmpty: true }
        ])

        const company = await repo.findCompanyById(companyId)
        if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)

        const patch = {}
        if (name) patch.name = name
        if (typeof active === 'boolean') patch.active = active
        if (slug) {
            const existing = await repo.findCompanyBySlug(slug)
            if (existing && existing.id !== companyId) {
                throw new LogicError(`company with slug ${slug} already exists`)
            }
            patch.slug = slug
        }

        return repo.updateCompanyById(companyId, patch)
    },

    async listUsers(requesterId, companyId = null) {
        await this.assertStaff(requesterId)
        if (companyId) {
            validate.arguments([{ name: 'companyId', value: companyId, type: String, notEmpty: true }])
            const company = await repo.findCompanyById(companyId)
            if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)
        }
        return repo.listUsers(companyId)
    },

    async createUser(requesterId, { name, surname, email, password, role, companyId }) {
        await this.assertStaff(requesterId)
        validate.arguments([
            { name: 'name', value: name, type: String, notEmpty: true },
            { name: 'surname', value: surname, type: String, notEmpty: true },
            { name: 'email', value: email, type: String, notEmpty: true },
            { name: 'password', value: password, type: String, notEmpty: true },
            { name: 'role', value: role, type: String, notEmpty: true },
            { name: 'companyId', value: companyId, type: String, notEmpty: true }
        ])
        validate.email(email)
        assertValidRole(role)

        const company = await repo.findCompanyById(companyId)
        if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)

        const existing = await repo.findUserByEmail(email)
        if (existing) throw new LogicError(`user with email ${email} already exists`)

        const hash = await argon2.hash(password)
        return repo.createUser({ name, surname, email, password: hash, role, companyId })
    },

    async updateUser(requesterId, userId, { name, surname, email, role, companyId } = {}) {
        await this.assertStaff(requesterId)
        validate.arguments([{ name: 'userId', value: userId, type: String, notEmpty: true }])

        const user = await repo.findUserById(userId)
        if (!user) throw new LogicError(`user with id ${userId} doesn't exists`)

        const patch = {}
        if (name) patch.name = name
        if (surname) patch.surname = surname
        if (email) {
            validate.email(email)
            const existing = await repo.findUserByEmail(email)
            if (existing && existing.id !== userId) throw new LogicError(`email ${email} already registered`)
            patch.email = email
        }
        if (role) {
            assertValidRole(role)
            patch.role = role
        }
        if (companyId) {
            const company = await repo.findCompanyById(companyId)
            if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)
            patch.companyId = companyId
        }

        return repo.updateUserById(userId, patch)
    }
}

module.exports = backofficeService

const argon2 = require('argon2')
const { validate, errors: { InputError, LogicError } } = require('track-utils')
const repo = require('./backoffice.repository')
const { requireAccess } = require('../shared/authorization.service')
const { ACCESS_VERSION, encodePermissionKeys, encodeFeatureKeys, PERMISSION_KEYS, FEATURE_KEYS } = require('../shared/access-control')

const VALID_ROLES = new Set(['staff', 'owner', 'admin', 'dispatcher', 'viewer'])

function assertValidRole(role) {
    if (!VALID_ROLES.has(role)) throw new InputError(`invalid role ${role}`)
}

const backofficeService = {
    async assertStaff(requesterId) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.read' })
    },

    async listCompanies(requesterId) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.read' })
        return repo.listCompanies()
    },

    async createCompany(requesterId, { name, slug, active = true, featureKeys } = {}) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.create' })
        validate.arguments([
            { name: 'name', value: name, type: String, notEmpty: true },
            { name: 'slug', value: slug, type: String, notEmpty: true }
        ])
        if (typeof active !== 'boolean') throw new InputError('active should be a boolean')
        if (featureKeys && !Array.isArray(featureKeys)) throw new InputError('featureKeys should be an array')

        const existing = await repo.findCompanyBySlug(slug)
        if (existing) throw new LogicError(`company with slug ${slug} already exists`)

        const resolvedFeatureKeys = featureKeys && featureKeys.length > 0 ? featureKeys : FEATURE_KEYS
        return repo.createCompany({
            name,
            slug,
            active,
            featuresVersion: ACCESS_VERSION,
            featuresPacked: encodeFeatureKeys(resolvedFeatureKeys)
        })
    },

    async updateCompany(requesterId, companyId, { name, slug, active, featureKeys } = {}) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.update' })
        validate.arguments([
            { name: 'companyId', value: companyId, type: String, notEmpty: true }
        ])

        const company = await repo.findCompanyById(companyId)
        if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)

        const patch = {}
        if (name) patch.name = name
        if (typeof active === 'boolean') patch.active = active
        if (featureKeys) {
            if (!Array.isArray(featureKeys)) throw new InputError('featureKeys should be an array')
            patch.featuresVersion = ACCESS_VERSION
            patch.featuresPacked = encodeFeatureKeys(featureKeys)
        }
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
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'users.read' })
        if (companyId) {
            validate.arguments([{ name: 'companyId', value: companyId, type: String, notEmpty: true }])
            const company = await repo.findCompanyById(companyId)
            if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)
        }
        return repo.listUsers(companyId)
    },

    async createUser(requesterId, { name, surname, email, password, role, companyId, permissionKeys } = {}) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'users.create' })
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
        if (permissionKeys && !Array.isArray(permissionKeys)) throw new InputError('permissionKeys should be an array')
        const resolvedPermissionKeys = permissionKeys && permissionKeys.length > 0
            ? permissionKeys
            : (role === 'staff' ? PERMISSION_KEYS : [])

        return repo.createUser({
            name,
            surname,
            email,
            password: hash,
            role,
            companyId,
            permissionsVersion: ACCESS_VERSION,
            permissionsPacked: encodePermissionKeys(resolvedPermissionKeys)
        })
    },

    async updateUser(requesterId, userId, { name, surname, email, role, companyId, permissionKeys } = {}) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'users.update' })
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
        if (permissionKeys) {
            if (!Array.isArray(permissionKeys)) throw new InputError('permissionKeys should be an array')
            patch.permissionsVersion = ACCESS_VERSION
            patch.permissionsPacked = encodePermissionKeys(permissionKeys)
        }

        return repo.updateUserById(userId, patch)
    }
}

module.exports = backofficeService

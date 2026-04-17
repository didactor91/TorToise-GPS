const argon2 = require('argon2')
const { validate, errors: { InputError, LogicError } } = require('track-utils')
const repo = require('./backoffice.repository')
const { requireAccess } = require('../shared/authorization.service')
const { ACCESS_VERSION, encodePermissionKeys, encodeFeatureKeys, PERMISSION_KEYS, FEATURE_KEYS } = require('../shared/access-control')
const { normalizeTrackerEmoji } = require('../shared/emoji-catalog')

const VALID_ROLES = new Set(['staff', 'owner', 'admin', 'dispatcher', 'viewer'])
const VALID_LANGUAGES = new Set(['en', 'es', 'ca'])

function assertValidRole(role) {
    if (!VALID_ROLES.has(role)) throw new InputError(`invalid role ${role}`)
}

function slugifyCompanyName(name) {
    const base = String(name || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-')
    return base || 'company'
}

function shortTimestamp() {
    const d = new Date()
    const pad = (value) => String(value).padStart(2, '0')
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
}

function generateFallbackAlias() {
    return '#IS-' + (Math.floor(Math.random() * (9999 - 1000)) + 1000).toString() + '-FAKE'
}

async function buildUniqueCompanySlug(baseSlug) {
    const existing = await repo.findCompanyBySlug(baseSlug)
    if (!existing) return baseSlug

    const tsSlug = `${baseSlug}-${shortTimestamp()}`
    const existingTs = await repo.findCompanyBySlug(tsSlug)
    if (!existingTs) return tsSlug

    // Defensive fallback in the unlikely case of same-second collision.
    let attempt = 2
    let candidate = `${tsSlug}-${attempt}`
    while (await repo.findCompanyBySlug(candidate)) {
        attempt += 1
        candidate = `${tsSlug}-${attempt}`
    }
    return candidate
}

const backofficeService = {
    normalizePagination(offset = 0, limit = 20) {
        const _offset = Math.max(0, Number(offset || 0))
        const _limit = Math.max(1, Math.min(200, Number(limit || 20)))
        return { offset: _offset, limit: _limit }
    },

    async assertStaff(requesterId) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.read' })
    },

    async listCompanies(requesterId) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.read' })
        return repo.listCompanies()
    },

    async createCompany(requesterId, { name, active = true, featureKeys } = {}) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.create' })
        validate.arguments([
            { name: 'name', value: name, type: String, notEmpty: true }
        ])
        if (typeof active !== 'boolean') throw new InputError('active should be a boolean')
        if (featureKeys && !Array.isArray(featureKeys)) throw new InputError('featureKeys should be an array')

        const baseSlug = slugifyCompanyName(name)
        const resolvedSlug = await buildUniqueCompanySlug(baseSlug)

        const resolvedFeatureKeys = featureKeys && featureKeys.length > 0 ? featureKeys : FEATURE_KEYS
        return repo.createCompany({
            name,
            slug: resolvedSlug,
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

    async listUsers(requesterId, companyId = null, pagination) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'users.read' })
        if (companyId) {
            validate.arguments([{ name: 'companyId', value: companyId, type: String, notEmpty: true }])
            const company = await repo.findCompanyById(companyId)
            if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)
        }
        if (!pagination) return repo.listUsers(companyId)
        const _pagination = this.normalizePagination(pagination.offset, pagination.limit)
        return repo.listUsers(companyId, _pagination)
    },

    async countUsers(requesterId, companyId = null) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'users.read' })
        if (companyId) {
            validate.arguments([{ name: 'companyId', value: companyId, type: String, notEmpty: true }])
            const company = await repo.findCompanyById(companyId)
            if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)
        }
        return repo.countUsers(companyId)
    },

    async listTrackers(requesterId, companyId = null, pagination) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.read' })
        if (companyId) {
            validate.arguments([{ name: 'companyId', value: companyId, type: String, notEmpty: true }])
            const company = await repo.findCompanyById(companyId)
            if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)
        }
        if (!pagination) return repo.listTrackers(companyId)
        const _pagination = this.normalizePagination(pagination.offset, pagination.limit)
        return repo.listTrackers(companyId, _pagination)
    },

    async countTrackers(requesterId, companyId = null) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.read' })
        if (companyId) {
            validate.arguments([{ name: 'companyId', value: companyId, type: String, notEmpty: true }])
            const company = await repo.findCompanyById(companyId)
            if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)
        }
        return repo.countTrackers(companyId)
    },

    async retrieveTracker(requesterId, trackerId) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.read' })
        validate.arguments([{ name: 'trackerId', value: trackerId, type: String, notEmpty: true }])
        const tracker = await repo.findTrackerById(trackerId)
        if (!tracker) throw new LogicError(`tracker with id ${trackerId} doesn't exists`)
        return tracker
    },

    async createUser(requesterId, { name, surname, email, password, role, companyId, language = 'en', permissionKeys } = {}) {
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
        if (!VALID_LANGUAGES.has(language)) throw new InputError(`invalid language ${language}`)

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
            language,
            role,
            companyId,
            permissionsVersion: ACCESS_VERSION,
            permissionsPacked: encodePermissionKeys(resolvedPermissionKeys)
        })
    },

    async createTracker(requesterId, { serialNumber, alias, emoji, companyId } = {}) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.update' })
        validate.arguments([
            { name: 'serialNumber', value: serialNumber, type: String, notEmpty: true },
            { name: 'companyId', value: companyId, type: String, notEmpty: true }
        ])

        let resolvedAlias = alias
        if (!resolvedAlias || (typeof resolvedAlias === 'string' && !resolvedAlias.trim())) {
            resolvedAlias = generateFallbackAlias()
        }
        validate.arguments([
            { name: 'alias', value: resolvedAlias, type: String, notEmpty: true }
        ])
        const normalizedEmoji = normalizeTrackerEmoji(emoji)

        const company = await repo.findCompanyById(companyId)
        if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)

        const serial = await repo.findTrackerBySerial(serialNumber)
        if (serial) throw new LogicError(`Serial Number ${serialNumber} already registered`)

        if (resolvedAlias[0] !== '#') {
            const aliasTracker = await repo.findTrackerByAlias(resolvedAlias)
            if (aliasTracker) throw new LogicError(`Alias ${resolvedAlias} already registered`)
        }

        return repo.createTracker({
            companyId,
            serialNumber,
            alias: resolvedAlias,
            emoji: normalizedEmoji
        })
    },

    async updateTrackerAlias(requesterId, trackerId, alias) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.update' })
        validate.arguments([
            { name: 'trackerId', value: trackerId, type: String, notEmpty: true },
            { name: 'alias', value: alias, type: String, notEmpty: true }
        ])

        const tracker = await repo.findTrackerById(trackerId)
        if (!tracker) throw new LogicError(`tracker with id ${trackerId} doesn't exists`)

        if (alias[0] !== '#') {
            const aliasTracker = await repo.findTrackerByAlias(alias)
            if (aliasTracker && aliasTracker._id.toString() !== trackerId) {
                throw new LogicError(`Alias ${alias} already registered`)
            }
        }

        return repo.updateTrackerById(trackerId, { alias })
    },

    async updateTracker(requesterId, trackerId, { alias, emoji } = {}) {
        await requireAccess(requesterId, { feature: 'backoffice', permission: 'companies.update' })
        validate.arguments([
            { name: 'trackerId', value: trackerId, type: String, notEmpty: true }
        ])

        const tracker = await repo.findTrackerById(trackerId)
        if (!tracker) throw new LogicError(`tracker with id ${trackerId} doesn't exists`)

        const patch = {}
        if (typeof alias === 'string') {
            const trimmedAlias = alias.trim()
            if (!trimmedAlias) throw new InputError('alias should not be empty')

            if (trimmedAlias[0] !== '#') {
                const aliasTracker = await repo.findTrackerByAlias(trimmedAlias)
                if (aliasTracker && aliasTracker._id.toString() !== trackerId) {
                    throw new LogicError(`Alias ${trimmedAlias} already registered`)
                }
            }
            patch.alias = trimmedAlias
        }

        if (typeof emoji === 'string') {
            patch.emoji = normalizeTrackerEmoji(emoji)
        } else if (!patch.alias) {
            throw new InputError('nothing to update')
        }

        return repo.updateTrackerById(trackerId, patch)
    },

    async updateUser(requesterId, userId, { name, surname, email, language, role, companyId, permissionKeys } = {}) {
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
        if (language) {
            if (!VALID_LANGUAGES.has(language)) throw new InputError(`invalid language ${language}`)
            patch.language = language
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

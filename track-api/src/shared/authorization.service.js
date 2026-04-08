'use strict'

const { errors: { LogicError, UnauthorizedError } } = require('track-utils')
const { models: { User, Company } } = require('track-data')
const { ensureUserCompany } = require('./company-context')
const {
    effectiveFeatureKeysForCompany,
    effectivePermissionKeysForUser,
    hasPermission,
    isFeatureEnabled
} = require('./access-control')

async function requireAccess(userId, { feature, permission } = {}) {
    const user = await User.findById(userId)
    if (!user) throw new LogicError(`user with id ${userId} doesn't exists`)

    const companyId = await ensureUserCompany(user)
    const company = await Company.findById(companyId)
    if (!company) throw new LogicError(`company with id ${companyId} doesn't exists`)

    if (feature && !isFeatureEnabled(company, feature)) {
        throw new UnauthorizedError(`feature ${feature} is disabled for this company`)
    }

    if (permission && !hasPermission(user, permission)) {
        throw new UnauthorizedError(`missing permission ${permission}`)
    }

    return {
        user,
        company,
        permissionKeys: effectivePermissionKeysForUser(user),
        featureKeys: effectiveFeatureKeysForCompany(company)
    }
}

module.exports = { requireAccess }

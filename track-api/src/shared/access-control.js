'use strict'

const { errors: { InputError } } = require('track-utils')

const ACCESS_VERSION = 1

const FEATURE_KEYS = [
    'tracking',
    'fleet',
    'poi',
    'backoffice'
]

const PERMISSION_KEYS = [
    'tracking.read',
    'fleet.read',
    'fleet.create',
    'fleet.update',
    'fleet.delete',
    'poi.read',
    'poi.create',
    'poi.update',
    'poi.delete',
    'companies.read',
    'companies.create',
    'companies.update',
    'users.read',
    'users.create',
    'users.update',
    'users.delete'
]

const ALL_FEATURES = new Set(FEATURE_KEYS)
const ALL_PERMISSIONS = new Set(PERMISSION_KEYS)

function assertKnownKeys(keys, knownSet, kind) {
    for (const key of keys) {
        if (!knownSet.has(key)) throw new InputError(`unknown ${kind} key ${key}`)
    }
}

function packKeys(keys, catalog) {
    const bitByKey = new Map(catalog.map((key, idx) => [key, idx]))
    let mask = 0n
    for (const key of keys) {
        const bit = bitByKey.get(key)
        if (typeof bit !== 'number') throw new InputError(`unknown access key ${key}`)
        mask |= (1n << BigInt(bit))
    }
    return mask.toString(16)
}

function unpackKeys(packed, catalog) {
    if (!packed || typeof packed !== 'string') return new Set()
    let mask = 0n
    try {
        mask = BigInt(`0x${packed}`)
    } catch (_) {
        throw new InputError('invalid packed permissions/features format')
    }

    const result = new Set()
    for (let idx = 0; idx < catalog.length; idx += 1) {
        const enabled = (mask & (1n << BigInt(idx))) !== 0n
        if (enabled) result.add(catalog[idx])
    }
    return result
}

function defaultPermissionKeysForRole(role) {
    if (role === 'staff') return [...ALL_PERMISSIONS]
    if (role === 'owner' || role === 'admin') {
        return [
            'tracking.read',
            'fleet.read', 'fleet.create', 'fleet.update', 'fleet.delete',
            'poi.read', 'poi.create', 'poi.update', 'poi.delete'
        ]
    }
    if (role === 'dispatcher') {
        return [
            'tracking.read',
            'fleet.read', 'fleet.create', 'fleet.update',
            'poi.read'
        ]
    }
    return ['tracking.read', 'fleet.read', 'poi.read']
}

function defaultFeatureKeys() {
    return [...ALL_FEATURES]
}

function encodePermissionKeys(permissionKeys) {
    assertKnownKeys(permissionKeys, ALL_PERMISSIONS, 'permission')
    return packKeys(permissionKeys, PERMISSION_KEYS)
}

function decodePermissionKeys(permissionsPacked, permissionsVersion = ACCESS_VERSION) {
    if (permissionsVersion !== ACCESS_VERSION) return new Set()
    return unpackKeys(permissionsPacked, PERMISSION_KEYS)
}

function encodeFeatureKeys(featureKeys) {
    assertKnownKeys(featureKeys, ALL_FEATURES, 'feature')
    return packKeys(featureKeys, FEATURE_KEYS)
}

function decodeFeatureKeys(featuresPacked, featuresVersion = ACCESS_VERSION) {
    if (featuresVersion !== ACCESS_VERSION) return new Set()
    return unpackKeys(featuresPacked, FEATURE_KEYS)
}

function effectivePermissionKeysForUser(user) {
    const explicit = decodePermissionKeys(user.permissionsPacked, user.permissionsVersion || ACCESS_VERSION)
    if (explicit.size > 0) return explicit
    const roleDefaults = defaultPermissionKeysForRole(user.role || 'viewer')
    return new Set(roleDefaults)
}

function effectiveFeatureKeysForCompany(company) {
    const explicit = decodeFeatureKeys(company.featuresPacked, company.featuresVersion || ACCESS_VERSION)
    if (explicit.size > 0) return explicit
    return new Set(defaultFeatureKeys())
}

function hasPermission(user, permissionKey) {
    assertKnownKeys([permissionKey], ALL_PERMISSIONS, 'permission')
    return effectivePermissionKeysForUser(user).has(permissionKey)
}

function isFeatureEnabled(company, featureKey) {
    assertKnownKeys([featureKey], ALL_FEATURES, 'feature')
    return effectiveFeatureKeysForCompany(company).has(featureKey)
}

module.exports = {
    ACCESS_VERSION,
    FEATURE_KEYS,
    PERMISSION_KEYS,
    encodePermissionKeys,
    decodePermissionKeys,
    encodeFeatureKeys,
    decodeFeatureKeys,
    effectivePermissionKeysForUser,
    effectiveFeatureKeysForCompany,
    hasPermission,
    isFeatureEnabled
}

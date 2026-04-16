const {
    ACCESS_VERSION,
    encodePermissionKeys,
    decodePermissionKeys,
    encodeFeatureKeys,
    decodeFeatureKeys,
    effectivePermissionKeysForUser,
    effectiveFeatureKeysForCompany,
    hasPermission,
    isFeatureEnabled
} = require('./access-control')
const { errors: { InputError } } = require('track-utils')

describe('access-control', () => {
    it('encodes and decodes permission keys', () => {
        const packed = encodePermissionKeys(['fleet.read', 'fleet.create', 'users.update'])
        const decoded = decodePermissionKeys(packed, ACCESS_VERSION)

        expect(decoded.has('fleet.read')).toBeTruthy()
        expect(decoded.has('fleet.create')).toBeTruthy()
        expect(decoded.has('users.update')).toBeTruthy()
        expect(decoded.has('poi.delete')).toBeFalsy()
    })

    it('encodes and decodes feature keys', () => {
        const packed = encodeFeatureKeys(['tracking', 'backoffice'])
        const decoded = decodeFeatureKeys(packed, ACCESS_VERSION)

        expect(decoded.has('tracking')).toBeTruthy()
        expect(decoded.has('backoffice')).toBeTruthy()
        expect(decoded.has('poi')).toBeFalsy()
    })

    it('falls back to role defaults when user has no explicit permissions', () => {
        const adminSet = effectivePermissionKeysForUser({ role: 'admin', permissionsPacked: '' })
        expect(adminSet.has('fleet.create')).toBeTruthy()
        expect(adminSet.has('users.create')).toBeFalsy()
    })

    it('falls back to all features when company has no explicit feature set', () => {
        const set = effectiveFeatureKeysForCompany({ featuresPacked: '' })
        expect(set.has('tracking')).toBeTruthy()
        expect(set.has('fleet')).toBeTruthy()
        expect(set.has('poi')).toBeTruthy()
    })

    it('returns empty set when version does not match ACCESS_VERSION', () => {
        const packed = encodePermissionKeys(['fleet.read'])
        const decoded = decodePermissionKeys(packed, ACCESS_VERSION + 1)
        expect(decoded.size).toBe(0)
    })

    it('throws InputError when encoding unknown permission key', () => {
        expect(() => encodePermissionKeys(['fleet.read', 'unknown.permission']))
            .toThrow(InputError)
    })

    it('throws InputError when decoding invalid packed value', () => {
        expect(() => decodeFeatureKeys('not-hex', ACCESS_VERSION))
            .toThrow(InputError)
    })

    it('uses explicit packed permissions over role defaults when present', () => {
        const packed = encodePermissionKeys(['users.read'])
        const set = effectivePermissionKeysForUser({
            role: 'viewer',
            permissionsPacked: packed,
            permissionsVersion: ACCESS_VERSION
        })

        expect(set.has('users.read')).toBeTruthy()
        expect(set.has('tracking.read')).toBeFalsy()
    })

    it('hasPermission and isFeatureEnabled validate unknown keys', () => {
        expect(() => hasPermission({ role: 'viewer' }, 'bad.permission'))
            .toThrow(InputError)
        expect(() => isFeatureEnabled({}, 'bad.feature'))
            .toThrow(InputError)
    })
})

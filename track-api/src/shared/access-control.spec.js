const {
    ACCESS_VERSION,
    encodePermissionKeys,
    decodePermissionKeys,
    encodeFeatureKeys,
    decodeFeatureKeys,
    effectivePermissionKeysForUser,
    effectiveFeatureKeysForCompany
} = require('./access-control')

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
})

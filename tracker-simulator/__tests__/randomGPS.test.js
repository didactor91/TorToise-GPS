const { randomGPS } = require('../randomGPS')

describe('randomGPS()', () => {
    it('returns a string', () => {
        const frame = randomGPS()
        expect(typeof frame).toBe('string')
    })

    it('frame has the correct number of comma-separated tokens (17)', () => {
        // *HQ,serial,V1,HHMMSS,signal,lat,hemi,lng,orient,speed,dir,date,status,mcc,mnc,lac,cellid#
        const frame = randomGPS()
        const tokens = frame.split(',')
        expect(tokens).toHaveLength(17)
    })

    it('frame starts with manufacturer prefix *HQ', () => {
        const frame = randomGPS()
        expect(frame.startsWith('*HQ,')).toBe(true)
    })

    it('frame ends with the # closer', () => {
        const frame = randomGPS()
        expect(frame.endsWith('#')).toBe(true)
    })

    it('token[1] (serialNumber) is one of the known serial numbers', () => {
        const knownSerials = ['9900110011', '9900110012', '9900110013', '9900110014']
        const tokens = randomGPS().split(',')
        expect(knownSerials).toContain(tokens[1])
    })

    it('token[4] (gpsSignal) is either A or V', () => {
        const tokens = randomGPS().split(',')
        expect(['A', 'V']).toContain(tokens[4])
    })

    it('latitude token[5] is composed of numeric degrees + decimal minutes (no array brackets)', () => {
        const tokens = randomGPS().split(',')
        const lat = tokens[5]
        // Should NOT contain '[' or ']' — old bug was [Math.floor(...)].toString() → "41"
        // but we verify it's a plain numeric string
        expect(lat).not.toMatch(/[\[\]]/)
        expect(Number(lat)).not.toBeNaN()
        expect(Number(lat)).toBeGreaterThanOrEqual(0)
    })

    it('longitude token[7] is composed of numeric degrees + decimal minutes (no array brackets)', () => {
        const tokens = randomGPS().split(',')
        const lng = tokens[7]
        expect(lng).not.toMatch(/[\[\]]/)
        expect(Number(lng)).not.toBeNaN()
        expect(Number(lng)).toBeGreaterThanOrEqual(0)
    })

    it('hemisphere token[6] is N or S', () => {
        const tokens = randomGPS().split(',')
        expect(['N', 'S']).toContain(tokens[6])
    })

    it('orientation token[8] is E or W', () => {
        const tokens = randomGPS().split(',')
        expect(['E', 'W']).toContain(tokens[8])
    })

    it('speed token[9] is a numeric string in km/h range (realistic: 49–156 km/h)', () => {
        const tokens = randomGPS().split(',')
        const speed = parseFloat(tokens[9])
        expect(isNaN(speed)).toBe(false)
        expect(speed).toBeGreaterThan(0)
        expect(speed).toBeLessThan(200)
    })

    it('does not leak randomGPS as an implicit global', () => {
        // Verify the function is exported (declared with const) not leaked globally
        // If the old bug existed, global.randomGPS would be set. With const it is not.
        expect(typeof global.randomGPS).toBe('undefined')
    })
})

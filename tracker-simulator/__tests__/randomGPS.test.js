const { simulateGPSInRoute } = require('../randomGPS')

describe('simulateGPSInRoute()', () => {
    it('returns a string', () => {
        const frame = simulateGPSInRoute()
        expect(typeof frame).toBe('string')
    })

    it('frame has the correct number of comma-separated tokens (17)', () => {
        // *HQ,serial,V1,HHMMSS,signal,lat,hemi,lng,orient,speed,dir,date,status,mcc,mnc,lac,cellid#
        const frame = simulateGPSInRoute()
        const tokens = frame.split(',')
        expect(tokens).toHaveLength(17)
    })

    it('frame starts with manufacturer prefix *HQ', () => {
        const frame = simulateGPSInRoute()
        expect(frame.startsWith('*HQ,')).toBe(true)
    })

    it('frame ends with the # closer', () => {
        const frame = simulateGPSInRoute()
        expect(frame.endsWith('#')).toBe(true)
    })

    it('token[1] (serialNumber) is one of the known serial numbers', () => {
        const knownSerials = ['9900110011', '9900110012', '9900110013', '9900110014']
        const tokens = simulateGPSInRoute().split(',')
        expect(knownSerials).toContain(tokens[1])
    })

    it('token[4] (gpsSignal) is either A or V', () => {
        const tokens = simulateGPSInRoute().split(',')
        expect(['A', 'V']).toContain(tokens[4])
    })

    it('latitude token[5] is composed of numeric degrees + decimal minutes (no array brackets)', () => {
        const tokens = simulateGPSInRoute().split(',')
        const lat = tokens[5]
        // Should NOT contain '[' or ']' — old bug was [Math.floor(...)].toString() → "41"
        // but we verify it's a plain numeric string
        expect(lat).not.toMatch(/[\[\]]/)
        expect(Number(lat)).not.toBeNaN()
        expect(Number(lat)).toBeGreaterThanOrEqual(0)
    })

    it('longitude token[7] is composed of numeric degrees + decimal minutes (no array brackets)', () => {
        const tokens = simulateGPSInRoute().split(',')
        const lng = tokens[7]
        expect(lng).not.toMatch(/[\[\]]/)
        expect(Number(lng)).not.toBeNaN()
        expect(Number(lng)).toBeGreaterThanOrEqual(0)
    })

    it('hemisphere token[6] is N or S', () => {
        const tokens = simulateGPSInRoute().split(',')
        expect(['N', 'S']).toContain(tokens[6])
    })

    it('orientation token[8] is E or W', () => {
        const tokens = simulateGPSInRoute().split(',')
        expect(['E', 'W']).toContain(tokens[8])
    })

    it('speed token[9] is a numeric string in km/h range (including stop state)', () => {
        const tokens = simulateGPSInRoute().split(',')
        const speed = parseFloat(tokens[9])
        expect(isNaN(speed)).toBe(false)
        expect(speed).toBeGreaterThanOrEqual(0)
        expect(speed).toBeLessThan(200)
    })

    it('direction token[10] is a heading between 000 and 359', () => {
        const tokens = simulateGPSInRoute().split(',')
        const heading = parseInt(tokens[10], 10)
        expect(isNaN(heading)).toBe(false)
        expect(heading).toBeGreaterThanOrEqual(0)
        expect(heading).toBeLessThan(360)
    })

    it('vehicle status token[12] is ON or OFF code', () => {
        const tokens = simulateGPSInRoute().split(',')
        expect(['FFFF9FFF', 'FFFFBBFF']).toContain(tokens[12])
    })

    it('when vehicle status is OFF, speed is always 0', () => {
        for (let i = 0; i < 1000; i++) {
            const tokens = simulateGPSInRoute().split(',')
            const speed = parseFloat(tokens[9])
            const status = tokens[12]
            if (status === 'FFFFBBFF') {
                expect(speed).toBe(0)
            }
        }
    })

    it('does not leak simulateGPSInRoute as an implicit global', () => {
        // Verify the function is exported (declared with const) not leaked globally
        expect(typeof global.simulateGPSInRoute).toBe('undefined')
    })
})

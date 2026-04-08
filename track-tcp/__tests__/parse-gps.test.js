const { parseGPSFrame } = require('../parse-gps')

// Helper: builds a minimal valid frame
// *HQ,serial,V1,HHMMSS,validState,lat,hemi,lng,orient,speed,dir,date,vehicleStatus,...#
function buildFrame({
    serial = '9900110011',
    validState = 'A',
    rawLat = '41.3902',    // degrees=41, minutes=0.3902
    hemi = 'N',
    rawLng = '002.1540',   // degrees=002, minutes=0.1540
    orient = 'E',
    speed = '090.80',
    vehicleStatus = 'FFFF9FFF'  // chars [4-5] = '9F' → ON
} = {}) {
    return `*HQ,${serial},V1,120000,${validState},${rawLat},${hemi},${rawLng},${orient},${speed},208,080426,${vehicleStatus},214,03,2126,1860#`
}

describe('parseGPSFrame()', () => {
    it('parses a valid North/East frame correctly', () => {
        const frame = buildFrame()
        const data = parseGPSFrame(frame)

        expect(data.serialNumber).toBe('9900110011')
        expect(data.validState).toBe('A')
        expect(data.hemisfere).toBe('N')
        expect(data.orientation).toBe('E')
        // lat should be positive (N)
        expect(data.lat).toBeGreaterThan(0)
        // lng should be positive (E)
        expect(data.lng).toBeGreaterThan(0)
        expect(data.speed).toBe(90.8)
    })

    it('negates latitude when hemisphere is S', () => {
        const frame = buildFrame({ hemi: 'S' })
        const data = parseGPSFrame(frame)
        expect(data.lat).toBeLessThan(0)
    })

    it('negates longitude when orientation is W', () => {
        const frame = buildFrame({ orient: 'W' })
        const data = parseGPSFrame(frame)
        expect(data.lng).toBeLessThan(0)
    })

    it('negates both lat and lng for South/West', () => {
        const frame = buildFrame({ hemi: 'S', orient: 'W' })
        const data = parseGPSFrame(frame)
        expect(data.lat).toBeLessThan(0)
        expect(data.lng).toBeLessThan(0)
    })

    it('maps vehicleStatus chars [4-5] === "9F" to status ON', () => {
        const frame = buildFrame({ vehicleStatus: 'FFFF9FFF' })
        expect(parseGPSFrame(frame).status).toBe('ON')
    })

    it('maps vehicleStatus chars [4-5] !== "9F" to status OFF', () => {
        const frame = buildFrame({ vehicleStatus: 'FFFFBBFF' })
        expect(parseGPSFrame(frame).status).toBe('OFF')
    })

    it('throws when validState is V (invalid GPS signal)', () => {
        const frame = buildFrame({ validState: 'V' })
        expect(() => parseGPSFrame(frame)).toThrow('Invalid GPS frame: validState is not A')
    })

    it('throws when the frame has fewer than 13 tokens', () => {
        expect(() => parseGPSFrame('*HQ,9900110011,V1,120000')).toThrow('Invalid GPS frame')
    })

    it('throws when critical tokens are empty', () => {
        // token[5] (rawLat) is empty
        const frame = '*HQ,9900110011,V1,120000,A,,N,002.1540,E,090.80,208,080426,FFFF9FFF,214,03,2126,1860#'
        expect(() => parseGPSFrame(frame)).toThrow('Invalid GPS frame')
    })

    it('accepts a Buffer as input (coerces to string)', () => {
        const frame = buildFrame()
        const data = parseGPSFrame(Buffer.from(frame))
        expect(data.serialNumber).toBe('9900110011')
    })
})

/**
 * parseGPSFrame — extracts GPS data from a raw NMEA-like TCP frame.
 *
 * Frame format (comma-separated, 17 tokens):
 *   [0]  *HQ
 *   [1]  serialNumber
 *   [2]  version
 *   [3]  clock (HHMMSS)
 *   [4]  validState (A=valid, V=invalid)
 *   [5]  rawLatitude  (DDMM.MMMM)
 *   [6]  hemisphere   (N/S)
 *   [7]  rawLongitude (DDDMM.MMMM)
 *   [8]  orientation  (E/W)
 *   [9]  speed
 *   [10] direction
 *   [11] date (DDMMYY)
 *   [12] vehicleStatus (e.g. FFFF9FFF — chars 4-5 === '9F' means ON)
 *   ...
 *
 * Returns a GPS data object, or throws an Error if the frame is invalid.
 */
function parseGPSFrame(raw) {
    const tokens = (typeof raw === 'string' ? raw : raw.toString()).split(',')

    if (tokens.length < 13 || !tokens[5] || !tokens[7] || !tokens[12]) {
        throw new Error('Invalid GPS frame: missing required tokens')
    }

    const latDegrees = Number(tokens[5].slice(0, 2))
    const latMinutes = Number(tokens[5].slice(2)) / 60
    const lngDegrees = Number(tokens[7].slice(0, 3))
    const lngMinutes = Number(tokens[7].slice(3)) / 60

    const latitude = Number((latDegrees + latMinutes).toFixed(6))
    const longitude = Number((lngDegrees + lngMinutes).toFixed(6))

    const status = tokens[12].slice(4, 6) === '9F' ? 'ON' : 'OFF'

    const gpsData = {
        serialNumber: tokens[1],
        validState: tokens[4],
        lat: latitude,
        hemisfere: tokens[6],
        lng: longitude,
        orientation: tokens[8],
        speed: Number(tokens[9]),
        status
    }

    if (gpsData.validState === 'A') {
        if (gpsData.hemisfere === 'S') gpsData.lat = gpsData.lat * -1
        if (gpsData.orientation === 'W') gpsData.lng = gpsData.lng * -1
    } else {
        throw new Error('Invalid GPS frame: validState is not A')
    }

    return gpsData
}

module.exports = { parseGPSFrame }

const net = require('net')
const call = require('track-utils/call')
const { parseGPSFrame } = require('./parse-gps')

const port = Number(process.env.TCP_PORT) || 5000
const apiUrl = process.env.API_URL || 'http://localhost:8080/api'

const server = net.createServer()

server.on('connection', function (socket) {
    socket.on('data', async function (chunk) {
        try {
            const gpsData = parseGPSFrame(chunk.toString())

            await call(`${apiUrl}/tracks/TCP/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: {
                    serialNumber: gpsData.serialNumber,
                    latitude: gpsData.lat,
                    longitude: gpsData.lng,
                    speed: gpsData.speed,
                    status: gpsData.status
                }
            })

            console.log('-> OK')
        } catch (err) {
            console.error('Ingestion error:', err.message)
        }
    })
})

server.on('close', function () {
    console.log('Server Closed !')
})

// Only start listening when run directly (not when imported in tests)
if (require.main === module) {
    server.listen(port, function () {
        console.log('Server listening on port: ' + port)
    })
}

module.exports = server

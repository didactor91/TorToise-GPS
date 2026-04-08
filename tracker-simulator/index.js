require('dotenv').config()
const net = require('net')
const { randomGPS } = require('./randomGPS')

const port = Number(process.env.TCP_PORT) || 5000
const host = process.env.TCP_HOST || '127.0.0.1'
const INTERVAL_MS = 3000 // 3 seconds — one truck frame per tick, 4 trucks = 12s full cycle

const client = new net.Socket()

client.connect(port, host, function () {
    console.log(`[simulator] Connected to TCP server at ${host}:${port}`)
    console.log('[simulator] Sending GPS frames every 3s (4 trucks, rotating)...')

    setInterval(() => {
        const frame = randomGPS()
        const sn = frame.split(',')[1]
        client.write(frame)
        console.log(`[simulator] -> SN:${sn} | ${frame.substring(0, 60)}...`)
    }, INTERVAL_MS)
})

client.on('close', function () {
    console.log('[simulator] Connection closed')
})

client.on('error', function (err) {
    console.error('[simulator] Connection error:', err.message)
})

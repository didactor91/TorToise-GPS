require('dotenv').config()
const fs = require('fs')
const net = require('net')
const { simulateGPSInRoute, TRUCK_COUNT } = require('./randomGPS')

const port = Number(process.env.TCP_PORT) || 5000
const host = process.env.TCP_HOST || '127.0.0.1'
const INTERVAL_MS = 3000 // 3 seconds full fleet cycle
const SEND_GAP_MS = Math.max(10, Math.floor(INTERVAL_MS / Math.max(TRUCK_COUNT, 1)))
const RECONNECT_MS = 3000
const HEARTBEAT_FILE = process.env.SIM_HEARTBEAT_FILE || '/tmp/tortoise-sim-heartbeat'

const client = new net.Socket()
client.setKeepAlive(true, 10_000)

let senderInterval = null
let reconnectTimer = null
let staggerTimer = null
let connected = false

function writeHeartbeat() {
    try {
        fs.writeFileSync(HEARTBEAT_FILE, Date.now().toString())
    } catch {
        // best effort only
    }
}

function stopSending() {
    if (senderInterval) {
        clearInterval(senderInterval)
        senderInterval = null
    }
    if (staggerTimer) {
        clearTimeout(staggerTimer)
        staggerTimer = null
    }
}

function sendOneFrame() {
    if (!connected) return

    const frame = simulateGPSInRoute()
    const sn = frame.split(',')[1]
    client.write(frame, (err) => {
        if (err) return console.error('[simulator] Write error:', err.message)
        writeHeartbeat()
        console.log(`[simulator] -> SN:${sn} | ${frame.substring(0, 60)}...`)
    })
}

function sendFleetCycleStaggered() {
    let sent = 0

    const step = () => {
        if (!connected || sent >= TRUCK_COUNT) {
            staggerTimer = null
            return
        }

        sendOneFrame()
        sent++
        staggerTimer = setTimeout(step, SEND_GAP_MS)
    }

    step()
}

function startSending() {
    if (senderInterval) return

    sendFleetCycleStaggered()
    senderInterval = setInterval(sendFleetCycleStaggered, INTERVAL_MS)
}

function scheduleReconnect() {
    if (reconnectTimer) return
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
    }, RECONNECT_MS)
}

function connect() {
    if (connected) return
    console.log(`[simulator] Connecting to TCP server at ${host}:${port}...`)
    client.connect(port, host)
}

client.on('connect', function () {
    connected = true
    console.log(`[simulator] Connected to TCP server at ${host}:${port}`)
    console.log(
        `[simulator] Sending staggered GPS frames (${TRUCK_COUNT} trucks / ${INTERVAL_MS}ms cycle / gap ${SEND_GAP_MS}ms)...`
    )
    writeHeartbeat()
    startSending()
})

client.on('close', function () {
    connected = false
    stopSending()
    console.log('[simulator] Connection closed')
    scheduleReconnect()
})

client.on('error', function (err) {
    console.error('[simulator] Connection error:', err.message)
    connected = false
    scheduleReconnect()
})

connect()

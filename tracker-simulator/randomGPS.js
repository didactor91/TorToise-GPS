'use strict'

/**
 * Realistic GPS simulator for 4 trucks driving on European road routes.
 *
 * Each truck follows a predefined waypoint route (real road coordinates).
 * Between waypoints the truck interpolates smoothly, simulating actual movement.
 * Speed varies realistically (motorway, urban, stop).
 */

// ── Real European road routes (lat, lng waypoints) ────────────────────────────
// Each route is a sequence of real road coordinates the truck passes through.
const ROUTES = [
    {
        // Truck 1: Madrid → Barcelona (A-2 motorway)
        serialNumber: '9900110011',
        licensePlate: '1234-ABC-001',
        waypoints: [
            [40.4168, -3.7038],   // Madrid
            [40.4600, -3.3700],   // A-2 salida Alcalá
            [40.5200, -2.8500],   // Guadalajara
            [40.6200, -2.1500],   // Brihuega area
            [40.7800, -1.5300],   // Calatayud
            [41.2000, -0.8800],   // Ricla
            [41.3900, -0.4100],   // Zaragoza
            [41.5200,  0.3500],   // Lleida
            [41.6600,  1.0800],   // Cervera
            [41.6600,  1.9000],   // Igualada
            [41.3879,  2.1699],   // Barcelona
        ]
    },
    {
        // Truck 2: Paris → Lyon (A6 motorway)
        serialNumber: '9900110012',
        licensePlate: '1234-ABC-002',
        waypoints: [
            [48.8566,  2.3522],   // Paris
            [48.6000,  2.4300],   // Évry
            [48.3600,  2.7000],   // Fontainebleau
            [47.9800,  2.9800],   // Sens
            [47.7000,  3.5500],   // Auxerre
            [47.0500,  4.0500],   // Beaune
            [46.7200,  4.8300],   // Chalon-sur-Saône
            [46.3000,  4.8300],   // Mâcon
            [45.7640,  4.8357],   // Lyon
        ]
    },
    {
        // Truck 3: Barcelona → Valencia (AP-7 coast road)
        serialNumber: '9900110013',
        licensePlate: '1234-ABC-003',
        waypoints: [
            [41.3879,  2.1699],   // Barcelona
            [41.1800,  1.8300],   // Tarragona area
            [41.0500,  1.1800],   // Tarragona
            [40.7100,  0.5500],   // Tortosa
            [40.4000, -0.0800],   // Vinaròs
            [39.9800, -0.0500],   // Castellón de la Plana
            [39.4699, -0.3763],   // Valencia
        ]
    },
    {
        // Truck 4: Madrid → Sevilla (A-4 motorway)
        serialNumber: '9900110014',
        licensePlate: '1234-ABC-004',
        waypoints: [
            [40.4168, -3.7038],   // Madrid
            [39.8600, -3.9200],   // Aranjuez
            [39.3700, -4.0200],   // Madridejos
            [38.6900, -3.8500],   // Linares area
            [38.0000, -4.0000],   // Andújar
            [37.8800, -4.7800],   // Córdoba
            [37.5400, -5.0000],   // Écija
            [37.3891, -5.9845],   // Sevilla
        ]
    }
]

// ── Truck state ───────────────────────────────────────────────────────────────

const trucks = ROUTES.map(route => ({
    serialNumber: route.serialNumber,
    waypointIndex: 0,
    progress: Math.random(),       // start at random point in first segment
    // Speed in km/h — varies per truck to desynchronize them
    speedKmh: 80 + Math.floor(Math.random() * 40),
    waypoints: route.waypoints
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function lerp(a, b, t) {
    return a + (b - a) * t
}

function distanceKm(a, b) {
    // Haversine — approximate km between two [lat,lng] points
    const R = 6371
    const dLat = (b[0] - a[0]) * Math.PI / 180
    const dLng = (b[1] - a[1]) * Math.PI / 180
    const sinLat = Math.sin(dLat / 2)
    const sinLng = Math.sin(dLng / 2)
    const chord = sinLat * sinLat +
        Math.cos(a[0] * Math.PI / 180) *
        Math.cos(b[0] * Math.PI / 180) *
        sinLng * sinLng
    return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
}

function formatDDMM(degrees) {
    // Convert decimal degrees to DDMM.MMMM format
    const d = Math.floor(Math.abs(degrees))
    const m = (Math.abs(degrees) - d) * 60
    return d.toString().padStart(2, '0') + m.toFixed(4).padStart(7, '0')
}

function formatDDDMM(degrees) {
    // Convert decimal degrees to DDDMM.MMMM format (longitude — 3-digit degrees)
    const d = Math.floor(Math.abs(degrees))
    const m = (Math.abs(degrees) - d) * 60
    return d.toString().padStart(3, '0') + m.toFixed(4).padStart(7, '0')
}

function clock() {
    const d = new Date()
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map(n => n.toString().padStart(2, '0')).join('')
}

function date() {
    const d = new Date()
    return [d.getDate(), d.getMonth() + 1, d.getFullYear().toString().slice(2)]
        .map(n => n.toString().padStart(2, '0')).join('')
}

// ── Advance a truck along its route by `intervalSeconds` ─────────────────────

const INTERVAL_SECONDS = 3  // called every 3 seconds

function advanceTruck(truck) {
    const waypoints = truck.waypoints
    const from = waypoints[truck.waypointIndex]
    const to = waypoints[truck.waypointIndex + 1] || waypoints[0]

    const segmentKm = distanceKm(from, to)

    // Vary speed realistically: slow down near endpoints, occasional traffic
    const trafficFactor = 0.7 + Math.random() * 0.6   // 0.7–1.3
    const effectiveSpeed = truck.speedKmh * trafficFactor
    const progressPerInterval = (effectiveSpeed / 3600) * INTERVAL_SECONDS / segmentKm

    truck.progress += progressPerInterval

    // Advance to next waypoint when segment complete
    if (truck.progress >= 1) {
        truck.progress = truck.progress - 1
        truck.waypointIndex++

        // Loop back to start when route complete, with a pause simulation
        if (truck.waypointIndex >= waypoints.length - 1) {
            truck.waypointIndex = 0
            truck.progress = 0
            // Change speed slightly for next loop
            truck.speedKmh = 70 + Math.floor(Math.random() * 50)
        }
    }

    const lat = lerp(from[0], to[0], truck.progress)
    const lng = lerp(from[1], to[1], truck.progress)

    return { lat, lng, speed: effectiveSpeed }
}

// ── Public API — one call per truck per interval ──────────────────────────────

let truckIndex = 0   // rotate through trucks so each gets a frame per interval

const randomGPS = () => {
    const truck = trucks[truckIndex % trucks.length]
    truckIndex++

    const { lat, lng, speed } = advanceTruck(truck)

    const hemisphere = lat >= 0 ? 'N' : 'S'
    const orientation = lng >= 0 ? 'E' : 'W'

    const rawLat = formatDDMM(lat)
    const rawLng = formatDDDMM(lng)
    const speedStr = speed.toFixed(2).padStart(6, '0')

    // vehicle_status: FFFFBBFF = OFF, FFFF9FFF = ON (always ON for simulation)
    const vehicleStatus = 'FFFF9FFF'

    const message = [
        '*HQ',
        truck.serialNumber,
        'V1',
        clock(),
        'A',              // validState: always valid
        rawLat,
        hemisphere,
        rawLng,
        orientation,
        speedStr,
        '208',            // direction (heading)
        date(),
        vehicleStatus,
        '214',            // net_mcc
        '03',             // net_mnc
        '2126',           // net_lac
        '1860#'           // net_cellid + closer
    ].join(',')

    return message
}

module.exports = { randomGPS }

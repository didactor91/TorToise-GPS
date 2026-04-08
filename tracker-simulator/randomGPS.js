'use strict'
const routeDataset = require('./routes.osrm.half.json')

/**
 * Realistic GPS simulator for 4 trucks driving on European road routes.
 *
 * Each truck follows a predefined waypoint route (real road coordinates).
 * Between waypoints the truck interpolates smoothly, simulating actual movement.
 * Speed varies realistically (motorway, urban, stop), including long rests.
 */

// ── Real European routes loaded from OSRM dataset ─────────────────────────────
const TRUCK_ASSIGNMENTS = [
    { serialNumber: '9900110011', licensePlate: '1234-ABC-001', routeId: 'route-001' }, // Paris-Lyon
    { serialNumber: '9900110012', licensePlate: '1234-ABC-002', routeId: 'route-002' }, // Madrid-Barcelona
    { serialNumber: '9900110013', licensePlate: '1234-ABC-003', routeId: 'route-003' }, // Barcelona-Valencia
    { serialNumber: '9900110014', licensePlate: '1234-ABC-004', routeId: 'route-004' }, // Madrid-Sevilla
]

function buildRestStopIndexes(pointCount) {
    // Define plausible long-rest points distributed along the route.
    const fractions = [0.2, 0.4, 0.6, 0.8]
    const indexes = fractions
        .map(f => Math.round((pointCount - 1) * f))
        .filter(i => i > 0 && i < pointCount - 1)
    return [...new Set(indexes)]
}

const routesById = new Map(routeDataset.routes.map(route => [route.id, route]))

const ROUTES = TRUCK_ASSIGNMENTS.map(truck => {
    const datasetRoute = routesById.get(truck.routeId)
    if (!datasetRoute || !Array.isArray(datasetRoute.waypoints) || datasetRoute.waypoints.length < 2) {
        throw new Error(`Invalid or missing route dataset for id: ${truck.routeId}`)
    }

    return {
        serialNumber: truck.serialNumber,
        licensePlate: truck.licensePlate,
        routeName: datasetRoute.name,
        restStopIndexes: buildRestStopIndexes(datasetRoute.waypoints.length),
        waypoints: datasetRoute.waypoints
    }
})

// ── Truck state ───────────────────────────────────────────────────────────────

const trucks = ROUTES.map(route => ({
    serialNumber: route.serialNumber,
    waypointIndex: 0,
    direction: 1, // 1 => outbound, -1 => return on same path
    progress: Math.random(),       // start at random point in first segment
    // Speed in km/h — varies per truck to desynchronize them
    speedKmh: 80 + Math.floor(Math.random() * 40),
    ticksSinceLongRest: 0,
    nextLongRestAfterTicks: 30 + Math.floor(Math.random() * 61), // 6–18 min
    longRestTicksRemaining: 0,
    stopTicksRemaining: 0,
    heading: Math.floor(Math.random() * 360),
    restStopIndexes: route.restStopIndexes,
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

function bearingDeg(from, to) {
    const lat1 = from[0] * Math.PI / 180
    const lat2 = to[0] * Math.PI / 180
    const dLng = (to[1] - from[1]) * Math.PI / 180
    const y = Math.sin(dLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
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

function randomLongRestThresholdTicks() {
    // Per-truck threshold for next long rest (one frame per truck every 12s).
    return 30 + Math.floor(Math.random() * 61) // 30–90 ticks => ~6–18 min
}

function randomLongRestDurationTicks() {
    return 10 + Math.floor(Math.random() * 31) // 10–40 ticks => ~2–8 min
}

function isRestWaypoint(truck) {
    return truck.restStopIndexes.includes(truck.waypointIndex)
}

function currentSegment(truck) {
    const waypoints = truck.waypoints
    const fromIndex = truck.waypointIndex
    const toIndex = fromIndex + truck.direction
    return {
        from: waypoints[fromIndex],
        to: waypoints[toIndex],
        fromIndex,
        toIndex
    }
}

// ── Advance a truck along its route by `intervalSeconds` ─────────────────────

const INTERVAL_SECONDS = 3  // called every 3 seconds

function advanceTruck(truck) {
    const waypoints = truck.waypoints
    let { from, to } = currentSegment(truck)

    // Long rest: parked engine OFF for several ticks.
    if (truck.longRestTicksRemaining > 0) {
        truck.longRestTicksRemaining--
        const lat = lerp(from[0], to[0], truck.progress)
        const lng = lerp(from[1], to[1], truck.progress)
        return { lat, lng, speed: 0, heading: truck.heading, isOff: true }
    }

    // Random short stops (traffic light/loading): 1–4 ticks
    if (truck.stopTicksRemaining === 0 && Math.random() < 0.08) {
        truck.stopTicksRemaining = 1 + Math.floor(Math.random() * 4)
    }

    if (truck.stopTicksRemaining > 0) {
        truck.stopTicksRemaining--
        const lat = lerp(from[0], to[0], truck.progress)
        const lng = lerp(from[1], to[1], truck.progress)
        return { lat, lng, speed: 0, heading: truck.heading, isOff: false }
    }

    // Vary speed realistically: traffic + slight slowdowns near segment ends
    const trafficFactor = 0.7 + Math.random() * 0.6   // 0.7–1.3
    const endSlowdownFactor = truck.progress > 0.85 ? 0.75 : 1
    const effectiveSpeed = truck.speedKmh * trafficFactor * endSlowdownFactor
    let travelKm = (effectiveSpeed / 3600) * INTERVAL_SECONDS

    // Move across one or more segments while preserving continuity.
    while (travelKm > 0) {
        ;({ from, to } = currentSegment(truck))
        const segmentKm = Math.max(distanceKm(from, to), 0.001)
        const remainingKm = segmentKm * (1 - truck.progress)

        if (travelKm >= remainingKm) {
            travelKm -= remainingKm
            truck.waypointIndex = truck.waypointIndex + truck.direction
            truck.progress = 0

            // Reverse direction at route endpoints to simulate round trip.
            if (truck.waypointIndex >= waypoints.length - 1) {
                truck.waypointIndex = waypoints.length - 1
                truck.direction = -1
                truck.speedKmh = 70 + Math.floor(Math.random() * 50)
            } else if (truck.waypointIndex <= 0) {
                truck.waypointIndex = 0
                truck.direction = 1
                truck.speedKmh = 70 + Math.floor(Math.random() * 50)
            }

            // Long rests only make sense at known rest waypoints.
            if (
                isRestWaypoint(truck) &&
                truck.ticksSinceLongRest >= truck.nextLongRestAfterTicks
            ) {
                truck.longRestTicksRemaining = randomLongRestDurationTicks()
                truck.ticksSinceLongRest = 0
                truck.nextLongRestAfterTicks = randomLongRestThresholdTicks()
                break
            }
        } else {
            truck.progress += travelKm / segmentKm
            travelKm = 0
        }
    }

    ;({ from, to } = currentSegment(truck))
    truck.heading = Math.round(bearingDeg(from, to))

    const lat = lerp(from[0], to[0], truck.progress)
    const lng = lerp(from[1], to[1], truck.progress)

    truck.ticksSinceLongRest++

    return { lat, lng, speed: effectiveSpeed, heading: truck.heading, isOff: false }
}

// ── Public API — one call per truck per interval ──────────────────────────────

let truckIndex = 0   // rotate through trucks so each gets a frame per interval

const simulateGPSInRoute = () => {
    const truck = trucks[truckIndex % trucks.length]
    truckIndex++

    const { lat, lng, speed, heading, isOff } = advanceTruck(truck)

    const hemisphere = lat >= 0 ? 'N' : 'S'
    const orientation = lng >= 0 ? 'E' : 'W'

    const rawLat = formatDDMM(lat)
    const rawLng = formatDDDMM(lng)
    const speedStr = speed.toFixed(2).padStart(6, '0')
    const headingStr = heading.toString().padStart(3, '0')

    // vehicle_status: FFFFBBFF = OFF, FFFF9FFF = ON
    const vehicleStatus = isOff ? 'FFFFBBFF' : 'FFFF9FFF'

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
        headingStr,       // direction (heading)
        date(),
        vehicleStatus,
        '214',            // net_mcc
        '03',             // net_mnc
        '2126',           // net_lac
        '1860#'           // net_cellid + closer
    ].join(',')

    return message
}

// Backward-compatible alias for previous API name.
const randomGPS = simulateGPSInRoute

module.exports = { simulateGPSInRoute, randomGPS }

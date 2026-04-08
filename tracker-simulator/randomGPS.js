'use strict'
const fs = require('fs')
const routeDataset = require('./routes.osrm.half.json')
const { ROUTE_COUNT, TRUCKS_PER_ROUTE, TOTAL_TRUCKS, SIM_TRACKERS } = require('./simulator.constants')
const STATE_FILE = process.env.SIM_STATE_FILE || '/tmp/tortoise-sim-state.json'

/**
 * Realistic GPS simulator for 30 trucks on 15 routes.
 *
 * Each route has 2 trucks assigned in opposite directions:
 * one starts outbound, the other starts inbound (reverse).
 *
 * Base routes are loaded from OSRM dataset. If fewer than 15 routes are present,
 * additional operational routes are derived as contiguous sub-routes.
 */

const INTERVAL_SECONDS = 3

function buildRestStopIndexes(pointCount) {
    // Define plausible long-rest points distributed along the route.
    const fractions = [0.2, 0.4, 0.6, 0.8]
    const indexes = fractions
        .map(f => Math.round((pointCount - 1) * f))
        .filter(i => i > 0 && i < pointCount - 1)
    return [...new Set(indexes)]
}

function buildRouteCatalog(datasetRoutes, targetCount = ROUTE_COUNT) {
    const validRoutes = datasetRoutes
        .filter(route => Array.isArray(route.waypoints) && route.waypoints.length >= 2)
        .map(route => ({
            name: route.name || route.id,
            waypoints: route.waypoints
        }))

    if (!validRoutes.length) {
        throw new Error('No valid routes found in routes dataset')
    }

    const routes = []
    for (const baseRoute of validRoutes) {
        routes.push({ name: baseRoute.name, waypoints: baseRoute.waypoints })
        if (routes.length >= targetCount) break
    }

    // Derive additional contiguous sub-routes when dataset provides fewer than target routes.
    const windows = [
        [0.05, 0.65],
        [0.2, 0.85],
        [0.35, 0.95],
        [0.1, 0.55],
        [0.45, 0.9]
    ]

    let pass = 0
    while (routes.length < targetCount) {
        for (const baseRoute of validRoutes) {
            const points = baseRoute.waypoints
            const [startFrac, endFrac] = windows[pass % windows.length]
            let startIndex = Math.floor((points.length - 1) * startFrac)
            let endIndex = Math.ceil((points.length - 1) * endFrac)

            if (endIndex - startIndex < 2) {
                startIndex = 0
                endIndex = points.length - 1
            }

            const subRoute = points.slice(startIndex, endIndex + 1)
            routes.push({
                name: `${baseRoute.name} segment ${pass + 1}`,
                waypoints: subRoute
            })

            if (routes.length >= targetCount) break
        }
        pass++
    }

    return routes.slice(0, targetCount).map((route, index) => ({
        id: `route-${String(index + 1).padStart(3, '0')}`,
        name: route.name,
        waypoints: route.waypoints
    }))
}

const ROUTE_CATALOG = buildRouteCatalog(routeDataset.routes, ROUTE_COUNT)

const TRUCK_ASSIGNMENTS = ROUTE_CATALOG.flatMap((route, routeIndex) => {
    const outboundTruck = SIM_TRACKERS[routeIndex * TRUCKS_PER_ROUTE]
    const inboundTruck = SIM_TRACKERS[routeIndex * TRUCKS_PER_ROUTE + 1]

    return [
        { ...outboundTruck, routeId: route.id, startsInbound: false },
        { ...inboundTruck, routeId: route.id, startsInbound: true }
    ]
})

if (ROUTE_CATALOG.length !== ROUTE_COUNT || TRUCK_ASSIGNMENTS.length !== TOTAL_TRUCKS) {
    throw new Error(`Invalid simulator topology: routes=${ROUTE_CATALOG.length}, trucks=${TRUCK_ASSIGNMENTS.length}`)
}

const routesById = new Map(ROUTE_CATALOG.map(route => [route.id, route]))
const ROUTES = TRUCK_ASSIGNMENTS.map(truck => {
    const route = routesById.get(truck.routeId)
    if (!route || !Array.isArray(route.waypoints) || route.waypoints.length < 2) {
        throw new Error(`Invalid or missing route dataset for id: ${truck.routeId}`)
    }

    return {
        serialNumber: truck.serialNumber,
        licensePlate: truck.licensePlate,
        routeName: route.name,
        startsInbound: truck.startsInbound,
        restStopIndexes: buildRestStopIndexes(route.waypoints.length),
        waypoints: route.waypoints
    }
})

// ── Truck state ───────────────────────────────────────────────────────────────

const trucks = ROUTES.map(route => ({
    serialNumber: route.serialNumber,
    waypointIndex: route.startsInbound ? route.waypoints.length - 1 : 0,
    direction: route.startsInbound ? -1 : 1, // 1 => outbound, -1 => inbound
    progress: Math.random(),       // start at random point in first segment
    // Speed in km/h — varies per truck to desynchronize them
    speedKmh: 80 + Math.floor(Math.random() * 40),
    ticksSinceLongRest: 0,
    nextLongRestAfterTicks: randomLongRestThresholdTicks(),
    longRestTicksRemaining: 0,
    stopTicksRemaining: 0,
    heading: Math.floor(Math.random() * 360),
    restStopIndexes: route.restStopIndexes,
    waypoints: route.waypoints
}))

let truckIndex = 0 // rotate through trucks so each gets a frame per interval

function loadState() {
    try {
        if (!fs.existsSync(STATE_FILE)) return
        const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
        if (typeof parsed.truckIndex === 'number') {
            truckIndex = parsed.truckIndex
        }
        if (!Array.isArray(parsed.trucks)) return

        const bySerial = new Map(parsed.trucks.map(item => [item.serialNumber, item]))
        trucks.forEach(truck => {
            const saved = bySerial.get(truck.serialNumber)
            if (!saved) return

            if (typeof saved.waypointIndex === 'number') {
                const maxIndex = truck.waypoints.length - 1
                truck.waypointIndex = Math.max(0, Math.min(maxIndex, Math.floor(saved.waypointIndex)))
            }
            if (saved.direction === 1 || saved.direction === -1) truck.direction = saved.direction
            if (typeof saved.progress === 'number') truck.progress = Math.max(0, Math.min(1, saved.progress))
            if (typeof saved.speedKmh === 'number') truck.speedKmh = saved.speedKmh
            if (typeof saved.ticksSinceLongRest === 'number') truck.ticksSinceLongRest = saved.ticksSinceLongRest
            if (typeof saved.nextLongRestAfterTicks === 'number') truck.nextLongRestAfterTicks = saved.nextLongRestAfterTicks
            if (typeof saved.longRestTicksRemaining === 'number') truck.longRestTicksRemaining = saved.longRestTicksRemaining
            if (typeof saved.stopTicksRemaining === 'number') truck.stopTicksRemaining = saved.stopTicksRemaining
            if (typeof saved.heading === 'number') truck.heading = saved.heading
        })
    } catch (err) {
        console.warn(`[simulator] Unable to load state from ${STATE_FILE}: ${err.message}`)
    }
}

function saveState() {
    try {
        const snapshot = {
            truckIndex,
            trucks: trucks.map(truck => ({
                serialNumber: truck.serialNumber,
                waypointIndex: truck.waypointIndex,
                direction: truck.direction,
                progress: truck.progress,
                speedKmh: truck.speedKmh,
                ticksSinceLongRest: truck.ticksSinceLongRest,
                nextLongRestAfterTicks: truck.nextLongRestAfterTicks,
                longRestTicksRemaining: truck.longRestTicksRemaining,
                stopTicksRemaining: truck.stopTicksRemaining,
                heading: truck.heading
            }))
        }
        fs.writeFileSync(STATE_FILE, JSON.stringify(snapshot))
    } catch (err) {
        console.warn(`[simulator] Unable to persist state to ${STATE_FILE}: ${err.message}`)
    }
}

loadState()

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
    // 120–360 ticks with 3s updates => ~6–18 min.
    return 120 + Math.floor(Math.random() * 241)
}

function randomLongRestDurationTicks() {
    // 40–160 ticks with 3s updates => ~2–8 min.
    return 40 + Math.floor(Math.random() * 121)
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

    saveState()
    return message
}

// Backward-compatible alias for previous API name.
const randomGPS = simulateGPSInRoute

module.exports = {
    simulateGPSInRoute,
    randomGPS,
    TRUCK_COUNT: TOTAL_TRUCKS,
    SIM_TRACKERS
}

'use strict'

const ROUTE_COUNT = 15
const TRUCKS_PER_ROUTE = 2
const TOTAL_TRUCKS = ROUTE_COUNT * TRUCKS_PER_ROUTE
const SERIAL_BASE = 9900111000

function buildSimulatorTrackers(total = TOTAL_TRUCKS) {
    return Array.from({ length: total }, (_, index) => {
        const number = index + 1
        const serialNumber = String(SERIAL_BASE + number)
        const alias = `SIM-${String(number).padStart(4, '0')}`
        return { serialNumber, alias }
    })
}

const SIM_TRACKERS = buildSimulatorTrackers()

module.exports = {
    ROUTE_COUNT,
    TRUCKS_PER_ROUTE,
    TOTAL_TRUCKS,
    SIM_TRACKERS,
    buildSimulatorTrackers
}

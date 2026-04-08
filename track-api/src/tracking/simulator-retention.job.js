const repo = require('./tracking.repository')

const DAY_MS = 24 * 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const DEFAULT_RETENTION_DAYS = 60
const DEFAULT_INTERVAL_MINUTES = 60
const DEFAULT_INITIAL_DELAY_MINUTES = 2
const DEFAULT_SIMULATOR_SERIALS = Array.from(
    { length: 30 },
    (_, index) => String(9900111000 + index + 1)
)

function parsePositiveInteger(rawValue, fallback) {
    const parsed = Number.parseInt(rawValue, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseNonNegativeInteger(rawValue, fallback) {
    const parsed = Number.parseInt(rawValue, 10)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function parseSimulatorSerials(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') return [...DEFAULT_SIMULATOR_SERIALS]

    const parsed = rawValue
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)

    return parsed.length ? [...new Set(parsed)] : [...DEFAULT_SIMULATOR_SERIALS]
}

function parseEnabled(rawValue) {
    if (typeof rawValue === 'string') return rawValue.toLowerCase() !== 'false'
    return rawValue !== false
}

function getRetentionConfig(env = process.env) {
    return {
        enabled: parseEnabled(env.SIM_TRACK_CLEANUP_ENABLED),
        retentionDays: parsePositiveInteger(env.SIM_TRACK_RETENTION_DAYS, DEFAULT_RETENTION_DAYS),
        intervalMinutes: parsePositiveInteger(env.SIM_TRACK_CLEANUP_INTERVAL_MINUTES, DEFAULT_INTERVAL_MINUTES),
        initialDelayMinutes: parseNonNegativeInteger(
            env.SIM_TRACK_CLEANUP_INITIAL_DELAY_MINUTES,
            DEFAULT_INITIAL_DELAY_MINUTES
        ),
        simulatorSerials: parseSimulatorSerials(env.SIM_TRACK_SERIALS)
    }
}

async function runCleanup(config = getRetentionConfig(), logger = console) {
    if (!config.enabled || !config.simulatorSerials.length) {
        return { skipped: true, deletedCount: 0 }
    }

    const cutoff = new Date(Date.now() - config.retentionDays * DAY_MS)
    const deletedCount = await repo.deleteOlderThanBySerials(config.simulatorSerials, cutoff)

    logger.log(
        `[simulator-retention] deleted=${deletedCount} cutoff=${cutoff.toISOString()} serials=${config.simulatorSerials.length}`
    )

    return { skipped: false, deletedCount, cutoff }
}

function startSimulatorTrackRetentionJob({ env = process.env, logger = console } = {}) {
    const config = getRetentionConfig(env)

    if (!config.enabled || !config.simulatorSerials.length) {
        logger.log('[simulator-retention] disabled')
        return () => {}
    }

    const execute = () => {
        runCleanup(config, logger).catch(error => {
            logger.error(`[simulator-retention] cleanup failed: ${error.message}`)
        })
    }

    const delayMs = config.initialDelayMinutes * MINUTE_MS
    const startMessage = delayMs > 0
        ? `[simulator-retention] first cleanup in ${config.initialDelayMinutes}m; interval=${config.intervalMinutes}m`
        : `[simulator-retention] first cleanup immediately; interval=${config.intervalMinutes}m`
    logger.log(startMessage)

    const firstRunTimer = setTimeout(execute, delayMs)
    if (typeof firstRunTimer.unref === 'function') firstRunTimer.unref()

    const timer = setInterval(execute, config.intervalMinutes * MINUTE_MS)
    if (typeof timer.unref === 'function') timer.unref()

    return () => {
        clearTimeout(firstRunTimer)
        clearInterval(timer)
    }
}

module.exports = {
    DEFAULT_SIMULATOR_SERIALS,
    getRetentionConfig,
    runCleanup,
    startSimulatorTrackRetentionJob
}

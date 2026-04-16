const repo = require('./tracking.repository')

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_SIMULATOR_SERIALS = Array.from(
    { length: 30 },
    (_, index) => String(9900111000 + index + 1)
)

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
        simulatorSerials: parseSimulatorSerials(env.SIM_TRACK_SERIALS)
    }
}

function getMsUntilNextMidnight(now = new Date()) {
    const next = new Date(now)
    next.setHours(24, 0, 0, 0)
    return next.getTime() - now.getTime()
}

async function runCleanup(config = getRetentionConfig(), logger = console) {
    if (!config.enabled || !config.simulatorSerials.length) {
        return { skipped: true, deletedCount: 0 }
    }

    const deletedCount = await repo.deleteBySerials(config.simulatorSerials)

    logger.log(
        `[simulator-retention] deleted=${deletedCount} serials=${config.simulatorSerials.length}`
    )

    return { skipped: false, deletedCount }
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

    const delayMs = getMsUntilNextMidnight()
    const firstRunAt = new Date(Date.now() + delayMs).toISOString()
    logger.log(`[simulator-retention] first cleanup at ${firstRunAt}; interval=24h`)

    let timer = null
    const firstRunTimer = setTimeout(() => {
        execute()
        timer = setInterval(execute, DAY_MS)
        if (typeof timer.unref === 'function') timer.unref()
    }, delayMs)
    if (typeof firstRunTimer.unref === 'function') firstRunTimer.unref()

    return () => {
        clearTimeout(firstRunTimer)
        if (timer) clearInterval(timer)
    }
}

module.exports = {
    DEFAULT_SIMULATOR_SERIALS,
    getRetentionConfig,
    getMsUntilNextMidnight,
    runCleanup,
    startSimulatorTrackRetentionJob
}

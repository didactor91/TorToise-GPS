const { errors: { HttpError } } = require('track-utils')

/**
 * Minimal in-memory rate limiter for a single-node deployment.
 * For multi-node scaling, replace with Redis-backed limiter.
 *
 * @param {{
 *  windowMs: number,
 *  max: number,
 *  keyGenerator?: (req: import('express').Request) => string
 * }} options
 */
function createRateLimiter({ windowMs, max, keyGenerator }) {
    const buckets = new Map()

    return function rateLimit(req, res, next) {
        const key = keyGenerator ? keyGenerator(req) : req.ip
        const now = Date.now()
        const bucket = buckets.get(key)

        if (!bucket || now > bucket.resetAt) {
            buckets.set(key, { count: 1, resetAt: now + windowMs })
            return next()
        }

        if (bucket.count >= max) {
            const err = new HttpError('Too many requests')
            err.status = 429
            return next(err)
        }

        bucket.count += 1
        next()
    }
}

module.exports = { createRateLimiter }

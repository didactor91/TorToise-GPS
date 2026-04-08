/**
 * Integration tests for:
 *  - GET /api/health endpoint
 *  - JWT HS256 algorithm enforcement (auth middleware)
 *  - Centralized Express 5 error middleware
 *
 * These tests spin up a lightweight inline Express app (no DB connection)
 * and use Node's built-in http.request to exercise real HTTP semantics.
 */

const express = require('express')
const http = require('http')
const jwt = require('jsonwebtoken')
const { errors: { UnauthorizedError, LogicError, InputError } } = require('track-utils')

const TEST_SECRET = 'test-secret-hs256'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Make an HTTP request against a running server, resolve with { status, body }. */
function request(server, { method = 'GET', path = '/', headers = {}, body } = {}) {
    return new Promise((resolve, reject) => {
        const addr = server.address()
        const options = {
            hostname: '127.0.0.1',
            port: addr.port,
            path,
            method,
            headers: { 'Content-Type': 'application/json', ...headers }
        }

        const req = http.request(options, (res) => {
            let data = ''
            res.on('data', chunk => (data += chunk))
            res.on('end', () => {
                let parsed
                try { parsed = JSON.parse(data) } catch { parsed = data }
                resolve({ status: res.statusCode, body: parsed })
            })
        })

        req.on('error', reject)

        if (body !== undefined) {
            req.write(JSON.stringify(body))
        }
        req.end()
    })
}

// ---------------------------------------------------------------------------
// Build a test app that mirrors track-api/index.js middleware but
// does NOT require a MongoDB connection.
// ---------------------------------------------------------------------------

function buildTestApp({ JWT_SECRET = TEST_SECRET } = {}) {
    const app = express()
    app.use(express.json())

    // Health endpoint
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', version: '1.0.0' })
    })

    // Auth middleware (inline — mirrors routes/auth.js, including JWT error wrapping)
    const authMiddleware = (req, res, next) => {
        try {
            const { headers: { authorization } } = req
            if (!authorization) throw new UnauthorizedError('No authorization header')
            const token = authorization.slice(7)
            const { sub } = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
            req.userId = sub
            next()
        } catch (err) {
            if (err.name === 'JsonWebTokenError' ||
                err.name === 'TokenExpiredError' ||
                err.name === 'NotBeforeError') {
                next(new UnauthorizedError(err.message))
            } else {
                next(err)
            }
        }
    }

    // Protected route to exercise auth middleware
    app.get('/api/protected', authMiddleware, (req, res) => {
        res.json({ userId: req.userId })
    })

    // Route that throws LogicError to exercise error middleware
    app.get('/api/logic-error', (req, res, next) => {
        next(new LogicError('duplicate entry'))
    })

    // Route that throws InputError to exercise error middleware
    app.get('/api/input-error', (req, res, next) => {
        next(new InputError('bad input'))
    })

    // Route that throws generic error to exercise error middleware
    app.get('/api/server-error', (req, res, next) => {
        next(new Error('unexpected boom'))
    })

    // Centralized error middleware (4-arg — same as track-api/index.js)
    app.use(function (err, req, res, next) {
        let status = 500

        if (err instanceof UnauthorizedError) status = 401
        else if (err instanceof LogicError) status = 409
        else if (err instanceof InputError) status = 400
        else if (err.status) status = err.status

        const message = err.message || 'Internal server error'
        res.status(status).json({ error: message })
    })

    return app
}

// ---------------------------------------------------------------------------
// Test lifecycle — one server instance per describe block
// ---------------------------------------------------------------------------

describe('GET /api/health', () => {
    let server

    beforeAll(async () => {
        server = await new Promise((resolve) => {
            const s = buildTestApp().listen(0, '127.0.0.1', () => resolve(s))
        })
    })

    afterAll(async () => {
        await new Promise((resolve) => server.close(resolve))
    })

    it('returns 200 with { status: "ok", version }', async () => {
        const { status, body } = await request(server, { path: '/api/health' })

        expect(status).toBe(200)
        expect(body).toHaveProperty('status', 'ok')
        expect(body).toHaveProperty('version')
        expect(typeof body.version).toBe('string')
    })
})

describe('JWT HS256 algorithm enforcement (auth middleware)', () => {
    let server

    beforeAll(async () => {
        server = await new Promise((resolve) => {
            const s = buildTestApp({ JWT_SECRET: TEST_SECRET }).listen(0, '127.0.0.1', () => resolve(s))
        })
    })

    afterAll(async () => {
        await new Promise((resolve) => server.close(resolve))
    })

    it('accepts a valid HS256 JWT and passes userId to route', async () => {
        const token = jwt.sign({ sub: 'user-123' }, TEST_SECRET, { algorithm: 'HS256' })
        const { status, body } = await request(server, {
            path: '/api/protected',
            headers: { Authorization: `Bearer ${token}` }
        })

        expect(status).toBe(200)
        expect(body).toHaveProperty('userId', 'user-123')
    })

    it('rejects a JWT with alg:none (algorithm confusion — none algorithm)', async () => {
        // Craft a token that claims alg:none. The server only allows HS256,
        // so it must reject this token with 401.
        // Raw JWT: base64url(header) + '.' + base64url(payload) + '.'  (empty sig)
        const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
        const payload = Buffer.from(JSON.stringify({ sub: 'attacker' })).toString('base64url')
        const noneToken = `${header}.${payload}.`

        const { status, body } = await request(server, {
            path: '/api/protected',
            headers: { Authorization: `Bearer ${noneToken}` }
        })

        expect(status).toBe(401)
        expect(body).toHaveProperty('error')
    })

    it('rejects a request with no Authorization header', async () => {
        const { status, body } = await request(server, { path: '/api/protected' })

        expect(status).toBe(401)
        expect(body).toHaveProperty('error')
    })

    it('rejects a request with an invalid/tampered token', async () => {
        const { status, body } = await request(server, {
            path: '/api/protected',
            headers: { Authorization: 'Bearer this.is.not.a.valid.jwt' }
        })

        expect(status).toBe(401)
        expect(body).toHaveProperty('error')
    })

    it('rejects a JWT signed with a different secret', async () => {
        const token = jwt.sign({ sub: 'attacker' }, 'wrong-secret', { algorithm: 'HS256' })
        const { status, body } = await request(server, {
            path: '/api/protected',
            headers: { Authorization: `Bearer ${token}` }
        })

        expect(status).toBe(401)
        expect(body).toHaveProperty('error')
    })
})

describe('Centralized Express 5 error middleware', () => {
    let server

    beforeAll(async () => {
        server = await new Promise((resolve) => {
            const s = buildTestApp().listen(0, '127.0.0.1', () => resolve(s))
        })
    })

    afterAll(async () => {
        await new Promise((resolve) => server.close(resolve))
    })

    it('maps LogicError → 409 with { error } body', async () => {
        const { status, body } = await request(server, { path: '/api/logic-error' })

        expect(status).toBe(409)
        expect(body).toHaveProperty('error', 'duplicate entry')
    })

    it('maps InputError → 400 with { error } body', async () => {
        const { status, body } = await request(server, { path: '/api/input-error' })

        expect(status).toBe(400)
        expect(body).toHaveProperty('error', 'bad input')
    })

    it('maps UnauthorizedError → 401 (via auth middleware)', async () => {
        const { status, body } = await request(server, { path: '/api/protected' })

        expect(status).toBe(401)
        expect(body).toHaveProperty('error')
    })

    it('maps unknown Error → 500 with { error } body', async () => {
        const { status, body } = await request(server, { path: '/api/server-error' })

        expect(status).toBe(500)
        expect(body).toHaveProperty('error', 'unexpected boom')
    })
})

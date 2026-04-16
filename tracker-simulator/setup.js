#!/usr/bin/env node
'use strict'

/**
 * setup.js — bootstraps the livedemo user and tracker assignments.
 *
 * Rules:
 *  1. If livedemo@example.com does NOT exist → register it.
 *  2. If livedemo@example.com exists → authenticate.
 *  3. Enforce strict demo whitelist in livedemo:
 *       a. Any non-demo tracker currently attached to livedemo → remove it.
 *       b. For each demo serial:
 *          - If already in livedemo → skip.
 *          - If owned by another user → warn and skip.
 *          - If unassigned → add to livedemo.
 */

require('./load-env')()
const { SIM_TRACKERS } = require('./simulator.constants')

const API_URL = process.env.API_URL || 'http://localhost:8085/api'

const LIVEDEMO_EMAIL    = 'livedemo@example.com'
const LIVEDEMO_PASSWORD = 'LiveDemo'
const LIVEDEMO_NAME     = 'Live'
const LIVEDEMO_SURNAME  = 'Demo'
const DEMO_SERIALS = new Set(SIM_TRACKERS.map(t => t.serialNumber))

// ── helpers ──────────────────────────────────────────────────────────────────

async function api(path, options = {}) {
    const { method = 'GET', token, data } = options
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
    })

    const text = await res.text()
    const body = text ? JSON.parse(text) : null

    if (!res.ok) {
        const err = new Error(body?.error || res.statusText)
        err.status = res.status
        throw err
    }

    return body
}

function log(emoji, msg) { console.log(`${emoji}  ${msg}`) }

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
    log('🚀', `Setup starting — API: ${API_URL}`)

    // ── 1. Ensure livedemo user exists ────────────────────────────────────────
    let token

    try {
        const resp = await api('/users/auth', {
            method: 'POST',
            data: { email: LIVEDEMO_EMAIL, password: LIVEDEMO_PASSWORD }
        })
        token = resp.token
        log('✅', `User ${LIVEDEMO_EMAIL} already exists — authenticated`)
    } catch (err) {
        if (err.status === 401) {
            // User exists but wrong password — can't proceed
            log('❌', `User ${LIVEDEMO_EMAIL} exists but wrong password: ${err.message}`)
            process.exit(1)
        }

        // User doesn't exist — register
        log('📝', `User ${LIVEDEMO_EMAIL} not found — registering...`)
        try {
            await api('/users', {
                method: 'POST',
                data: {
                    name: LIVEDEMO_NAME,
                    surname: LIVEDEMO_SURNAME,
                    email: LIVEDEMO_EMAIL,
                    password: LIVEDEMO_PASSWORD
                }
            })
            const resp = await api('/users/auth', {
                method: 'POST',
                data: { email: LIVEDEMO_EMAIL, password: LIVEDEMO_PASSWORD }
            })
            token = resp.token
            log('✅', `User ${LIVEDEMO_EMAIL} registered and authenticated`)
        } catch (regErr) {
            log('❌', `Failed to register user: ${regErr.message}`)
            process.exit(1)
        }
    }

    // ── 2. Get current trackers for livedemo ──────────────────────────────────
    let existingTrackers = []
    try {
        existingTrackers = await api('/trackers', { token }) || []
    } catch {
        existingTrackers = [] // empty list — that's fine
    }

    const ownedSNs = new Set(existingTrackers.map(t => t.serialNumber))
    log('📋', `livedemo currently has ${existingTrackers.length} tracker(s): [${[...ownedSNs].join(', ') || 'none'}]`)

    // ── 3. Enforce whitelist: remove non-demo trackers from livedemo ─────────
    for (const tracker of existingTrackers) {
        if (DEMO_SERIALS.has(tracker.serialNumber)) continue

        try {
            await api(`/trackers/${tracker._id}/delete`, {
                method: 'DELETE',
                token
            })
            log('🧹', `Removed non-demo tracker from livedemo: SN ${tracker.serialNumber}`)
            ownedSNs.delete(tracker.serialNumber)
        } catch (err) {
            log('❌', `Failed to remove non-demo tracker SN ${tracker.serialNumber}: ${err.message}`)
        }
    }

    // ── 4. Assign each simulator tracker ─────────────────────────────────────
    for (const tracker of SIM_TRACKERS) {
        const { serialNumber, alias } = tracker

        if (!DEMO_SERIALS.has(serialNumber)) {
            log('⛔', `Refusing to assign non-demo serial ${serialNumber}`)
            continue
        }

        // a. Already owned by livedemo
        if (ownedSNs.has(serialNumber)) {
            log('⏭️ ', `SN ${serialNumber} already belongs to livedemo — skipped`)
            continue
        }

        // b. Check if another user owns it (try to find it globally)
        //    The API doesn't have a global search endpoint, so we attempt to add it.
        //    If it's owned by another user, the API returns 409 "already registered".
        try {
            await api('/trackers/add', {
                method: 'POST',
                token,
                data: { serialNumber, alias }
            })
            log('✅', `SN ${serialNumber} (${alias}) added to livedemo`)
        } catch (err) {
            if (err.status === 409) {
                log('⚠️ ', `SN ${serialNumber} is already registered to another account — skipped`)
            } else {
                log('❌', `Failed to add SN ${serialNumber}: ${err.message}`)
            }
        }
    }

    // ── 5. Final state ────────────────────────────────────────────────────────
    let finalTrackers = []
    try {
        finalTrackers = await api('/trackers', { token }) || []
    } catch {
        finalTrackers = []
    }

    log('🏁', `Setup complete. livedemo has ${finalTrackers.length} tracker(s):`)
    finalTrackers.forEach(t => {
        log('   🚚', `SN: ${t.serialNumber}  Alias: ${t.alias}`)
    })
}

main().catch(err => {
    console.error('Setup failed:', err.message)
    process.exit(1)
})

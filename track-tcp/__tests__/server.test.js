/**
 * TCP Server integration tests.
 *
 * In CJS vitest context, vi.mock() factories are not reliably hoisted for
 * modules that export a plain function (module.exports = fn). We use
 * require.cache injection instead to intercept the call dependency before
 * server.js loads, then start the server on an ephemeral port and connect a
 * real net.Socket to exercise the full TCP wiring.
 */

const net = require('net')

const VALID_FRAME = '*HQ,9900110011,V1,120000,A,41.3902,N,002.1540,E,090.80,208,080426,FFFF9FFF,214,03,2126,1860#'
const INVALID_FRAME = '*HQ,9900110011,V1,120000,V,41.3902,N,002.1540,E,090.80,208,080426,FFFF9FFF,214,03,2126,1860#'

/**
 * Connect a raw TCP socket to the server, send a payload, then wait for the
 * server-side async handler to complete before disconnecting.
 */
function sendPayload(port, payload) {
    return new Promise((resolve, reject) => {
        const client = net.createConnection({ port }, () => {
            client.write(payload)
        })
        client.on('error', reject)
        // 150 ms gives the async handler ample time to await call()
        setTimeout(() => {
            client.destroy()
            resolve()
        }, 150)
    })
}

/** Start the server on an ephemeral port, return the assigned port number */
function startServer(srv) {
    return new Promise((resolve, reject) => {
        srv.listen(0, () => {
            const addr = srv.address()
            addr ? resolve(addr.port) : reject(new Error('server.address() returned null'))
        })
        srv.once('error', reject)
    })
}

describe('track-tcp server — real TCP socket wiring', () => {
    let server, mockCall, port
    const callModulePath = require.resolve('track-utils/call')
    const serverModulePath = require.resolve('../server')

    beforeAll(async () => {
        // Create a vi.fn() mock for track-utils/call
        mockCall = vi.fn()

        // Inject mock into the Node module cache BEFORE server.js is required,
        // so that server.js's require('track-utils/call') gets our spy.
        require.cache[callModulePath] = {
            id: callModulePath,
            filename: callModulePath,
            loaded: true,
            exports: mockCall
        }

        // Clear any previously cached server module so it re-requires call
        delete require.cache[serverModulePath]

        server = require('../server')

        port = await startServer(server)
    })

    afterAll(async () => {
        await new Promise((resolve) => server.close(resolve))

        // Restore the real call module in the cache
        delete require.cache[callModulePath]
        delete require.cache[serverModulePath]
    })

    beforeEach(() => {
        mockCall.mockReset()
    })

    it('calls track-utils/call with correct payload when a valid frame arrives', async () => {
        mockCall.mockResolvedValue({})

        await sendPayload(port, VALID_FRAME)

        expect(mockCall).toHaveBeenCalledOnce()
        expect(mockCall).toHaveBeenCalledWith(
            expect.stringContaining('/tracks/TCP/add'),
            expect.objectContaining({
                method: 'POST',
                data: expect.objectContaining({
                    serialNumber: '9900110011'
                })
            })
        )
    })

    it('does not crash when call rejects (network failure)', async () => {
        mockCall.mockRejectedValue(new Error('Network failure'))

        // Server must absorb the error internally — the socket send must not throw
        await expect(sendPayload(port, VALID_FRAME)).resolves.toBeUndefined()
        expect(mockCall).toHaveBeenCalledOnce()
    })

    it('does not invoke call when the GPS frame is invalid (validState V)', async () => {
        mockCall.mockResolvedValue({})

        await sendPayload(port, INVALID_FRAME)

        expect(mockCall).not.toHaveBeenCalled()
    })

    it('server exports a net.Server instance', () => {
        expect(server).toBeInstanceOf(net.Server)
    })

    it('does not register server.on("close") inside the connection handler', () => {
        const fs = require('fs')
        const path = require('path')
        const src = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8')

        // Verify the close handler exists
        expect(src).toContain("server.on('close'")

        // The line must be at top-level indentation (0 leading spaces)
        const lines = src.split('\n')
        const closeLine = lines.find((line) => line.includes("server.on('close'"))
        expect(closeLine).toBeDefined()
        expect(closeLine.match(/^\s*/)[0].length).toBeLessThanOrEqual(0)
    })
})

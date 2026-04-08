const call = require('../call')
const { ConnectionError, HttpError } = require('../errors')

describe('call()', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('returns parsed JSON body on a successful POST', async () => {
        const mockResponse = { id: '123', created: true }
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        }))

        const result = await call('http://example.com/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: { serialNumber: 'ABC', latitude: 1.23, longitude: 4.56 }
        })

        expect(result).toEqual(mockResponse)
        expect(fetch).toHaveBeenCalledOnce()
        expect(fetch).toHaveBeenCalledWith('http://example.com/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serialNumber: 'ABC', latitude: 1.23, longitude: 4.56 })
        })
    })

    it('throws HttpError with status and message on non-2xx response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'Not found' })
        }))

        await expect(
            call('http://example.com/api/missing', { method: 'GET' })
        ).rejects.toMatchObject({ status: 404, message: 'Not found' })
    })

    it('throws HttpError with correct status even when body is not JSON', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.reject(new SyntaxError('Unexpected token'))
        }))

        let caught
        try {
            await call('http://example.com/api/error', { method: 'GET' })
        } catch (err) {
            caught = err
        }

        expect(caught).toBeInstanceOf(HttpError)
        expect(caught.status).toBe(500)
    })

    it('throws ConnectionError when fetch rejects with TypeError (network failure)', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

        await expect(
            call('http://unreachable.example.com/api', { method: 'GET' })
        ).rejects.toBeInstanceOf(ConnectionError)
    })

    it('sends body as undefined when no data is provided', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({})
        }))

        await call('http://example.com/api', { method: 'GET' })

        expect(fetch).toHaveBeenCalledWith('http://example.com/api', {
            method: 'GET',
            headers: undefined,
            body: undefined
        })
    })
})

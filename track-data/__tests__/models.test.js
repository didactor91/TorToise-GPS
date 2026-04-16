const { models } = require('../index')

const { User, Track } = models

describe('Track model (standalone collection)', () => {
    it('creates a valid track document', async () => {
        const track = new Track({
            serialNumber: '9900110011',
            latitude: 41.390205,
            longitude: 2.154007,
            speed: 90,
            status: 1
        })
        const saved = await track.save()
        expect(saved._id).toBeDefined()
        expect(saved.serialNumber).toBe('9900110011')
        expect(saved.latitude).toBe(41.390205)
        expect(saved.longitude).toBe(2.154007)
        expect(saved.speed).toBe(90)
        expect(saved.status).toBe(1)
        expect(saved.date).toBeInstanceOf(Date)
    })

    it('rejects a track missing required serialNumber', async () => {
        const track = new Track({ latitude: 41.39, longitude: 2.15, speed: 30 })
        await expect(track.save()).rejects.toThrow()
    })

    it('rejects a track missing required latitude', async () => {
        const track = new Track({ serialNumber: '9900110011', longitude: 2.15, speed: 30 })
        await expect(track.save()).rejects.toThrow()
    })

    it('rejects a track missing required longitude', async () => {
        const track = new Track({ serialNumber: '9900110011', latitude: 41.39, speed: 30 })
        await expect(track.save()).rejects.toThrow()
    })

    it('rejects a track missing required speed', async () => {
        const track = new Track({ serialNumber: '9900110011', latitude: 41.39, longitude: 2.15 })
        await expect(track.save()).rejects.toThrow()
    })
})

describe('User model', () => {
    it('creates a valid user document', async () => {
        const user = new User({
            name: 'Joan',
            surname: 'Mir',
            email: 'joan@example.com',
            password: 'hashed_password_here'
        })
        const saved = await user.save()
        expect(saved._id).toBeDefined()
        expect(saved.email).toBe('joan@example.com')
        expect(saved.pois).toHaveLength(0)
        expect(saved.trackers).toHaveLength(0)
    })

    it('rejects a user with an invalid email', async () => {
        const user = new User({
            name: 'Joan',
            surname: 'Mir',
            email: 'not-an-email',
            password: 'pass'
        })
        await expect(user.save()).rejects.toThrow()
    })

    it('rejects a user missing required name', async () => {
        const user = new User({
            surname: 'Mir',
            email: 'joan2@example.com',
            password: 'pass'
        })
        await expect(user.save()).rejects.toThrow()
    })

    it('enforces unique email constraint', async () => {
        await new User({ name: 'A', surname: 'B', email: 'unique@example.com', password: 'p' }).save()
        const dup = new User({ name: 'C', surname: 'D', email: 'unique@example.com', password: 'q' })
        await expect(dup.save()).rejects.toThrow()
    })

    it('creates a user with embedded trackers (no tracks array)', async () => {
        const user = new User({
            name: 'Test',
            surname: 'User',
            email: 'tracker-test@example.com',
            password: 'hashed',
            trackers: [{ serialNumber: '9900220022', alias: 'ABC-1234' }]
        })
        const saved = await user.save()
        expect(saved.trackers).toHaveLength(1)
        expect(saved.trackers[0].serialNumber).toBe('9900220022')
        expect(saved.trackers[0].alias).toBe('ABC-1234')
        expect(saved.trackers[0].tracks).toBeUndefined()
    })
})

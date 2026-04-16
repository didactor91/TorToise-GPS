const { models: { Track } } = require('track-data')
const {
    getRetentionConfig,
    getMsUntilNextMidnight,
    runCleanup
} = require('./simulator-retention.job')

describe('simulator retention job', () => {
    beforeEach(async () => {
        await Track.deleteMany()
    })

    describe('getRetentionConfig', () => {
        it('uses defaults when env values are missing', () => {
            const config = getRetentionConfig({})

            expect(config.enabled).toBe(true)
            expect(config.simulatorSerials).toHaveLength(30)
            expect(config.simulatorSerials[0]).toBe('9900111001')
            expect(config.simulatorSerials[29]).toBe('9900111030')
        })

        it('parses custom env values', () => {
            const config = getRetentionConfig({
                SIM_TRACK_CLEANUP_ENABLED: 'true',
                SIM_TRACK_SERIALS: 'SN-1, SN-2, SN-1'
            })

            expect(config.simulatorSerials).toEqual(['SN-1', 'SN-2'])
        })
    })

    describe('getMsUntilNextMidnight', () => {
        it('returns milliseconds until next local midnight', () => {
            const now = new Date('2026-04-16T10:30:00')
            const ms = getMsUntilNextMidnight(now)
            expect(ms).toBe(13.5 * 60 * 60 * 1000)
        })
    })

    describe('runCleanup', () => {
        it('deletes all tracks from simulator serials', async () => {
            const now = Date.now()
            const oldDate = new Date(now - 61 * 24 * 60 * 60 * 1000)
            const recentDate = new Date(now - 10 * 24 * 60 * 60 * 1000)

            await Track.create({ serialNumber: '9900110011', latitude: 41.39, longitude: 2.15, speed: 40, status: 1, date: oldDate })
            await Track.create({ serialNumber: '9900110011', latitude: 41.40, longitude: 2.16, speed: 50, status: 1, date: recentDate })
            await Track.create({ serialNumber: 'REAL-0001', latitude: 41.50, longitude: 2.20, speed: 60, status: 1, date: oldDate })

            const result = await runCleanup({
                enabled: true,
                simulatorSerials: ['9900110011']
            }, { log: () => {}, error: () => {} })

            expect(result.skipped).toBe(false)
            expect(result.deletedCount).toBe(2)

            const simCount = await Track.countDocuments({ serialNumber: '9900110011' })
            const realCount = await Track.countDocuments({ serialNumber: 'REAL-0001' })
            expect(simCount).toBe(0)
            expect(realCount).toBe(1)
        })

        it('skips cleanup when disabled', async () => {
            const result = await runCleanup({
                enabled: false,
                simulatorSerials: ['9900110011']
            }, { log: () => {}, error: () => {} })

            expect(result.skipped).toBe(true)
            expect(result.deletedCount).toBe(0)
        })
    })
})

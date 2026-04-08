const { models: { Track } } = require('track-data')
const {
    getRetentionConfig,
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
            expect(config.retentionDays).toBe(60)
            expect(config.intervalMinutes).toBe(60)
            expect(config.initialDelayMinutes).toBe(2)
            expect(config.simulatorSerials).toEqual(['9900110011', '9900110012', '9900110013', '9900110014'])
        })

        it('parses custom env values', () => {
            const config = getRetentionConfig({
                SIM_TRACK_CLEANUP_ENABLED: 'true',
                SIM_TRACK_RETENTION_DAYS: '90',
                SIM_TRACK_CLEANUP_INTERVAL_MINUTES: '15',
                SIM_TRACK_CLEANUP_INITIAL_DELAY_MINUTES: '5',
                SIM_TRACK_SERIALS: 'SN-1, SN-2, SN-1'
            })

            expect(config.retentionDays).toBe(90)
            expect(config.intervalMinutes).toBe(15)
            expect(config.initialDelayMinutes).toBe(5)
            expect(config.simulatorSerials).toEqual(['SN-1', 'SN-2'])
        })
    })

    describe('runCleanup', () => {
        it('deletes only old tracks from simulator serials', async () => {
            const now = Date.now()
            const oldDate = new Date(now - 61 * 24 * 60 * 60 * 1000)
            const recentDate = new Date(now - 10 * 24 * 60 * 60 * 1000)

            await Track.create({ serialNumber: '9900110011', latitude: 41.39, longitude: 2.15, speed: 40, status: 'ON', date: oldDate })
            await Track.create({ serialNumber: '9900110011', latitude: 41.40, longitude: 2.16, speed: 50, status: 'ON', date: recentDate })
            await Track.create({ serialNumber: 'REAL-0001', latitude: 41.50, longitude: 2.20, speed: 60, status: 'ON', date: oldDate })

            const result = await runCleanup({
                enabled: true,
                retentionDays: 60,
                intervalMinutes: 60,
                initialDelayMinutes: 0,
                simulatorSerials: ['9900110011']
            }, { log: () => {}, error: () => {} })

            expect(result.skipped).toBe(false)
            expect(result.deletedCount).toBe(1)

            const simCount = await Track.countDocuments({ serialNumber: '9900110011' })
            const realCount = await Track.countDocuments({ serialNumber: 'REAL-0001' })
            expect(simCount).toBe(1)
            expect(realCount).toBe(1)
        })

        it('skips cleanup when disabled', async () => {
            const result = await runCleanup({
                enabled: false,
                retentionDays: 60,
                intervalMinutes: 60,
                initialDelayMinutes: 0,
                simulatorSerials: ['9900110011']
            }, { log: () => {}, error: () => {} })

            expect(result.skipped).toBe(true)
            expect(result.deletedCount).toBe(0)
        })
    })
})

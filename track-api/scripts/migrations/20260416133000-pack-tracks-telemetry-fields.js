const NAME = '20260416133000-pack-tracks-telemetry-fields'
const BATCH_SIZE = 5000

function isEnabled(value) {
    return String(value || '').toLowerCase() === 'true'
}

function roundTo(value, decimals) {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

function normalizeStatus(value) {
    if (value === 1 || value === '1' || value === true) return 1
    if (value === 0 || value === '0' || value === false) return 0
    const normalized = String(value || '').trim().toUpperCase()
    if (normalized === 'OFF') return 0
    return 1
}

module.exports = {
    name: NAME,
    /**
     * @param {{ db: import('mongodb').Db, logger: Console, dryRun: boolean }} ctx
     */
    async up({ db, logger, dryRun }) {
        const exists = await db.listCollections({ name: 'tracks' }).hasNext()
        if (!exists) {
            logger.log(`[${NAME}] collection "tracks" not found; nothing to do`)
            return { skipped: true, reason: 'missing_tracks_collection' }
        }

        const tracks = db.collection('tracks')
        const count = await tracks.countDocuments({})
        if (count === 0) {
            logger.log(`[${NAME}] no tracks found`)
            return { skipped: true, reason: 'empty_collection' }
        }

        const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`
        const backupName = `tracks_repack_src_${suffix}`
        const keepBackup = isEnabled(process.env.MIGRATION_KEEP_TRACKS_BACKUP)

        if (dryRun) {
            logger.log(`[${NAME}] dry-run: would compact ${count} tracks (status->0/1, round lat/lon/speed)`)
            return { dryRun: true, count, backupName, keepBackup }
        }

        logger.log(`[${NAME}] snapshotting tracks into "${backupName}"`)
        await tracks.aggregate([{ $match: {} }, { $out: backupName }], { allowDiskUse: true }).toArray()

        logger.log(`[${NAME}] recreating tracks time-series collection`)
        await tracks.drop()
        await db.createCollection('tracks', {
            timeseries: {
                timeField: 'date',
                metaField: 'serialNumber',
                granularity: 'seconds'
            }
        })

        const target = db.collection('tracks')
        const backup = db.collection(backupName)
        const cursor = backup.find(
            {},
            {
                projection: {
                    _id: 0,
                    serialNumber: 1,
                    latitude: 1,
                    longitude: 1,
                    speed: 1,
                    status: 1,
                    date: 1
                }
            }
        )

        let inserted = 0
        let batch = []
        for await (const doc of cursor) {
            const latitude = roundTo(Number(doc.latitude || 0), 5)
            const longitude = roundTo(Number(doc.longitude || 0), 5)
            const speed = roundTo(Number(doc.speed || 0), 1)
            const status = normalizeStatus(doc.status)
            const date = doc.date instanceof Date ? doc.date : new Date(doc.date)

            batch.push({ serialNumber: doc.serialNumber, latitude, longitude, speed, status, date })

            if (batch.length >= BATCH_SIZE) {
                await target.insertMany(batch, { ordered: false })
                inserted += batch.length
                batch = []
            }
        }
        if (batch.length) {
            await target.insertMany(batch, { ordered: false })
            inserted += batch.length
        }

        await target.createIndex({ serialNumber: 1, date: 1 }, { name: 'serialNumber_1_date_1' })

        if (!keepBackup) {
            await backup.drop()
            logger.log(`[${NAME}] dropped backup "${backupName}"`)
        } else {
            logger.log(`[${NAME}] backup preserved as "${backupName}"`)
        }

        logger.log(`[${NAME}] repacked ${inserted} / ${count} tracks`)
        return { inserted, count, backupName, keptBackup: keepBackup }
    }
}

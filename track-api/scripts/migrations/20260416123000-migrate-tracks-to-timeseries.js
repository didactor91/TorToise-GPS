const NAME = '20260416123000-migrate-tracks-to-timeseries'

const BATCH_SIZE = 5000

function isEnabled(value) {
    return String(value || '').toLowerCase() === 'true'
}

module.exports = {
    name: NAME,
    /**
     * @param {{ db: import('mongodb').Db, logger: Console, dryRun: boolean }} ctx
     */
    async up({ db, logger, dryRun }) {
        const collections = await db.listCollections({ name: 'tracks' }).toArray()
        if (!collections.length) {
            logger.log(`[${NAME}] collection "tracks" does not exist; nothing to migrate`)
            return { skipped: true, reason: 'missing_tracks_collection' }
        }

        const tracksInfo = collections[0]
        const alreadyTimeSeries = Boolean(tracksInfo.options && tracksInfo.options.timeseries)
        if (alreadyTimeSeries) {
            logger.log(`[${NAME}] "tracks" is already a time series collection`)
            return { skipped: true, reason: 'already_timeseries' }
        }

        const source = db.collection('tracks')
        const sourceCount = await source.countDocuments({})
        const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`
        const backupName = `tracks_backup_${suffix}`
        const keepBackup = isEnabled(process.env.MIGRATION_KEEP_TRACKS_BACKUP)

        if (dryRun) {
            logger.log(
                `[${NAME}] dry-run: would migrate ${sourceCount} docs from regular collection "tracks" to time series`
            )
            return {
                dryRun: true,
                sourceCount,
                backupName,
                keepBackup
            }
        }

        let inserted = 0
        let backupCreated = false
        let targetCreated = false
        try {
            logger.log(`[${NAME}] renaming "tracks" -> "${backupName}"`)
            await source.rename(backupName)
            backupCreated = true

            logger.log(`[${NAME}] creating time series collection "tracks"`)
            await db.createCollection('tracks', {
                timeseries: {
                    timeField: 'date',
                    metaField: 'serialNumber',
                    granularity: 'seconds'
                }
            })
            targetCreated = true

            const backup = db.collection(backupName)
            const target = db.collection('tracks')
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

            let batch = []
            for await (const doc of cursor) {
                if (!(doc.date instanceof Date)) {
                    const parsed = new Date(doc.date)
                    doc.date = Number.isFinite(parsed.getTime()) ? parsed : new Date()
                }
                if (!doc.status) doc.status = 'ON'
                batch.push(doc)

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

            logger.log(`[${NAME}] copied ${inserted} documents to "tracks"`)

            // Ensure explicit ascending index for query plans shared by regular/time-series collections.
            await target.createIndex({ serialNumber: 1, date: 1 }, { name: 'serialNumber_1_date_1' })

            let droppedBackup = false
            if (!keepBackup) {
                await backup.drop()
                droppedBackup = true
                logger.log(`[${NAME}] dropped backup collection "${backupName}"`)
            } else {
                logger.log(`[${NAME}] backup preserved as "${backupName}" (MIGRATION_KEEP_TRACKS_BACKUP=true)`)
            }

            return {
                migrated: true,
                sourceCount,
                inserted,
                backupName,
                droppedBackup
            }
        } catch (error) {
            try {
                if (targetCreated) {
                    const targetExists = await db.listCollections({ name: 'tracks' }).hasNext()
                    if (targetExists) await db.collection('tracks').drop()
                }
                if (backupCreated) {
                    const backupExists = await db.listCollections({ name: backupName }).hasNext()
                    if (backupExists) await db.collection(backupName).rename('tracks')
                }
            } catch (_) {
                // ignore cleanup errors
            }
            throw error
        }
    }
}

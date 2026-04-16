const NAME = '20260416134000-fix-trackers-alias-indexes'

module.exports = {
    name: NAME,
    /**
     * @param {{ db: import('mongodb').Db, logger: Console, dryRun: boolean }} ctx
     */
    async up({ db, logger, dryRun }) {
        const exists = await db.listCollections({ name: 'trackers' }).hasNext()
        if (!exists) {
            logger.log(`[${NAME}] collection "trackers" not found; nothing to do`)
            return { skipped: true, reason: 'missing_trackers_collection' }
        }

        const trackers = db.collection('trackers')
        const indexes = await trackers.indexes()

        const licenseIndexes = indexes
            .filter(index => Object.prototype.hasOwnProperty.call(index.key || {}, 'licensePlate'))
            .map(index => index.name)

        const hasAlias = indexes.some(index => index.name === 'alias_1')

        if (dryRun) {
            logger.log(
                `[${NAME}] dry-run: would drop licensePlate indexes [${licenseIndexes.join(', ')}] and ensure alias_1=${!hasAlias}`
            )
            return { dryRun: true, drop: licenseIndexes, createAlias: !hasAlias }
        }

        if (!hasAlias) {
            await trackers.createIndex({ alias: 1 }, { name: 'alias_1' })
            logger.log(`[${NAME}] created index alias_1`)
        }

        let dropped = 0
        for (const indexName of licenseIndexes) {
            await trackers.dropIndex(indexName)
            dropped += 1
            logger.log(`[${NAME}] dropped legacy index ${indexName}`)
        }

        return { createdAlias: !hasAlias, dropped }
    }
}


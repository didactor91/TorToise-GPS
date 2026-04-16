const NAME = '20260416130000-drop-redundant-tracks-desc-index'

const REDUNDANT_INDEX = 'serialNumber_1_date_-1'
const REQUIRED_INDEX = 'serialNumber_1_date_1'

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
        const indexes = await tracks.indexes()
        const names = indexes.map((index) => index.name)
        const hasRequired = names.includes(REQUIRED_INDEX)
        const hasRedundant = names.includes(REDUNDANT_INDEX)

        if (!hasRedundant) {
            logger.log(`[${NAME}] redundant index "${REDUNDANT_INDEX}" not found`)
            return { skipped: true, reason: 'redundant_index_missing', indexes: names }
        }

        if (!hasRequired) {
            if (dryRun) {
                logger.log(
                    `[${NAME}] dry-run: required index "${REQUIRED_INDEX}" missing; would create it before dropping "${REDUNDANT_INDEX}"`
                )
                return { dryRun: true, wouldCreate: REQUIRED_INDEX, wouldDrop: REDUNDANT_INDEX }
            }
            await tracks.createIndex({ serialNumber: 1, date: 1 }, { name: REQUIRED_INDEX })
            logger.log(`[${NAME}] created required index "${REQUIRED_INDEX}"`)
        }

        if (dryRun) {
            logger.log(`[${NAME}] dry-run: would drop "${REDUNDANT_INDEX}" from tracks`)
            return { dryRun: true, drop: REDUNDANT_INDEX, keep: REQUIRED_INDEX }
        }

        await tracks.dropIndex(REDUNDANT_INDEX)
        logger.log(`[${NAME}] dropped index "${REDUNDANT_INDEX}"`)
        return { dropped: REDUNDANT_INDEX, kept: REQUIRED_INDEX }
    }
}

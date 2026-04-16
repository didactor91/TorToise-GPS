const NAME = '20260410000000-backfill-user-language'
const LEGACY_NAMES = ['2026-04-10-backfill-user-language']

module.exports = {
    name: NAME,
    aliases: LEGACY_NAMES,
    /**
     * @param {{ models: { User: import('mongoose').Model<any> }, logger: Console, dryRun: boolean }} ctx
     */
    async up({ models: { User }, logger, dryRun }) {
        const filter = {
            $or: [
                { language: { $exists: false } },
                { language: null },
                { language: '' }
            ]
        }
        const missing = await User.countDocuments(filter)

        if (missing === 0) {
            logger.log(`[${NAME}] no users require backfill`)
            return { matched: 0, modified: 0 }
        }

        if (dryRun) {
            logger.log(`[${NAME}] dry-run: ${missing} users would be updated to language=en`)
            return { matched: missing, modified: 0 }
        }

        const result = await User.updateMany(filter, { $set: { language: 'en' } })
        logger.log(`[${NAME}] matched=${result.matchedCount} modified=${result.modifiedCount}`)
        return { matched: result.matchedCount, modified: result.modifiedCount }
    }
}

const NAME = '20260416000000-rename-licenseplate-to-alias'
const LEGACY_NAMES = ['2026-04-16-rename-licenseplate-to-alias']

module.exports = {
    name: NAME,
    aliases: LEGACY_NAMES,
    /**
     * @param {{ models: { Tracker: import('mongoose').Model<any>, User: import('mongoose').Model<any> }, logger: Console, dryRun: boolean }} ctx
     */
    async up({ models: { Tracker, User }, logger, dryRun }) {
        const trackerFilter = { licensePlate: { $exists: true } }
        const trackerDocs = await Tracker.countDocuments(trackerFilter)

        const userFilter = { 'trackers.licensePlate': { $exists: true } }
        const userDocs = await User.countDocuments(userFilter)

        if (trackerDocs === 0 && userDocs === 0) {
            logger.log(`[${NAME}] no documents require migration`)
            return { trackerDocs: 0, trackerModified: 0, userDocs: 0, userModified: 0 }
        }

        if (dryRun) {
            logger.log(
                `[${NAME}] dry-run: trackers=${trackerDocs} users=${userDocs} would be migrated (licensePlate -> alias)`
            )
            return { trackerDocs, trackerModified: 0, userDocs, userModified: 0, dryRun: true }
        }

        let trackerModified = 0
        if (trackerDocs > 0) {
            const trackerResult = await Tracker.updateMany(
                trackerFilter,
                [
                    {
                        $set: {
                            alias: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ['$alias', null] },
                                            { $eq: ['$alias', ''] }
                                        ]
                                    },
                                    '$licensePlate',
                                    '$alias'
                                ]
                            }
                        }
                    },
                    { $unset: 'licensePlate' }
                ]
            )
            trackerModified = trackerResult.modifiedCount || 0
        }

        let userModified = 0
        if (userDocs > 0) {
            const cursor = User.find(userFilter, { trackers: 1 }).lean().cursor()
            for await (const user of cursor) {
                let changed = false
                const nextTrackers = (user.trackers || []).map((tracker) => {
                    if (!tracker || typeof tracker !== 'object') return tracker
                    if (!Object.prototype.hasOwnProperty.call(tracker, 'licensePlate')) return tracker

                    const next = { ...tracker }
                    if (!next.alias || !String(next.alias).trim()) next.alias = next.licensePlate
                    delete next.licensePlate
                    changed = true
                    return next
                })

                if (!changed) continue
                await User.updateOne({ _id: user._id }, { $set: { trackers: nextTrackers } })
                userModified += 1
            }
        }

        logger.log(
            `[${NAME}] trackerDocs=${trackerDocs} trackerModified=${trackerModified} userDocs=${userDocs} userModified=${userModified}`
        )

        return { trackerDocs, trackerModified, userDocs, userModified }
    }
}

#!/usr/bin/env node
require('dotenv').config()

const { mongoose } = require('track-data')

function bytesToMB(bytes) {
    return Math.round((Number(bytes || 0) / (1024 * 1024)) * 100) / 100
}

async function getCollectionStats(db, name) {
    try {
        return await db.command({ collStats: name })
    } catch (_) {
        return null
    }
}

async function main() {
    const mongoUrl = process.env.MONGO_URL
    if (!mongoUrl) throw new Error('MONGO_URL is required')

    await mongoose.connect(mongoUrl)
    const db = mongoose.connection.db
    const collections = await db.listCollections({}, { nameOnly: true }).toArray()

    const rows = []
    for (const { name } of collections) {
        const stats = await getCollectionStats(db, name)
        if (!stats) continue

        const totalIndexSize = Number(stats.totalIndexSize || 0)
        const storageSize = Number(stats.storageSize || 0)
        const dataSize = Number(stats.size || 0)

        rows.push({
            collection: name,
            count: Number(stats.count || 0),
            dataMB: bytesToMB(dataSize),
            storageMB: bytesToMB(storageSize),
            indexes: Number(stats.nindexes || 0),
            indexMB: bytesToMB(totalIndexSize),
            indexSizes: stats.indexSizes || {}
        })
    }

    rows.sort((a, b) => (b.dataMB + b.indexMB) - (a.dataMB + a.indexMB))

    console.log('=== MongoDB Storage Report ===')
    console.table(rows.map(row => ({
        collection: row.collection,
        count: row.count,
        dataMB: row.dataMB,
        storageMB: row.storageMB,
        indexes: row.indexes,
        indexMB: row.indexMB
    })))

    const top = rows[0]
    if (top) {
        const indexEntries = Object.entries(top.indexSizes)
            .map(([name, size]) => ({ name, mb: bytesToMB(size) }))
            .sort((a, b) => b.mb - a.mb)
        console.log(`Top collection by size: ${top.collection}`)
        console.table(indexEntries)
    }
}

main()
    .catch((err) => {
        console.error(err.message)
        process.exitCode = 1
    })
    .finally(async () => {
        try {
            await mongoose.disconnect()
        } catch (_) {
            // ignore disconnect errors
        }
    })


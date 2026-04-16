#!/usr/bin/env node
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { mongoose, models } = require('track-data')

function parseArgs(argv) {
    const args = { dryRun: false, only: null, help: false }
    for (const token of argv.slice(2)) {
        if (token === '--dry-run') args.dryRun = true
        else if (token.startsWith('--only=')) args.only = token.slice('--only='.length)
        else if (token === '--help' || token === '-h') args.help = true
        else if (!token.startsWith('--') && !args.only) args.only = token
    }
    return args
}

function printHelp() {
    console.log('Usage: node scripts/migrate.js [timestamp|timestamp-name] [--dry-run]')
    console.log('')
    console.log('Examples:')
    console.log('  node scripts/migrate.js')
    console.log('  node scripts/migrate.js --dry-run')
    console.log('  node scripts/migrate.js 20260411143000')
    console.log('  node scripts/migrate.js 20260411143000-add-company-index')
    console.log('  node scripts/migrate.js 20260410000000-backfill-user-language')
}

function normalizeDatePrefix(value) {
    return value.replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1$2$3')
}

function isValidMigrationFileName(fileName) {
    return /^\d{14}-[a-z0-9]+(?:-[a-z0-9]+)*\.js$/.test(fileName)
}

async function loadMigrations(dir, onlyRef) {
    const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.js'))
        .sort()

    const invalidFiles = files.filter((file) => !isValidMigrationFileName(file))
    if (invalidFiles.length) {
        throw new Error(
            `invalid migration filename(s): ${invalidFiles.join(', ')}. Expected pattern YYYYMMDDHHmmss-name.js`
        )
    }

    const loaded = files.map((file) => {
        const migration = require(path.join(dir, file))
        const name = migration.name || file.replace(/\.js$/, '')
        const aliases = Array.isArray(migration.aliases)
            ? [...new Set(migration.aliases.filter((value) => typeof value === 'string' && value.trim()))]
            : []
        if (typeof migration.up !== 'function') {
            throw new Error(`invalid migration ${file}: missing up()`)
        }
        return { file, name, aliases, up: migration.up }
    })

    if (!onlyRef) return loaded

    const only = onlyRef.replace(/\.js$/, '')
    const onlyNormalized = normalizeDatePrefix(only)
    const filtered = loaded.filter((m) => {
        const base = m.file.replace(/\.js$/, '')
        const refs = [m.name, base, ...m.aliases]
        const nameNormalized = normalizeDatePrefix(m.name)
        const baseNormalized = normalizeDatePrefix(base)
        const aliasNormalized = m.aliases.map(normalizeDatePrefix)
        return (
            refs.includes(only) ||
            m.file === onlyRef ||
            refs.some((ref) => ref.startsWith(only)) ||
            nameNormalized === onlyNormalized ||
            baseNormalized === onlyNormalized ||
            aliasNormalized.includes(onlyNormalized) ||
            nameNormalized.startsWith(onlyNormalized) ||
            baseNormalized.startsWith(onlyNormalized) ||
            aliasNormalized.some((ref) => ref.startsWith(onlyNormalized))
        )
    })

    if (filtered.length > 1) {
        const names = filtered.map((m) => m.name).join(', ')
        throw new Error(`multiple migrations match "${onlyRef}": ${names}`)
    }

    return filtered
}

async function main() {
    const { dryRun, only, help } = parseArgs(process.argv)
    if (help) {
        printHelp()
        return
    }
    const mongoUrl = process.env.MONGO_URL
    if (!mongoUrl) throw new Error('MONGO_URL is required')

    const migrationDir = path.join(__dirname, 'migrations')
    if (!fs.existsSync(migrationDir)) throw new Error(`migrations folder not found: ${migrationDir}`)

    const migrations = await loadMigrations(migrationDir, only)
    if (migrations.length === 0) {
        throw new Error(only ? `no migration found for "${only}"` : 'no migrations found')
    }

    await mongoose.connect(mongoUrl)
    const db = mongoose.connection.db
    const journal = db.collection('migrations')
    await journal.createIndex({ name: 1 }, { unique: true })

    const executed = await journal.find({}, { projection: { _id: 0, name: 1 } }).toArray()
    const executedSet = new Set(executed.map((d) => d.name))
    const pending = migrations.filter((m) => {
        const allNames = [m.name, ...m.aliases]
        return !allNames.some((migrationName) => executedSet.has(migrationName))
    })

    if (pending.length === 0) {
        console.log(dryRun ? 'No pending migrations (dry-run).' : 'No pending migrations.')
        return
    }

    console.log(`Running ${pending.length} migration(s)${dryRun ? ' [dry-run]' : ''}...`)
    for (const migration of pending) {
        console.log(`-> ${migration.name}`)
        const details = await migration.up({
            mongoose,
            db,
            models,
            logger: console,
            dryRun
        })
        if (!dryRun) {
            await journal.insertOne({
                name: migration.name,
                file: migration.file,
                aliases: migration.aliases,
                executedAt: new Date(),
                details: details || null
            })
        }
    }

    console.log(dryRun ? 'Dry-run completed.' : 'Migrations completed.')
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

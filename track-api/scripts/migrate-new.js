#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function printHelp() {
    console.log('Usage: node scripts/migrate-new.js <name | timestamp-name>')
    console.log('')
    console.log('Rules:')
    console.log('  - if only <name> is provided, timestamp is auto-generated')
    console.log('  - name must use lowercase kebab-case')
    console.log('  - full format: YYYYMMDDHHmmss-name')
    console.log('  - example: 20260411143000-add-company-index')
    console.log('  - example: add-company-index')
}

function pad2(n) {
    return String(n).padStart(2, '0')
}

function buildTimestamp(now = new Date()) {
    return [
        now.getUTCFullYear(),
        pad2(now.getUTCMonth() + 1),
        pad2(now.getUTCDate()),
        pad2(now.getUTCHours()),
        pad2(now.getUTCMinutes()),
        pad2(now.getUTCSeconds())
    ].join('')
}

function normalizeInput(arg) {
    const value = arg.replace(/\.js$/, '')
    const fullPattern = /^(\d{14})-([a-z0-9]+(?:-[a-z0-9]+)*)$/
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

    const full = value.match(fullPattern)
    if (full) return value

    if (!slugPattern.test(value)) {
        throw new Error(`invalid migration name "${arg}"`)
    }

    return `${buildTimestamp()}-${value}`
}

function buildTemplate(name) {
    return `const NAME = '${name}'

module.exports = {
    name: NAME,
    /**
     * @param {{ mongoose: import('mongoose'), db: import('mongodb').Db, models: Record<string, any>, logger: Console, dryRun: boolean }} ctx
     */
    async up({ logger, dryRun }) {
        if (dryRun) {
            logger.log(\`[\${NAME}] dry-run: no changes\`)
            return { ok: true, dryRun: true }
        }

        // TODO: implement migration
        logger.log(\`[\${NAME}] applied\`)
        return { ok: true }
    }
}
`
}

async function main() {
    const arg = process.argv[2]
    if (!arg || arg === '--help' || arg === '-h') {
        printHelp()
        return
    }

    const name = normalizeInput(arg)

    const dir = path.join(__dirname, 'migrations')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const filePath = path.join(dir, `${name}.js`)
    if (fs.existsSync(filePath)) {
        throw new Error(`migration already exists: ${path.basename(filePath)}`)
    }

    fs.writeFileSync(filePath, buildTemplate(name), 'utf8')
    console.log(`Created ${filePath}`)
}

main().catch((err) => {
    console.error(err.message)
    process.exitCode = 1
})

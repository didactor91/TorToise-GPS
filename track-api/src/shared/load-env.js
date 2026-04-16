const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

function fileExists(filePath) {
    try {
        return fs.existsSync(filePath)
    } catch (_) {
        return false
    }
}

function loadEnv() {
    const explicit = process.env.ENV_FILE
    if (explicit) {
        const explicitCandidates = path.isAbsolute(explicit)
            ? [explicit]
            : [
                path.resolve(process.cwd(), explicit),
                path.resolve(process.cwd(), '..', explicit),
                path.resolve(__dirname, '../../../', explicit)
            ]
        const explicitPath = explicitCandidates.find(fileExists) || explicitCandidates[0]
        dotenv.config({ path: explicitPath })
        return explicitPath
    }

    const candidates = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../deploy/.env.prod'),
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../../../deploy/.env.prod')
    ]

    const target = candidates.find(fileExists)
    if (target) {
        dotenv.config({ path: target })
        return target
    }

    dotenv.config()
    return null
}

module.exports = loadEnv

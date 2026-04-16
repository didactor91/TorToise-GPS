#!/usr/bin/env node
require('../src/shared/load-env')()

const argon2 = require('argon2')
const {
    models: { User, Company, Tracker, POI, Track },
    mongoose
} = require('track-data')
const {
    ACCESS_VERSION,
    FEATURE_KEYS,
    PERMISSION_KEYS,
    encodeFeatureKeys,
    encodePermissionKeys
} = require('../src/shared/access-control')

const VALID_LANGUAGES = new Set(['en', 'es', 'ca'])

async function main() {
    const mongoUrl = process.env.MONGO_URL
    if (!mongoUrl) throw new Error('MONGO_URL is required')

    const companySlug = process.env.E2E_COMPANY_SLUG || 'e2e-company'
    const companyName = process.env.E2E_COMPANY_NAME || 'E2E Company'

    const email = process.env.E2E_ADMIN_EMAIL || 'e2e.admin@tortoise.local'
    const password = process.env.E2E_ADMIN_PASSWORD || 'e2e-password'
    const language = process.env.E2E_ADMIN_LANGUAGE || 'en'

    const trackerSerial = process.env.E2E_TRACKER_SERIAL || '9900111001'
    const trackerAlias = process.env.E2E_TRACKER_ALIAS || 'E2E Truck 01'

    if (!VALID_LANGUAGES.has(language)) {
        throw new Error(`E2E_ADMIN_LANGUAGE must be one of en|es|ca (received ${language})`)
    }

    await mongoose.connect(mongoUrl)

    const featuresPacked = encodeFeatureKeys(FEATURE_KEYS)
    const permissionsPacked = encodePermissionKeys(PERMISSION_KEYS)

    const company = await Company.findOneAndUpdate(
        { slug: companySlug },
        {
            $set: {
                name: companyName,
                active: true,
                featuresPacked,
                featuresVersion: ACCESS_VERSION
            }
        },
        { new: true, upsert: true }
    )

    const hash = await argon2.hash(password)
    await User.findOneAndUpdate(
        { email },
        {
            $set: {
                name: 'E2E',
                surname: 'Admin',
                email,
                password: hash,
                language,
                role: 'staff',
                companyId: company._id,
                permissionsPacked,
                permissionsVersion: ACCESS_VERSION
            }
        },
        { upsert: true }
    )

    await Tracker.findOneAndUpdate(
        { serialNumber: trackerSerial },
        {
            $set: {
                companyId: company._id,
                serialNumber: trackerSerial,
                alias: trackerAlias
            }
        },
        { upsert: true }
    )

    await POI.findOneAndUpdate(
        { companyId: company._id, title: 'E2E HQ' },
        {
            $set: {
                companyId: company._id,
                title: 'E2E HQ',
                latitude: 41.3874,
                longitude: 2.1686,
                color: 'blue'
            }
        },
        { upsert: true }
    )

    await Track.deleteMany({ serialNumber: trackerSerial })
    await Track.create({
        serialNumber: trackerSerial,
        latitude: 41.3874,
        longitude: 2.1686,
        speed: 38,
        status: 1,
        date: new Date()
    })

    console.log('E2E seed completed')
    console.log(`company: ${companyName} (${companySlug})`)
    console.log(`user: ${email}`)
    console.log(`password: ${password}`)
    console.log(`language: ${language}`)
    console.log(`tracker: ${trackerSerial} (${trackerAlias})`)
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

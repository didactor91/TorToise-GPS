#!/usr/bin/env node
require('../src/shared/load-env')()

const { models: { User }, mongoose } = require('track-data')

async function main() {
    const email = process.argv[2]
    if (!email) {
        throw new Error('Usage: node scripts/promote-staff.js <email>')
    }

    const mongoUrl = process.env.MONGO_URL
    if (!mongoUrl) {
        throw new Error('MONGO_URL is required')
    }

    await mongoose.connect(mongoUrl)

    const user = await User.findOne({ email })
    if (!user) {
        throw new Error(`user with email ${email} not found`)
    }

    user.role = 'staff'
    await user.save()

    console.log(`User ${email} promoted to staff`)
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

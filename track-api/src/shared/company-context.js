'use strict'

const { models: { Company } } = require('track-data')

const DEFAULT_COMPANY_SLUG = process.env.DEFAULT_COMPANY_SLUG || 'default-company'
const DEFAULT_COMPANY_NAME = process.env.DEFAULT_COMPANY_NAME || 'Default Company'
const FORCE_SINGLE_COMPANY = process.env.FORCE_SINGLE_COMPANY === 'true'

async function getOrCreateDefaultCompany() {
    let company = await Company.findOne({ slug: DEFAULT_COMPANY_SLUG })
    if (!company) {
        company = await Company.create({ name: DEFAULT_COMPANY_NAME, slug: DEFAULT_COMPANY_SLUG })
    }
    return company
}

async function ensureUserCompany(user) {
    if (user.companyId) return user.companyId.toString()

    let company
    if (FORCE_SINGLE_COMPANY) {
        company = await getOrCreateDefaultCompany()
    } else {
        const slug = `company-${user._id.toString()}`
        company = await Company.findOne({ slug })
        if (!company) {
            company = await Company.create({
                name: `${user.name || 'User'} ${user.surname || ''}`.trim() || 'Personal Company',
                slug
            })
        }
    }

    user.companyId = company._id
    await user.save()
    return company._id.toString()
}

module.exports = { getOrCreateDefaultCompany, ensureUserCompany }

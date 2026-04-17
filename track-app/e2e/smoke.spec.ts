import { expect, test, type Page } from '@playwright/test'

const E2E_EMAIL = process.env.E2E_ADMIN_EMAIL || 'e2e.admin@tortoise.local'
const E2E_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'e2e-password'
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'livedemo@example.com'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'LiveDemo'
async function login(page: Page): Promise<void> {
  await page.goto('/login')
  const credentials = [
    { email: E2E_EMAIL, password: E2E_PASSWORD },
    { email: DEMO_EMAIL, password: DEMO_PASSWORD }
  ]

  for (const cred of credentials) {
    await page.locator('input[name="email"]').fill(cred.email)
    await page.locator('input[name="password"]').fill(cred.password)
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(600)
    if (/\/home$/.test(page.url())) return
  }
  await expect(page).toHaveURL(/\/home$/)
}


test('landing renders and navigates to login', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'TorToise GPS' })).toBeVisible()
  await page.getByRole('button').first().click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('input[name="email"]')).toBeVisible()
  await expect(page.locator('input[name="password"]')).toBeVisible()
})

test('protected routes require authentication', async ({ page }) => {
  const protectedRoutes = ['/profile', '/home', '/trackers', '/backoffice/companies']
  for (const route of protectedRoutes) {
    await page.goto(route)
    await expect(page).toHaveURL(/\/login$/)
  }
})

test('access to /register redirects to /login', async ({ page }) => {
  await page.goto('/register')
  await expect(page).toHaveURL(/\/login$/)
})

test('unknown route redirects to landing', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'TorToise GPS' })).toBeVisible()
})

test('real login with seeded user redirects to home and mounts navbar', async ({ page }) => {
  await login(page)
  await expect(page.locator('.nav-home')).toBeVisible()
})

test('logout returns user to login screen', async ({ page }) => {
  await login(page)
  await page.locator('.nav-icon-button').click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'TorToise GPS' })).toBeVisible()
})

test('profile sends language update mutation', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await expect(page.locator('select[name="language"]')).toBeVisible()

  await page.selectOption('select[name="language"]', 'ca')
  const reqPromise = page.waitForRequest((request) => {
    if (!request.url().includes('/graphql')) return false
    const body = request.postData() || ''
    return body.includes('updateUser')
  })
  await page.locator('form button[type="submit"]').first().click()
  const req = await reqPromise
  expect(req.postData() || '').toContain('"language":"ca"')
})

test('profile blocks password update when confirmation mismatches', async ({ page }) => {
  await login(page)
  await page.goto('/profile')

  const form = page.locator('form').filter({ has: page.locator('input[name="currentPassword"]') })
  await form.locator('input[name="currentPassword"]').fill('current-password')
  await form.locator('input[name="newPassword"]').fill('new-password-123')
  await form.locator('input[name="confirmPassword"]').fill('other-password-123')

  const sentPasswordUpdatePromise = page
    .waitForRequest((request) => {
      if (!request.url().includes('/graphql')) return false
      const body = request.postData() || ''
      return body.includes('updateUser') && body.includes('currentPassword')
    }, { timeout: 1500 })
    .then(() => true)
    .catch(() => false)

  await form.locator('button[type="submit"]').click()
  const sentPasswordUpdate = await sentPasswordUpdatePromise
  expect(sentPasswordUpdate).toBe(false)
})

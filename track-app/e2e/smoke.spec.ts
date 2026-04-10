import { expect, test, type Page } from '@playwright/test'

const E2E_EMAIL = process.env.E2E_ADMIN_EMAIL || 'e2e.admin@tortoise.local'
const E2E_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'e2e-password'

async function login(page: Page): Promise<void> {
  await page.goto('/login')
  await page.locator('input[name="email"]').fill(E2E_EMAIL)
  await page.locator('input[name="password"]').fill(E2E_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/home$/)
}

test('landing renders and navigates to login', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'TorToise GPS' })).toBeVisible()
  await expect(page.getByRole('button', { name: /log in/i })).toBeVisible()

  await page.getByRole('button', { name: /log in/i }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
})

test('unauthenticated access to /profile redirects to /login', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login$/)
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

import { test, expect } from '@playwright/test'

test.describe('Authentication flow', () => {
  test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('login page shows Login and Sign Up tabs', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible()
  })

  test('shows error message on invalid email/password', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('p.text-red-500, p.text-sm.text-red-500')).toBeVisible()
  })
})

test.describe('Dashboard', () => {
  // Tests requiring actual login need TEST_EMAIL and TEST_PASSWORD in .env.test
  test.skip('allows access to dashboard after login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', process.env.TEST_EMAIL!)
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Smart Money Tracker')).toBeVisible()
  })
})

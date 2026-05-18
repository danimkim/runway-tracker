import { test, expect } from '@playwright/test'

test.describe('Forgot password flow', () => {
  test('forgot password link is visible on login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible()
  })

  test('forgot password link navigates to /forgot-password', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL('/forgot-password')
  })

  test('forgot password page renders form correctly', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible()
  })

  test('back arrow on forgot password links to login', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.locator('a[href="/login"]').first().click()
    await expect(page).toHaveURL('/login')
  })

  test('submitting email navigates to confirm page', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.getByRole('button', { name: 'Send Reset Link' }).click()
    await expect(page).toHaveURL('/forgot-password/confirm')
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  })

  test('confirm page Back to Sign In button links to login', async ({ page }) => {
    await page.goto('/forgot-password/confirm')
    await page.getByRole('link', { name: 'Back to Sign In' }).click()
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Reset password page', () => {
  test('reset password page renders form', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByRole('heading', { name: 'Set New Password' })).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeVisible()
  })
})

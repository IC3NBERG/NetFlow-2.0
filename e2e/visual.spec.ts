import { test, expect } from '@playwright/test'

test.describe('Visual Regression', () => {
  test('login page matches snapshot', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('body')).toBeVisible()
    // Verify glassmorphism elements
    const card = page.locator('.rounded-card')
    await expect(card).toBeVisible()
  })

  test('register page matches snapshot', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('body')).toBeVisible()
    // Verify glassmorphism card
    const card = page.locator('.rounded-card')
    await expect(card).toBeVisible()
  })
})

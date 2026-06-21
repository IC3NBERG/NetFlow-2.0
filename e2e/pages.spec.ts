import { test, expect } from '@playwright/test'

test.describe('Public Pages', () => {
  test('login page has correct structure', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Accedi')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible()
  })

  test('register page has correct structure', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('h1')).toContainText('Crea il tuo account')
    const inputs = page.locator('input')
    await expect(inputs).toHaveCount(4)
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Registrati')).toBeVisible()
  })

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Accedi')).toBeVisible()
  })
})

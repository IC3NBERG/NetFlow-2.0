import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('renders sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/login')
    await expect(page.getByText('NetFlow')).toBeVisible()
  })

  test('renders 404 page for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent')
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('Pagina non trovata')).toBeVisible()
  })
})

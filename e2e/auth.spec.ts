import { test, expect } from '@playwright/test'

test.describe('Auth Flow', () => {
  test('renders login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Accedi a NetFlow')).toBeVisible()
    await expect(page.getByText('Password dimenticata?')).toBeVisible()
  })

  test('renders register page', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Crea il tuo account')).toBeVisible()
    await expect(page.getByPlaceholder('Nome completo')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('Conferma password')).toBeVisible()
  })

  test('shows validation errors on empty login', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Accedi' }).click()
    await expect(page.getByText('Accedi a NetFlow')).toBeVisible()
  })

  test('redirects to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('renders forgot password page', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByText('Recupera password')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByText('Torna al login')).toBeVisible()
  })

  test('renders reset password page with error without token', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByRole('heading', { name: 'Nuova password' })).toBeVisible()
    await expect(page.getByText('Nessun token di recupero trovato')).toBeVisible()
  })
})

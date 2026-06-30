import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '../shared/layouts/MainLayout'
import { useAuth } from './providers/AuthProvider'
import { lazyPage } from './protectedRouteConfig'
import { useCustomizationStore } from '../lib/stores/customization'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage as SignUpPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { AuthCallbackPage } from '../features/auth/pages/AuthCallbackPage'
import { OnboardingPage } from '../features/auth/pages/OnboardingPage'
import { NotFoundPage } from '../features/not-found/pages/NotFoundPage'
import { SharedViewPage } from '../features/shared/pages/SharedViewPage'

function needsOnboarding(user: { full_name: string | null; tax_regime: string | null }): boolean {
  return !user.full_name || user.full_name.length < 2
}

function useHomeRoute(): string {
  const sidebarOrder = useCustomizationStore((s) => s.sidebarOrder)
  return sidebarOrder[0] ?? '/dashboard'
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (needsOnboarding(user)) return <Navigate to="/onboarding" replace />
  return <MainLayout>{children}</MainLayout>
}

function OnboardingGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const homeRoute = useHomeRoute()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!needsOnboarding(user)) return <Navigate to={homeRoute} replace />
  return children
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, clearError } = useAuth()
  const homeRoute = useHomeRoute()
  useEffect(() => { clearError() }, [clearError])
  if (isLoading) return null
  if (user) {
    if (needsOnboarding(user)) return <Navigate to="/onboarding" replace />
    return <Navigate to={homeRoute} replace />
  }
  return children
}

function HomeRedirect() {
  const homeRoute = useHomeRoute()
  const params = new URLSearchParams(window.location.search)
  const hasAuthCode = params.has('code')
  const hasAuthHash = window.location.hash?.includes('access_token=')

  if (hasAuthCode || hasAuthHash) {
    const search = window.location.search
    const hash = window.location.hash
    return <Navigate to={`/auth/callback${search}${hash}`} replace />
  }

  return <Navigate to={homeRoute} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingGuard><OnboardingPage /></OnboardingGuard>} />
        <Route path="/shared/:token" element={<SharedViewPage />} />
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/notifications" element={<AuthGate><lazyPage.NotificationsPage /></AuthGate>} />
        <Route path="/dashboard" element={<AuthGate><lazyPage.DashboardPage /></AuthGate>} />
        <Route path="/jobs" element={<AuthGate><lazyPage.JobsPage /></AuthGate>} />
        <Route path="/quotes" element={<AuthGate><lazyPage.QuotesPage /></AuthGate>} />
        <Route path="/clients" element={<AuthGate><lazyPage.ClientsPage /></AuthGate>} />
        <Route path="/invoicing" element={<AuthGate><lazyPage.InvoicingPage /></AuthGate>} />
        <Route path="/ledger" element={<AuthGate><lazyPage.RegisterPage /></AuthGate>} />
        <Route path="/calendar" element={<AuthGate><lazyPage.CalendarPage /></AuthGate>} />
        <Route path="/expenses" element={<AuthGate><lazyPage.ExpensesPage /></AuthGate>} />
        <Route path="/settings" element={<AuthGate><lazyPage.SettingsPage /></AuthGate>} />
        <Route path="/customization" element={<AuthGate><lazyPage.CustomizationPage /></AuthGate>} />
        <Route path="/help" element={<AuthGate><lazyPage.HelpPage /></AuthGate>} />
        <Route path="/guide" element={<AuthGate><lazyPage.GuidePage /></AuthGate>} />
        <Route path="/account" element={<AuthGate><lazyPage.AccountPage /></AuthGate>} />
        <Route path="/legal" element={<AuthGate><lazyPage.LegalPage /></AuthGate>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

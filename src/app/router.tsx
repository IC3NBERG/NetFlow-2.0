import { useEffect, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '../shared/layouts/MainLayout'
import { useAuth } from './providers/AuthProvider'
import { PageLoader } from '../shared/ui/PageLoader'
import { lazyPage } from './protectedRouteConfig'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage as SignUpPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { OnboardingPage } from '../features/auth/pages/OnboardingPage'
import { NotFoundPage } from '../features/not-found/pages/NotFoundPage'
import { SharedViewPage } from '../features/shared/pages/SharedViewPage'

function needsOnboarding(user: { full_name: string | null; tax_regime: string | null }): boolean {
  return !user.full_name || user.full_name.length < 2
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (needsOnboarding(user)) return <Navigate to="/onboarding" replace />
  return <MainLayout>{children}</MainLayout>
}

function OnboardingGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!needsOnboarding(user)) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, clearError } = useAuth()
  useEffect(() => { clearError() }, [clearError])
  if (isLoading) return <PageLoader />
  if (user) {
    if (needsOnboarding(user)) return <Navigate to="/onboarding" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingGuard><OnboardingPage /></OnboardingGuard>} />
        <Route path="/shared/:token" element={<SharedViewPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.DashboardPage /></Suspense></AuthGate>} />
        <Route path="/jobs" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.JobsPage /></Suspense></AuthGate>} />
        <Route path="/quotes" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.QuotesPage /></Suspense></AuthGate>} />
        <Route path="/clients" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.ClientsPage /></Suspense></AuthGate>} />
        <Route path="/invoicing" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.InvoicingPage /></Suspense></AuthGate>} />
        <Route path="/ledger" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.RegisterPage /></Suspense></AuthGate>} />
        <Route path="/calendar" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.CalendarPage /></Suspense></AuthGate>} />
        <Route path="/expenses" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.ExpensesPage /></Suspense></AuthGate>} />
        <Route path="/settings" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.SettingsPage /></Suspense></AuthGate>} />
        <Route path="/guide" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.GuidePage /></Suspense></AuthGate>} />
        <Route path="/account" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.AccountPage /></Suspense></AuthGate>} />
        <Route path="/legal" element={<AuthGate><Suspense fallback={<PageLoader />}><lazyPage.LegalPage /></Suspense></AuthGate>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

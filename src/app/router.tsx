import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '../shared/layouts/MainLayout'
import { useAuth } from './providers/AuthProvider'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage as SignUpPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { OnboardingPage } from '../features/auth/pages/OnboardingPage'
import { NotFoundPage } from '../features/not-found/pages/NotFoundPage'
import { SharedViewPage } from '../features/shared/pages/SharedViewPage'

const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const JobsPage = lazy(() => import('../features/jobs/pages/JobsPage').then(m => ({ default: m.JobsPage })))
const ClientsPage = lazy(() => import('../features/clients/pages/ClientsPage').then(m => ({ default: m.ClientsPage })))
const InvoicingPage = lazy(() => import('../features/invoicing/pages/InvoicingPage').then(m => ({ default: m.InvoicingPage })))
const RegisterPage = lazy(() => import('../features/register/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ExpensesPage = lazy(() => import('../features/expenses/pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })))
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const GuidePage = lazy(() => import('../features/guide/pages/GuidePage').then(m => ({ default: m.GuidePage })))
const AccountPage = lazy(() => import('../features/account/pages/AccountPage').then(m => ({ default: m.AccountPage })))
const LegalPage = lazy(() => import('../features/legal/pages/LegalPage').then(m => ({ default: m.LegalPage })))
const QuotesPage = lazy(() => import('../features/quotes/pages/QuotesPage').then(m => ({ default: m.QuotesPage })))
const CalendarPage = lazy(() => import('../features/calendar/pages/CalendarPage').then(m => ({ default: m.CalendarPage })))
const ChangelogPage = lazy(() => import('../features/changelog/pages/ChangelogPage').then(m => ({ default: m.ChangelogPage })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-text-secondary">Caricamento...</p>
      </div>
    </div>
  )
}

function needsOnboarding(user: { full_name: string | null; tax_regime: string | null }): boolean {
  return !user.full_name || user.full_name.length < 2
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (needsOnboarding(user)) return <Navigate to="/onboarding" replace />
  return children
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!needsOnboarding(user)) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }: { children: React.ReactNode }) {
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
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/jobs" element={<Suspense fallback={<PageLoader />}><JobsPage /></Suspense>} />
          <Route path="/quotes" element={<Suspense fallback={<PageLoader />}><QuotesPage /></Suspense>} />
          <Route path="/clients" element={<Suspense fallback={<PageLoader />}><ClientsPage /></Suspense>} />
          <Route path="/invoicing" element={<Suspense fallback={<PageLoader />}><InvoicingPage /></Suspense>} />
          <Route path="/ledger" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
          <Route path="/calendar" element={<Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>} />
          <Route path="/expenses" element={<Suspense fallback={<PageLoader />}><ExpensesPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="/guide" element={<Suspense fallback={<PageLoader />}><GuidePage /></Suspense>} />
          <Route path="/account" element={<Suspense fallback={<PageLoader />}><AccountPage /></Suspense>} />
          <Route path="/legal" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />
          <Route path="/changelog" element={<Suspense fallback={<PageLoader />}><ChangelogPage /></Suspense>} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

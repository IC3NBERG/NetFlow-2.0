import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '../shared/layouts/MainLayout'
import { useAuth } from './providers/AuthProvider'
import { protectedRouteConfig } from './protectedRouteConfig'
import { PageLoader } from '../shared/ui/PageLoader'
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

function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (needsOnboarding(user)) return <Navigate to="/onboarding" replace />
  return <MainLayout />
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<ProtectedRoute />}>
          {protectedRouteConfig.map(({ path }) => (
            <Route key={path} path={path} />
          ))}
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

import { lazy, Suspense, type ReactNode } from 'react'
import { PageLoader } from '../shared/ui/PageLoader'

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

export interface RouteConfig {
  path: string
  element: ReactNode
}

export const protectedRouteConfig: RouteConfig[] = [
  { path: '/dashboard', element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
  { path: '/jobs', element: <Suspense fallback={<PageLoader />}><JobsPage /></Suspense> },
  { path: '/quotes', element: <Suspense fallback={<PageLoader />}><QuotesPage /></Suspense> },
  { path: '/clients', element: <Suspense fallback={<PageLoader />}><ClientsPage /></Suspense> },
  { path: '/invoicing', element: <Suspense fallback={<PageLoader />}><InvoicingPage /></Suspense> },
  { path: '/ledger', element: <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense> },
  { path: '/calendar', element: <Suspense fallback={<PageLoader />}><CalendarPage /></Suspense> },
  { path: '/expenses', element: <Suspense fallback={<PageLoader />}><ExpensesPage /></Suspense> },
  { path: '/settings', element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
  { path: '/guide', element: <Suspense fallback={<PageLoader />}><GuidePage /></Suspense> },
  { path: '/account', element: <Suspense fallback={<PageLoader />}><AccountPage /></Suspense> },
  { path: '/legal', element: <Suspense fallback={<PageLoader />}><LegalPage /></Suspense> },
]

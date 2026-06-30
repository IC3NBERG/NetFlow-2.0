import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Archive,
  Receipt,
  Settings,
  Users,
  LogOut,
  FileSpreadsheet,
  CalendarDays,
  Sliders,
  LifeBuoy,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../app/providers/AuthProvider'
import { Logo } from '../ui/Logo'
import { useCustomizationStore } from '../../lib/stores/customization'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Lavori' },
  { to: '/clients', icon: Users, label: 'Clienti' },
  { to: '/quotes', icon: FileSpreadsheet, label: 'Preventivi' },
  { to: '/invoicing', icon: FileText, label: 'Fatture' },
  { to: '/expenses', icon: Receipt, label: 'Uscite' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/ledger', icon: Archive, label: 'Registro' },
]

export function Sidebar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const sidebarOrder = useCustomizationStore((s) => s.sidebarOrder)

  const orderedNavItems = [...navItems].sort((a, b) => {
    const idxA = sidebarOrder.indexOf(a.to)
    const idxB = sidebarOrder.indexOf(b.to)
    if (idxA === -1) return 1
    if (idxB === -1) return -1
    return idxA - idxB
  })

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col bg-surface/60 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <Logo />
        <span className="text-xl font-bold">NetFlow</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {orderedNavItems.map((item) => (
          <motion.div
            key={item.to}
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <NavLink to={item.to} className="block">
              {({ isActive }) => (
                <div
                  className={cn(
                    'relative flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors duration-300',
                    isActive
                      ? 'text-white'
                      : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-full bg-brand shadow-[0_0_20px_rgba(197,150,58,0.35)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </span>
                </div>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="px-3 py-3 space-y-2">
        <NavLink to="/customization" className="block">
          {({ isActive }) => (
            <div
              className={cn(
                'relative flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors duration-300',
                isActive
                  ? 'text-white'
                  : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-full bg-brand shadow-[0_0_20px_rgba(197,150,58,0.35)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Sliders className="h-5 w-5 shrink-0" />
                Personalizza
              </span>
            </div>
          )}
        </NavLink>
        <NavLink to="/settings" className="block">
          {({ isActive }) => (
            <div
              className={cn(
                'relative flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors duration-300',
                isActive
                  ? 'text-white'
                  : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-full bg-brand shadow-[0_0_20px_rgba(197,150,58,0.35)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Settings className="h-5 w-5 shrink-0" />
                Impostazioni
              </span>
            </div>
          )}
        </NavLink>
        <NavLink to="/help" className="block">
          {({ isActive }) => (
            <div
              className={cn(
                'relative flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors duration-300',
                isActive
                  ? 'text-white'
                  : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-full bg-brand shadow-[0_0_20px_rgba(197,150,58,0.35)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <LifeBuoy className="h-5 w-5 shrink-0" />
                Aiuto/Contatti
              </span>
            </div>
          )}
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-text-secondary hover:bg-expense/10 hover:text-expense transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Esci
        </button>
        <p className="px-4 text-xs text-text-secondary">NetFlow v{__APP_VERSION__}</p>
      </div>
    </aside>
  )
}

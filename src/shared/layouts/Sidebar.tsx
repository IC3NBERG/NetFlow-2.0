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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../app/providers/AuthProvider'
import { Logo } from '../ui/Logo'
import { useCustomizationStore } from '../../lib/stores/customization'
import { useUIStore } from '../../lib/stores/ui'

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
  const sidebarMode = useUIStore((s) => s.sidebarMode)
  const cycleSidebarMode = useUIStore((s) => s.cycleSidebarMode)

  const isIcons = sidebarMode === 'icons'
  const isHidden = sidebarMode === 'hidden'

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
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col bg-surface/60 backdrop-blur-xl transition-all duration-300 ease-out md:flex overflow-hidden',
        isHidden ? 'w-0 border-r-0' : isIcons ? 'w-[72px] border-r border-border' : 'w-[280px] border-r border-border',
      )}
    >
      <div className={cn('flex items-center py-6 transition-all duration-300', isHidden ? 'px-0' : isIcons ? 'justify-center px-0' : 'gap-3 px-6')}>
        <div className={cn('shrink-0', isHidden && 'hidden')}>
          <Logo />
        </div>
        {!isIcons && !isHidden && (
          <span className="text-xl font-bold whitespace-nowrap">NetFlow</span>
        )}
      </div>

      <nav className={cn('flex-1 space-y-1 py-4', isHidden ? 'px-0' : isIcons ? 'px-2' : 'px-3')}>
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
                    'relative flex items-center rounded-full text-sm font-medium transition-colors duration-300',
                    isIcons ? 'justify-center p-2.5' : 'gap-3 px-4 py-3',
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
                  <span className={cn('relative z-10 flex items-center', isIcons ? '' : 'gap-3')}>
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isIcons && item.label}
                  </span>
                </div>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className={cn('space-y-2 py-3', isHidden ? 'px-0' : isIcons ? 'px-2' : 'px-3')}>
        {!isHidden && (
          <>
            <NavLink to="/customization" className="block">
              {({ isActive }) => (
                <div
                  className={cn(
                    'relative flex items-center rounded-full text-sm font-medium transition-colors duration-300',
                    isIcons ? 'justify-center p-2.5' : 'gap-3 px-4 py-3',
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
                  <span className={cn('relative z-10 flex items-center', isIcons ? '' : 'gap-3')}>
                    <Sliders className="h-5 w-5 shrink-0" />
                    {!isIcons && 'Personalizza'}
                  </span>
                </div>
              )}
            </NavLink>
            <NavLink to="/settings" className="block">
              {({ isActive }) => (
                <div
                  className={cn(
                    'relative flex items-center rounded-full text-sm font-medium transition-colors duration-300',
                    isIcons ? 'justify-center p-2.5' : 'gap-3 px-4 py-3',
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
                  <span className={cn('relative z-10 flex items-center', isIcons ? '' : 'gap-3')}>
                    <Settings className="h-5 w-5 shrink-0" />
                    {!isIcons && 'Impostazioni'}
                  </span>
                </div>
              )}
            </NavLink>
            <NavLink to="/help" className="block">
              {({ isActive }) => (
                <div
                  className={cn(
                    'relative flex items-center rounded-full text-sm font-medium transition-colors duration-300',
                    isIcons ? 'justify-center p-2.5' : 'gap-3 px-4 py-3',
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
                  <span className={cn('relative z-10 flex items-center', isIcons ? '' : 'gap-3')}>
                    <LifeBuoy className="h-5 w-5 shrink-0" />
                    {!isIcons && 'Aiuto/Contatti'}
                  </span>
                </div>
              )}
            </NavLink>
          </>
        )}

        {!isHidden && (
          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center rounded-full text-sm font-medium text-text-secondary hover:bg-expense/10 hover:text-expense transition-all duration-200',
              isIcons ? 'justify-center p-2.5' : 'gap-3 px-4 py-3',
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isIcons && 'Esci'}
          </button>
        )}

        {!isHidden && !isIcons && (
          <p className="px-4 text-xs text-text-secondary">NetFlow v{__APP_VERSION__}</p>
        )}

        <button
          onClick={cycleSidebarMode}
          className={cn(
            'flex w-full items-center justify-center rounded-full text-text-secondary hover:bg-surface/80 hover:text-text-primary transition-all duration-200',
            isIcons ? 'p-2.5' : 'px-4 py-3 gap-3',
          )}
          title={isHidden ? 'Espandi sidebar' : isIcons ? 'Mostra etichette' : 'Comprimi sidebar'}
        >
          {isHidden ? (
            <ChevronRight className="h-5 w-5" />
          ) : isIcons ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Comprimi</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

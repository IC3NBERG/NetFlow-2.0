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
  const setSidebarMode = useUIStore((s) => s.setSidebarMode)
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
    <>
      {/* Floating toggle when sidebar is hidden */}
      {isHidden && (
        <button
          onClick={() => setSidebarMode('full')}
          className="fixed left-4 top-3 md:top-4 z-50 hidden md:flex items-center justify-center h-8 w-8 rounded-full bg-surface/80 backdrop-blur-xl border border-border text-text-secondary hover:text-text-primary hover:bg-surface transition-all shadow-lg"
          title="Espandi sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen flex-col bg-surface/60 backdrop-blur-xl transition-all duration-300 ease-out md:flex overflow-hidden',
          isHidden ? 'w-0 border-r-0' : isIcons ? 'w-[72px] border-r border-border' : 'w-[280px] border-r border-border',
        )}
      >
        <div className={cn(
          'flex items-center transition-all duration-300 shrink-0',
          isHidden ? 'px-0' : isIcons ? 'justify-center' : 'justify-between px-6',
          'py-5',
        )}>
          {isHidden ? null : isIcons ? (
            <Logo className="h-9 w-9" />
          ) : (
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-xl font-bold whitespace-nowrap">NetFlow</span>
            </div>
          )}
          {!isHidden && (
            <button
              onClick={cycleSidebarMode}
              className="flex items-center justify-center h-7 w-7 rounded-full text-text-secondary hover:bg-surface/80 hover:text-text-primary transition-all"
              title={isIcons ? 'Comprimi' : 'Comprimi'}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
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
        </div>
      </aside>
    </>
  )
}

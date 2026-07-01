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
import { useUIStore } from '../../lib/stores/ui'
import { useRef, useState } from 'react'
import type { SidebarMode } from '../../lib/stores/ui'

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

const HIDDEN_WIDTH = 0
const ICONS_WIDTH = 72
const FULL_WIDTH = 240
const MAX_WIDTH = 400

function snapMode(width: number): SidebarMode {
  if (width < (HIDDEN_WIDTH + ICONS_WIDTH) / 2) return 'hidden'
  if (width < (ICONS_WIDTH + FULL_WIDTH) / 2) return 'icons'
  return 'full'
}

export function Sidebar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const sidebarOrder = useCustomizationStore((s) => s.sidebarOrder)
  const sidebarMode = useUIStore((s) => s.sidebarMode)
  const setSidebarMode = useUIStore((s) => s.setSidebarMode)
  const setSidebarDragWidth = useUIStore((s) => s.setSidebarDragWidth)

  const isIcons = sidebarMode === 'icons'
  const isHidden = sidebarMode === 'hidden'

  const [dragWidth, setDragWidth] = useState<number | null>(null)
  const isDragging = dragWidth !== null

  const baseWidth = isHidden ? HIDDEN_WIDTH : isIcons ? ICONS_WIDTH : FULL_WIDTH
  const displayWidth = dragWidth ?? baseWidth

  const resizeRef = useRef({ startX: 0, startWidth: 0 })

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    resizeRef.current = { startX: e.clientX, startWidth: displayWidth }

    function onMove(e: MouseEvent) {
      const { startX, startWidth } = resizeRef.current
      const newWidth = Math.max(HIDDEN_WIDTH, Math.min(MAX_WIDTH, startWidth + e.clientX - startX))
      setDragWidth(newWidth)
      setSidebarDragWidth(newWidth)
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      setDragWidth((current) => {
        if (current !== null) {
          const mode = snapMode(current)
          setSidebarMode(mode)
        }
        setSidebarDragWidth(null)
        return null
      })
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

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
      {/* Invisible grab handle at left edge when sidebar is hidden */}
      {isHidden && (
        <div
          className="fixed left-0 top-0 bottom-0 z-50 w-1.5 cursor-col-resize hover:bg-brand/20 transition-colors"
          onMouseDown={handleResizeStart}
          onClick={() => setSidebarMode('full')}
        />
      )}

      <motion.aside
        animate={{ width: displayWidth }}
        transition={
          isDragging
            ? { duration: 0 }
            : { type: 'spring', stiffness: 280, damping: 24, mass: 1 }
        }
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen flex-col bg-surface/60 backdrop-blur-xl md:flex overflow-hidden border-r border-border',
        )}
      >
        <div className={cn(
          'flex items-center shrink-0 relative',
          isHidden ? 'px-0' : isIcons ? 'justify-center' : 'justify-between px-6',
          'py-5',
        )}>
          {isHidden ? null : isIcons ? (
            <Logo />
          ) : (
            <div className="flex items-center gap-3">
              <Logo />
              <motion.span
                initial={false}
                animate={{ opacity: isIcons ? 0 : 1, width: isIcons ? 0 : 'auto' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="text-xl font-bold overflow-hidden whitespace-nowrap"
              >
                NetFlow
              </motion.span>
            </div>
          )}
        </div>

        <nav className={cn('flex-1 space-y-1 py-4', isHidden ? 'px-0' : isIcons ? 'px-2' : 'px-3')}>
          {orderedNavItems.map((item) => (
            <div key={item.to}>
              <NavLink to={item.to} className="block">
                {({ isActive }) => (
                  <div
                    title={isIcons ? item.label : undefined}
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
                        transition={{ type: 'spring', stiffness: 300, damping: 34, mass: 0.8 }}
                      />
                    )}
                    <span className={cn('relative z-10 flex items-center', isIcons ? '' : 'gap-3')}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      <motion.span
                        initial={false}
                        animate={{ opacity: isIcons ? 0 : 1, width: isIcons ? 0 : 'auto' }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    </span>
                  </div>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        <div className={cn('space-y-2 py-3', isHidden ? 'px-0' : isIcons ? 'px-2' : 'px-3')}>
          {!isHidden && (
            <>
              <NavLink to="/customization" className="block">
                {({ isActive }) => (
                  <div
                    title={isIcons ? 'Personalizza' : undefined}
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
                        transition={{ type: 'spring', stiffness: 300, damping: 34, mass: 0.8 }}
                      />
                    )}
                    <span className={cn('relative z-10 flex items-center', isIcons ? '' : 'gap-3')}>
                      <Sliders className="h-5 w-5 shrink-0" />
                      <motion.span
                        initial={false}
                        animate={{ opacity: isIcons ? 0 : 1, width: isIcons ? 0 : 'auto' }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        Personalizza
                      </motion.span>
                    </span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/settings" className="block">
                {({ isActive }) => (
                  <div
                    title={isIcons ? 'Impostazioni' : undefined}
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
                        transition={{ type: 'spring', stiffness: 300, damping: 34, mass: 0.8 }}
                      />
                    )}
                    <span className={cn('relative z-10 flex items-center', isIcons ? '' : 'gap-3')}>
                      <Settings className="h-5 w-5 shrink-0" />
                      <motion.span
                        initial={false}
                        animate={{ opacity: isIcons ? 0 : 1, width: isIcons ? 0 : 'auto' }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        Impostazioni
                      </motion.span>
                    </span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/help" className="block">
                {({ isActive }) => (
                  <div
                    title={isIcons ? 'Aiuto/Contatti' : undefined}
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
                        transition={{ type: 'spring', stiffness: 300, damping: 34, mass: 0.8 }}
                      />
                    )}
                    <span className={cn('relative z-10 flex items-center', isIcons ? '' : 'gap-3')}>
                      <LifeBuoy className="h-5 w-5 shrink-0" />
                      <motion.span
                        initial={false}
                        animate={{ opacity: isIcons ? 0 : 1, width: isIcons ? 0 : 'auto' }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        Aiuto/Contatti
                      </motion.span>
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
              title={isIcons ? 'Esci' : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <motion.span
                initial={false}
                animate={{ opacity: isIcons ? 0 : 1, width: isIcons ? 0 : 'auto' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden whitespace-nowrap"
              >
                Esci
              </motion.span>
            </button>
          )}

          {!isHidden && !isIcons && (
            <p className="px-4 text-xs text-text-secondary">
              NetFlow v{__APP_VERSION__}
            </p>
          )}
        </div>

        {/* Resize handle on right edge */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand/30 active:bg-brand/50 transition-colors z-50"
          onMouseDown={handleResizeStart}
        />
      </motion.aside>
    </>
  )
}

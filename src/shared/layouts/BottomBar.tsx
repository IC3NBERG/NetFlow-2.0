import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Briefcase, FileText, Archive, Receipt, Users, Settings, FileSpreadsheet, CalendarDays, LifeBuoy } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useCustomizationStore } from '../../lib/stores/customization'

const bottomNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Lavori' },
  { to: '/clients', icon: Users, label: 'Clienti' },
  { to: '/quotes', icon: FileSpreadsheet, label: 'Preventivi' },
  { to: '/invoicing', icon: FileText, label: 'Fatture' },
  { to: '/expenses', icon: Receipt, label: 'Uscite' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/ledger', icon: Archive, label: 'Registro' },
  { to: '/settings', icon: Settings, label: 'Impostazioni' },
  { to: '/help', icon: LifeBuoy, label: 'Aiuto' },
]

export function BottomBar() {
  const sidebarOrder = useCustomizationStore((s) => s.sidebarOrder)

  const orderedBottomNavItems = [...bottomNavItems]
    .filter((item) => item.to !== '/settings' && item.to !== '/help')
    .sort((a, b) => {
      const idxA = sidebarOrder.indexOf(a.to)
      const idxB = sidebarOrder.indexOf(b.to)
      if (idxA === -1) return 1
      if (idxB === -1) return -1
      return idxA - idxB
    })

  const settingsItem = bottomNavItems.find((item) => item.to === '/settings')
  if (settingsItem) {
    orderedBottomNavItems.push(settingsItem)
  }
  const helpItem = bottomNavItems.find((item) => item.to === '/help')
  if (helpItem) {
    orderedBottomNavItems.push(helpItem)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-surface/80 backdrop-blur-xl px-2 py-2 md:hidden">
      {orderedBottomNavItems.map((item) => (
        <motion.div
          key={item.to}
          layout
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          <NavLink to={item.to} className="block">
            {({ isActive }) => (
              <div
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                  isActive ? 'text-brand' : 'text-text-secondary',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottombar-active"
                    className="absolute -inset-1 rounded-full bg-brand/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </span>
              </div>
            )}
          </NavLink>
        </motion.div>
      ))}
    </nav>
  )
}

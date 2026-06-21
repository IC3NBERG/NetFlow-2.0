import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, FileText, Archive, Receipt, Users, Settings, FileSpreadsheet, CalendarDays } from 'lucide-react'
import { cn } from '../../lib/utils'

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
]

export function BottomBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-surface/80 backdrop-blur-xl px-2 py-2 md:hidden" style={{ boxShadow: '0 -1px 0 rgba(255,255,255,0.06)' }}>
      {bottomNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'text-brand'
                : 'text-text-secondary',
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

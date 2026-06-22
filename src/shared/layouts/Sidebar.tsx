import { NavLink, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../app/providers/AuthProvider'
import { Logo } from '../ui/Logo'

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

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col bg-surface/60 backdrop-blur-xl md:flex border-r border-border/30">
      <div className="flex items-center gap-3 px-6 py-6">
        <Logo />
        <span className="text-xl font-bold">NetFlow</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand text-white'
                  : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 space-y-2 border-t border-border/30">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-brand text-white'
: 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
              )
            }
          >
            <Settings className="h-5 w-5" />
            Impostazioni
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

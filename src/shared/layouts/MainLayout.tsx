import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { BottomBar } from './BottomBar'
import { useSync } from '../../app/providers/SyncProvider'
import { useRealtimeSync } from '../../lib/hooks/useRealtimeSync'
import { useRealtimeNotifications } from '../../lib/hooks/useRealtimeNotifications'
import { useNewNotificationTracker } from '../../lib/hooks/useRealtimeNotifications'
import { useOsNotifications } from '../../lib/hooks/useOsNotifications'
import { useFaviconBadge } from '../../lib/hooks/useFaviconBadge'
import { useNotificationSound } from '../../lib/hooks/useNotificationSound'
import { useNotificationCleanup } from '../../lib/hooks/useNotificationCleanup'
import { useGoalNotifications } from '../../lib/hooks/useGoalNotifications'
import { SyncBanner } from '../../shared/ui/SyncBanner'
import { BackupReminder } from '../../shared/ui/BackupReminder'
import { NotificationCenter } from '../../shared/ui/NotificationCenter'
import { FiscalYearSelector } from '../../shared/ui/FiscalYearSelector'
import { CommandPalette } from '../../shared/ui/CommandPalette'
import { cn } from '../../lib/utils'
import { Info, Search, Shield } from 'lucide-react'
import type { ReactNode } from 'react'
import { useUIStore } from '../../lib/stores/ui'

export function MainLayout({ children }: { children?: ReactNode }) {
  const { isOnline, queueLength, isSyncing, syncStatus } = useSync()
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarMode = useUIStore((s) => s.sidebarMode)
  useRealtimeSync()
  useRealtimeNotifications()
  useNewNotificationTracker()
  useOsNotifications()
  useFaviconBadge()
  useNotificationSound()
  useNotificationCleanup()
  useGoalNotifications()

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Ambient light orbs for glassmorphism depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand/8 animate-float-slow blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#00D2FF]/6 animate-float-medium blur-[100px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-brand/5 animate-pulse-glow blur-[80px]" />
      </div>

      <CommandPalette />
      <SyncBanner />
      <BackupReminder />
      <Sidebar />
      <div className={cn(
          sidebarMode === 'full' ? 'md:ml-[240px]' : sidebarMode === 'icons' ? 'md:ml-[72px]' : 'md:ml-0',
          'ml-0 pb-20 md:pb-0 transition-[margin-left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        )}>
        <header className="sticky top-0 z-30 flex items-center justify-between bg-gradient-to-b from-surface-alt via-surface-alt/70 to-surface-alt/0 backdrop-blur-xl px-4 md:px-6 lg:px-8 py-3 md:py-4 header-blur-edge">
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <FiscalYearSelector />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { metaKey: true, key: 'k' }))}
              className="hidden md:inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-text-secondary hover:bg-surface/80 transition-all border border-border"
              title="Cerca (Cmd+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Cerca...</span>
              <kbd className="rounded border border-border px-1 text-[9px]">⌘K</kbd>
            </button>
            <button
              onClick={() => navigate('/guide')}
              className="hidden md:inline-flex rounded-full p-2 text-text-secondary hover:bg-surface/80 hover:text-brand transition-all"
              title="Guida Fiscale"
            >
              <Info className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/legal')}
              className="hidden md:inline-flex rounded-full p-2 text-text-secondary hover:bg-surface/80 hover:text-brand transition-all"
              title="Privacy e trattamento dati"
            >
              <Shield className="h-5 w-5" />
            </button>
            <NotificationCenter />
            <div className="flex items-center gap-1 md:gap-2 text-xs">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  isOnline ? 'bg-success' : 'bg-expense',
                )}
              />
              <span className="hidden md:inline text-text-secondary">
                {syncStatus === 'conflict'
                  ? 'Conflitto sync'
                  : syncStatus === 'error'
                    ? 'Errore sync'
                    : isSyncing
                      ? 'Sincronizzazione...'
                      : isOnline
                        ? 'Online'
                        : 'Offline'}
              </span>
              {queueLength > 0 && (
                <span className="rounded-full bg-brand/20 px-1.5 md:px-2 py-0.5 text-brand text-[10px] md:text-xs">
                  {queueLength}
                </span>
              )}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 1.1 }}
          >
            {children ?? <Outlet />}
          </motion.div>
        </main>
      </div>
      <BottomBar />
    </div>
  )
}

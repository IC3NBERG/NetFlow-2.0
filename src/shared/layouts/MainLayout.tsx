import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomBar } from './BottomBar'
import { useSync } from '../../app/providers/SyncProvider'
import { useRealtimeSync } from '../../lib/hooks/useRealtimeSync'
import { SyncBanner } from '../../shared/ui/SyncBanner'
import { BackupReminder } from '../../shared/ui/BackupReminder'
import { NotificationCenter } from '../../shared/ui/NotificationCenter'
import { FiscalYearSelector } from '../../shared/ui/FiscalYearSelector'
import { CommandPalette } from '../../shared/ui/CommandPalette'
import { cn } from '../../lib/utils'
import { Info, Search } from 'lucide-react'

export function MainLayout() {
  const { isOnline, queueLength, isSyncing, syncStatus } = useSync()
  const navigate = useNavigate()
  useRealtimeSync()

  return (
    <div className="min-h-screen bg-surface-alt">
      <CommandPalette />
      <SyncBanner />
      <BackupReminder />
      <Sidebar />
      <div className="lg:ml-[280px] md:ml-[72px] ml-0 pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-surface-alt/80 backdrop-blur-md px-4 md:px-6 lg:px-8 py-3 md:py-4">
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
          <Outlet />
        </main>
      </div>
      <BottomBar />
    </div>
  )
}

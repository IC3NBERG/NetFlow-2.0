import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell, AlertTriangle, Calendar, CheckCheck, X,
  Download, RefreshCw, Goal, FileText, TrendingUp,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useJobs } from '../../lib/hooks/useJobs'
import { useInvoices } from '../../lib/hooks/useInvoices'
import { useUserSettings } from '../../lib/hooks/useUserSettings'
import {
  useNotifications,
  useUnreadNotificationCounts,
  useMarkNotificationRead,
  useDismissNotification,
  useMarkAllNotificationsRead,
} from '../../lib/hooks/useNotifications'
import {
  checkAndCreateDeadlineNotifications,
  checkAndCreateInvoiceNotifications,
  checkAndCreateBackupNotification,
} from '../../lib/notificationService'
import type { Notification, NotificationCategory } from '../../types/database'

const categoryConfig: Record<NotificationCategory, { icon: typeof Bell; color: string; label: string }> = {
  deadline: { icon: Calendar, color: 'text-brand', label: 'Scadenze' },
  invoice: { icon: AlertTriangle, color: 'text-expense', label: 'Fatture' },
  backup: { icon: Download, color: 'text-[#F59E0B]', label: 'Backup' },
  sync: { icon: RefreshCw, color: 'text-[#00D2FF]', label: 'Sync' },
  goal: { icon: Goal, color: 'text-success', label: 'Obiettivi' },
  quote: { icon: FileText, color: 'text-brand/70', label: 'Preventivi' },
  expense: { icon: TrendingUp, color: 'text-expense', label: 'Spese' },
  system: { icon: Bell, color: 'text-text-secondary', label: 'Sistema' },
}

type FilterMode = 'all' | NotificationCategory

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all')
  const [hasCheckedNotifications, setHasCheckedNotifications] = useState(false)

  const { data: settings } = useUserSettings()
  const { data: jobs = [] } = useJobs()
  const { data: invoices = [] } = useInvoices()
  const { data: notifications = [], isLoading } = useNotifications(100)
  const { data: unreadCounts } = useUnreadNotificationCounts()
  const unreadCountsSafe = (unreadCounts ?? {}) as Record<string, number>

  const markRead = useMarkNotificationRead()
  const dismissNotif = useDismissNotification()
  const markAllRead = useMarkAllNotificationsRead()

  const totalUnread = Object.values(unreadCountsSafe).reduce((a: number, b: number) => a + b, 0)

  useEffect(() => {
    if (hasCheckedNotifications || !settings || !notifications.length || !jobs.length) return
    setHasCheckedNotifications(true)

    const enabled = settings.notifications_enabled
    const prefs = (settings.notification_preferences ?? {}) as Record<string, boolean>

    if (enabled && prefs.deadline) {
      checkAndCreateDeadlineNotifications(jobs, notifications.map((n) => ({ metadata: n.metadata }))).catch(() => {})
    }
    if (enabled && prefs.invoice) {
      checkAndCreateInvoiceNotifications(invoices, notifications.map((n) => ({ metadata: n.metadata }))).catch(() => {})
    }
    if (enabled && prefs.backup) {
      const raw = localStorage.getItem('backup-reminder-dismissed')
      const lastBackup = raw ? Number(raw) : null
      checkAndCreateBackupNotification(
        lastBackup,
        settings.backup_reminder_interval_days,
        notifications.map((n) => ({ metadata: n.metadata })),
      ).catch(() => {})
    }
  }, [hasCheckedNotifications, settings, notifications, jobs, invoices])

  const filteredNotifications = useMemo(() => {
    const active = notifications.filter((n) => !n.is_dismissed)
    if (activeFilter === 'all') return active
    return active.filter((n) => n.category === activeFilter)
  }, [notifications, activeFilter])

  const categories = useMemo(() => {
    const cats = new Set(notifications.filter((n) => !n.is_dismissed).map((n) => n.category))
    return Array.from(cats)
  }, [notifications])

  function handleMarkRead(n: Notification) {
    if (!n.is_read) markRead.mutate(n.id)
  }

  function handleDismiss(n: Notification) {
    dismissNotif.mutate(n.id)
  }

  async function handleMarkAllRead() {
    markAllRead.mutate()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-1.5 text-text-secondary hover:bg-surface/80 hover:text-text-primary transition-all"
        aria-label="Notifiche"
      >
        <Bell className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-expense text-[10px] font-bold text-white px-1">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-card border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Notifiche</h3>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 transition-colors"
                    title="Segna tutte come lette"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Leggi tutto</span>
                  </button>
                )}
                <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs text-brand">
                  {totalUnread}
                </span>
              </div>
            </div>

            {categories.length > 1 && (
              <div className="flex gap-1 overflow-x-auto border-b border-border/50 px-3 py-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    activeFilter === 'all'
                      ? 'bg-brand text-white'
                      : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
                  )}
                >
                  Tutte
                </button>
                {categories.map((cat) => {
                  const cfg = categoryConfig[cat]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={cn(
                        'shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                        activeFilter === cat
                          ? 'bg-brand text-white'
                          : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center px-4 py-8 text-text-secondary">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-text-secondary">
                  <Bell className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Nessuna notifica</p>
                  {activeFilter !== 'all' && (
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="text-xs text-brand hover:underline"
                    >
                      Vedi tutte
                    </button>
                  )}
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const cfg = categoryConfig[n.category]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        'group flex items-start gap-3 border-b border-border/40 px-4 py-3.5 text-sm transition-all duration-300 relative overflow-hidden',
                        !n.is_read && 'bg-brand/[0.015] border-l-2 border-l-brand',
                        'hover:bg-surface/80',
                      )}
                    >
                      <div className="flex flex-1 items-start gap-3 min-w-0">
                        <div className={cn('rounded-lg p-2 shrink-0 transition-transform duration-300 group-hover:scale-105', `${cfg.color.replace('text-', 'bg-')}/8`)}>
                          <Icon className={cn('h-4.5 w-4.5', cfg.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-text-secondary">{cfg.label}</span>
                            <span className="text-[9px] text-text-secondary opacity-75 font-medium">
                              {formatRelativeTime(n.created_at)}
                            </span>
                            {!n.is_read && (
                              <span className="rounded-full bg-brand/10 text-brand px-1.5 py-0.25 text-[8px] font-bold uppercase tracking-wide">Nuovo</span>
                            )}
                          </div>
                          {n.link ? (
                            <Link
                              to={n.link}
                              onClick={() => {
                                handleMarkRead(n)
                                setIsOpen(false)
                              }}
                              className="block mt-1 group/link"
                            >
                              <p className="text-xs font-semibold text-text-primary group-hover/link:text-brand transition-colors">{n.title}</p>
                              <p className="text-text-secondary text-xs mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                            </Link>
                          ) : (
                            <div className="mt-1">
                              <p className="text-xs font-semibold text-text-primary">{n.title}</p>
                              <p className="text-text-secondary text-xs mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkRead(n)}
                            className="rounded-full p-1 text-text-secondary hover:text-brand hover:bg-surface transition-colors"
                            title="Segna come letto"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(n)}
                          className="rounded-full p-1 text-text-secondary hover:text-expense hover:bg-surface transition-colors"
                          title="Nascondi"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
              {filteredNotifications.length > 0 && (
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block border-t border-border px-4 py-2.5 text-center text-xs text-brand hover:bg-surface/80 transition-colors"
                >
                  Vedi tutte le notifiche
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Adesso'
  if (diffMin < 60) return `${diffMin}m fa`
  if (diffHours < 24) return `${diffHours}h fa`
  if (diffDays < 7) return `${diffDays}g fa`
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

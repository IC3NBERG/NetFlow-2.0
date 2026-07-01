import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, Calendar, AlertTriangle, Download, RefreshCw, Goal, FileText, TrendingUp,
  CheckCheck, X, ArrowLeft, Trash2, Filter, MessageCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { cn } from '../../../lib/utils'
import {
  useNotifications,
  useUnreadNotificationCounts,
  useMarkNotificationRead,
  useDismissNotification,
  useMarkAllNotificationsRead,
} from '../../../lib/hooks/useNotifications'
import type { NotificationCategory } from '../../../types/database'

const categoryConfig: Record<NotificationCategory, { icon: typeof Bell; color: string; label: string }> = {
  deadline: { icon: Calendar, color: 'text-brand', label: 'Scadenze' },
  invoice: { icon: AlertTriangle, color: 'text-expense', label: 'Fatture' },
  backup: { icon: Download, color: 'text-[#F59E0B]', label: 'Backup' },
  sync: { icon: RefreshCw, color: 'text-[#00D2FF]', label: 'Sync' },
  goal: { icon: Goal, color: 'text-success', label: 'Obiettivi' },
  quote: { icon: FileText, color: 'text-brand/70', label: 'Preventivi' },
  expense: { icon: TrendingUp, color: 'text-expense', label: 'Spese' },
  system: { icon: Bell, color: 'text-text-secondary', label: 'Sistema' },
  message: { icon: MessageCircle, color: 'text-brand', label: 'Messaggi' },
}

const allCategories: NotificationCategory[] = ['deadline', 'invoice', 'backup', 'sync', 'goal', 'quote', 'expense', 'system', 'message']

export function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all')
  const [showDismissed, setShowDismissed] = useState(false)

  const { data: notifications = [], isLoading } = useNotifications(200)
  const { data: unreadCounts } = useUnreadNotificationCounts()
  const unreadCountsSafe = (unreadCounts ?? {}) as Record<string, number>

  const markRead = useMarkNotificationRead()
  const dismissNotif = useDismissNotification()
  const markAllRead = useMarkAllNotificationsRead()

  const totalUnread = Object.values(unreadCountsSafe).reduce((a: number, b: number) => a + b, 0)

  const filteredNotifications = useMemo(() => {
    let list = showDismissed ? notifications : notifications.filter((n) => !n.is_dismissed)
    if (activeCategory !== 'all') {
      list = list.filter((n) => n.category === activeCategory)
    }
    return list
  }, [notifications, activeCategory, showDismissed])

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Centro Notifiche</h2>
          <p className="text-xs md:text-sm text-text-secondary">
            {totalUnread > 0
              ? `${totalUnread} notifica${totalUnread > 1 ? 'e' : ''} non lett${totalUnread > 1 ? 'e' : 'a'}`
              : 'Tutte le notifiche sono state lette'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <Button variant="secondary" onClick={() => markAllRead.mutate()} className="text-xs">
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Leggi tutto
            </Button>
          )}
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className={cn(
              'rounded-full p-2 transition-colors',
              showDismissed ? 'text-brand bg-brand/10' : 'text-text-secondary hover:bg-surface/80',
            )}
            title={showDismissed ? 'Nascondi notifiche archiviate' : 'Mostra notifiche archiviate'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 md:mx-0 px-4 md:px-0">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
            activeCategory === 'all'
              ? 'bg-brand text-white'
              : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Tutte
        </button>
        {allCategories.map((cat) => {
          const cfg = categoryConfig[cat]
          const Icon = cfg.icon
          const count = unreadCountsSafe[cat] ?? 0
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                activeCategory === cat
                  ? 'bg-brand text-white'
                  : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
              {count > 0 && (
                <span className={cn(
                  'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px]',
                  activeCategory === cat ? 'bg-white/20 text-white' : 'bg-brand/20 text-brand',
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-secondary">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <GlassCard className="p-8 md:p-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <Bell className="h-12 w-12 text-text-secondary opacity-20" />
            <p className="text-text-secondary">
              {activeCategory !== 'all'
                ? 'Nessuna notifica in questa categoria'
                : showDismissed
                  ? 'Nessuna notifica archiviata'
                  : 'Nessuna notifica'}
            </p>
            {activeCategory !== 'all' && (
              <button onClick={() => setActiveCategory('all')} className="text-sm text-brand hover:underline">
                Vedi tutte
              </button>
            )}
          </div>
        </GlassCard>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {filteredNotifications.map((n) => {
            const cfg = categoryConfig[n.category]
            const Icon = cfg.icon
            return (
              <motion.div key={n.id} variants={itemAnim}>
                <GlassCard
                  className={cn(
                    'p-4 md:p-5 transition-all duration-300 relative overflow-hidden group',
                    !n.is_read && !n.is_dismissed 
                      ? 'border-brand/35 bg-brand/[0.015] shadow-[0_0_15px_rgba(197,150,58,0.05)]' 
                      : 'border-border/60 hover:border-brand/30',
                    n.is_dismissed ? 'opacity-40' : '',
                  )}
                >
                  <div className="flex items-start gap-3 md:gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn('rounded-xl p-2.5 shrink-0 transition-transform duration-300 group-hover:scale-105', `${cfg.color.replace('text-', 'bg-')}/8`)}>
                          <Icon className={cn('h-5 w-5', cfg.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">{cfg.label}</span>
                            <span className="text-[10px] text-text-secondary opacity-75 font-medium">
                              {formatRelativeTime(n.created_at)}
                            </span>
                            {!n.is_read && !n.is_dismissed && (
                              <span className="rounded-full bg-brand/10 text-brand px-2 py-0.25 text-[9px] font-bold uppercase tracking-wide">Nuovo</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-text-primary mt-1">{n.title}</p>
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">{n.message}</p>
                          {n.link && (
                            <Link
                              to={n.link}
                              onClick={() => {
                                if (!n.is_read) markRead.mutate(n.id)
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand/80 transition-colors mt-2.5"
                            >
                              <span>Visualizza</span>
                              <ArrowLeft className="h-3 w-3 rotate-180 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    <div className="flex gap-1 shrink-0">
                      {!n.is_read && !n.is_dismissed && (
                        <button
                          onClick={() => markRead.mutate(n.id)}
                          className="rounded-full p-1.5 text-text-secondary hover:text-brand hover:bg-surface transition-colors"
                          title="Segna come letto"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                      {!n.is_dismissed && (
                        <button
                          onClick={() => dismissNotif.mutate(n.id)}
                          className="rounded-full p-1.5 text-text-secondary hover:text-expense hover:bg-surface transition-colors"
                          title="Nascondi"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </motion.div>
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
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

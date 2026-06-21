import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Clock, AlertTriangle, Calendar } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useJobs } from '../../lib/hooks/useJobs'
import { useInvoices } from '../../lib/hooks/useInvoices'

interface Notification {
  id: string
  type: 'deadline' | 'backup' | 'invoice'
  message: string
  link?: string
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: jobs = [] } = useJobs()
  const { data: invoices = [] } = useInvoices()

  const today = new Date()
  const threeDaysFromNow = new Date(today)
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const notifications: Notification[] = []

  const overduePendingJobs = jobs.filter((j) => {
    if (j.status !== 'completed_pending' || !j.pending_date) return false
    const pending = new Date(j.pending_date)
    const diffDays = Math.floor((today.getTime() - pending.getTime()) / 86400000)
    return diffDays > 30
  })

  overduePendingJobs.forEach((j) => {
    const pending = new Date(j.pending_date!)
    const diffDays = Math.floor((today.getTime() - pending.getTime()) / 86400000)
    notifications.push({
      id: `job-pending-${j.id}`,
      type: 'deadline',
      message: `Lavoro "${j.title}" in attesa di pagamento da ${diffDays} giorni`,
      link: '/jobs',
    })
  })

  const overdueInvoices = invoices.filter((inv) => {
    if (!inv.due_date || inv.status === 'paid') return false
    return new Date(inv.due_date) < today
  })

  overdueInvoices.forEach((inv) => {
    notifications.push({
      id: `inv-${inv.id}`,
      type: 'invoice',
      message: `Fattura ${inv.invoice_number} scaduta il ${new Date(inv.due_date!).toLocaleDateString('it-IT')}`,
      link: '/invoicing',
    })
  })

  const lastBackup = localStorage.getItem('backup-reminder-dismissed')
  const lastBackupTs = lastBackup ? Number(lastBackup) : NaN
  if (lastBackup && !isNaN(lastBackupTs)) {
    const daysSinceBackup = Math.floor((Date.now() - lastBackupTs) / 86400000)
    if (daysSinceBackup > 7) {
      notifications.push({
        id: 'backup-due',
        type: 'backup',
        message: `Ultimo backup: ${daysSinceBackup} giorni fa`,
        link: '/settings',
      })
    }
  }

  const unreadCount = notifications.length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-1.5 text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-expense text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-card border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Notifiche</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs text-brand">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-text-secondary">
                  <Bell className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Nessuna notifica</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const icon = n.type === 'deadline' ? Calendar
                    : n.type === 'invoice' ? AlertTriangle
                    : Clock
                  const Icon = icon
                  return (
                    <Link
                      key={n.id}
                      to={n.link ?? '#'}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 border-b border-border/50 px-4 py-3 text-sm hover:bg-surface/80 transition-colors"
                    >
                      <Icon className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        n.type === 'deadline' && 'text-brand',
                        n.type === 'invoice' && 'text-expense',
                        n.type === 'backup' && 'text-[#F59E0B]',
                      )} />
                      <p className="text-text-primary">{n.message}</p>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

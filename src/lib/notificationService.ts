import { supabase } from './supabase'
import type { NotificationCategory } from '../types/database'

export interface CreateNotificationInput {
  category: NotificationCategory
  title: string
  message: string
  link?: string
  icon?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(input: CreateNotificationInput) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  const { data } = await supabase
    .from('notifications')
    .insert({
      user_id: session.user.id,
      category: input.category,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      icon: input.icon ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single()

  return data
}

export async function checkAndCreateDeadlineNotifications(
  jobs: Array<{ id: string; title: string; pending_date: string | null; status: string }>,
  existingNotifs: Array<{ metadata: Record<string, unknown> | null }>,
) {
  const today = new Date()
  const existingKeys = new Set(
    existingNotifs
      .filter((n) => n.metadata?.source === 'deadline_check')
      .map((n) => n.metadata?.source_id as string),
  )

  for (const job of jobs) {
    if (job.status !== 'completed_pending' || !job.pending_date) continue
    const pending = new Date(job.pending_date)
    const diffDays = Math.floor((today.getTime() - pending.getTime()) / 86400000)
    if (diffDays > 30 && !existingKeys.has(`job-${job.id}`)) {
      await createNotification({
        category: 'deadline',
        title: 'Lavoro in attesa di pagamento',
        message: `"${job.title}" in attesa di pagamento da ${diffDays} giorni`,
        link: '/jobs',
        icon: 'Calendar',
        metadata: { source: 'deadline_check', source_id: `job-${job.id}`, days_overdue: diffDays },
      })
    }
  }
}

export async function checkAndCreateInvoiceNotifications(
  invoices: Array<{ id: string; invoice_number: string; due_date: string | null; status: string }>,
  existingNotifs: Array<{ metadata: Record<string, unknown> | null }>,
) {
  const today = new Date()
  const existingKeys = new Set(
    existingNotifs
      .filter((n) => n.metadata?.source === 'invoice_check')
      .map((n) => n.metadata?.source_id as string),
  )

  for (const inv of invoices) {
    if (!inv.due_date || inv.status === 'paid') continue
    const due = new Date(inv.due_date)
    if (due < today && !existingKeys.has(`inv-${inv.id}`)) {
      await createNotification({
        category: 'invoice',
        title: 'Fattura scaduta',
        message: `Fattura ${inv.invoice_number} scaduta il ${due.toLocaleDateString('it-IT')}`,
        link: '/invoicing',
        icon: 'AlertTriangle',
        metadata: { source: 'invoice_check', source_id: `inv-${inv.id}` },
      })
    }
  }
}

export async function checkAndCreateBackupNotification(
  lastBackupTimestamp: number | null,
  intervalDays: number,
  existingNotifs: Array<{ metadata: Record<string, unknown> | null }>,
) {
  const existingBackupNotif = existingNotifs.find(
    (n) => n.metadata?.source === 'backup_reminder',
  )
  if (existingBackupNotif) return

  if (!lastBackupTimestamp) return
  const daysSinceBackup = Math.floor((Date.now() - lastBackupTimestamp) / 86400000)
  if (daysSinceBackup >= intervalDays) {
    await createNotification({
      category: 'backup',
      title: 'Backup consigliato',
      message: `Ultimo backup: ${daysSinceBackup} giorni fa. Esporta i tuoi dati per tenerli al sicuro.`,
      link: '/settings',
      icon: 'Clock',
      metadata: { source: 'backup_reminder', interval_days: intervalDays },
    })
  }
}

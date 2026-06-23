import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSharedData } from '../../../lib/hooks/useSharedData'
import { GlassCard } from '../../../shared/ui/GlassCard'
import {
  AlertTriangle, Briefcase, Users, FileText, Receipt, FileSpreadsheet,
  Clock, CheckCircle2, ExternalLink, Shield,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  active: 'text-pending',
  completed_pending: 'text-warning',
  completed_settled: 'text-success',
  draft: 'text-text-secondary',
  sent: 'text-pending',
  paid: 'text-success',
  accepted: 'text-success',
  rejected: 'text-expense',
  converted: 'text-brand',
}

const statusLabels: Record<string, string> = {
  active: 'In corso',
  completed_pending: 'In attesa',
  completed_settled: 'Saldata',
  draft: 'Bozza',
  sent: 'Inviata',
  paid: 'Pagata',
  accepted: 'Accettato',
  rejected: 'Rifiutato',
  converted: 'Convertito',
}

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(amount || 0)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('it-IT')
}

export function SharedViewPage() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, error } = useSharedData(token)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-text-secondary">Caricamento dati...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const message = (error as Error)?.message || 'Link non valido o scaduto'
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <GlassCard className="max-w-md w-full p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-expense/10">
            <AlertTriangle className="h-8 w-8 text-expense" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-text-primary">Accesso negato</h1>
          <p className="text-text-secondary">{message}</p>
        </GlassCard>
      </div>
    )
  }

  if (!data) return null

  const profile = data.profile
  const businessName = (profile?.business_name as string) || (profile?.full_name as string) || 'Utente'
  const shareInfo = data.share

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/30 bg-surface/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <Shield className="h-5 w-5 text-brand" />
          <div className="flex-1">
            <p className="text-sm font-medium">{businessName}</p>
            <p className="text-xs text-text-secondary">
              Accesso {shareInfo?.access_level === 'export' ? 'lettura + export' : 'sola lettura'}
            </p>
          </div>
          {shareInfo?.access_level === 'export' && (
            <span className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              <ExternalLink className="h-3 w-3" /> Export
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: 'Lavori', value: data.jobs.length, icon: Briefcase, color: 'text-brand' },
            { label: 'Clienti', value: data.clients.length, icon: Users, color: 'text-success' },
            { label: 'Fatture', value: data.invoices.length, icon: FileText, color: 'text-pending' },
            { label: 'Uscite', value: data.expenses.length, icon: Receipt, color: 'text-expense' },
            { label: 'Preventivi', value: data.quotes.length, icon: FileSpreadsheet, color: 'text-warning' },
          ].map((stat) => (
            <GlassCard key={stat.label} className="p-4 text-center">
              <stat.icon className={`mx-auto mb-2 h-5 w-5 ${stat.color}`} />
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Jobs */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Briefcase className="h-5 w-5 text-brand" /> Lavori
          </h2>
          <div className="space-y-2">
            {data.jobs.length === 0 && <p className="text-sm text-text-secondary">Nessun lavoro</p>}
            {data.jobs.slice(0, 10).map((job: Record<string, unknown>) => (
              <motion.div
                key={job.id as string}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-xl bg-surface/60 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{job.title as string}</p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(job.start_date as string)} · {formatCurrency(job.net_amount as number, job.currency as string)}
                  </p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium ${statusColors[job.status as string] || ''}`}>
                  {job.status === 'active' && <Clock className="h-3 w-3" />}
                  {job.status === 'completed_settled' && <CheckCircle2 className="h-3 w-3" />}
                  {job.status === 'completed_pending' && <Clock className="h-3 w-3" />}
                  {statusLabels[job.status as string] || (job.status as string)}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Invoices */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-pending" /> Fatture
          </h2>
          <div className="space-y-2">
            {data.invoices.length === 0 && <p className="text-sm text-text-secondary">Nessuna fattura</p>}
            {data.invoices.slice(0, 10).map((inv: Record<string, unknown>) => (
              <motion.div
                key={inv.id as string}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-xl bg-surface/60 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.invoice_number as string}</p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(inv.issued_date as string)} · {formatCurrency(inv.gross_amount as number, inv.currency as string)}
                  </p>
                </div>
                <span className={`text-xs font-medium ${statusColors[inv.status as string] || ''}`}>
                  {statusLabels[inv.status as string] || (inv.status as string)}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quotes */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileSpreadsheet className="h-5 w-5 text-warning" /> Preventivi
          </h2>
          <div className="space-y-2">
            {data.quotes.length === 0 && <p className="text-sm text-text-secondary">Nessun preventivo</p>}
            {data.quotes.slice(0, 10).map((q: Record<string, unknown>) => (
              <motion.div
                key={q.id as string}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-xl bg-surface/60 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{q.title as string}</p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(q.issued_date as string)} · {formatCurrency(q.gross_amount as number, q.currency as string)}
                  </p>
                </div>
                <span className={`text-xs font-medium ${statusColors[q.status as string] || ''}`}>
                  {statusLabels[q.status as string] || (q.status as string)}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Clients & Expenses in 2-col grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Clients */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-success" /> Clienti
            </h2>
            <div className="space-y-2">
              {data.clients.length === 0 && <p className="text-sm text-text-secondary">Nessun cliente</p>}
              {data.clients.slice(0, 10).map((c: Record<string, unknown>) => (
                <motion.div
                  key={c.id as string}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 rounded-xl bg-surface/60 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name as string}</p>
                    {!!c.email && <p className="text-xs text-text-secondary truncate">{c.email as string}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Expenses */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Receipt className="h-5 w-5 text-expense" /> Uscite
            </h2>
            <div className="space-y-2">
              {data.expenses.length === 0 && <p className="text-sm text-text-secondary">Nessuna uscita</p>}
              {data.expenses.slice(0, 10).map((e: Record<string, unknown>) => (
                <motion.div
                  key={e.id as string}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 rounded-xl bg-surface/60 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title as string}</p>
                    <p className="text-xs text-text-secondary">
                      {formatDate(e.date as string)} · {formatCurrency(e.amount as number, e.currency as string)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        <p className="pb-8 text-center text-xs text-text-secondary">
          Dati condivisi tramite NetFlow · {new Date().toLocaleDateString('it-IT')}
        </p>
      </main>
    </div>
  )
}

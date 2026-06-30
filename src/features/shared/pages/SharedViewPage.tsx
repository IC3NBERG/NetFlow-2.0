import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSharedData } from '../../../lib/hooks/useSharedData'
import { GlassCard } from '../../../shared/ui/GlassCard'
import {
  AlertTriangle, Briefcase, Users, FileText, Receipt, FileSpreadsheet,
  Clock, CheckCircle2, ExternalLink, Shield, Search,
  ChevronDown, Eye, DollarSign, X,
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

const statusIcons: Record<string, typeof Clock> = {
  active: Clock,
  completed_pending: Clock,
  completed_settled: CheckCircle2,
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
  return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 24, mass: 1.1 },
  },
}

interface StatCard {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

function StatCard({ stat }: { stat: StatCard }) {
  const Icon = stat.icon
  return (
    <motion.div
      variants={itemVariants}
      className="group relative overflow-hidden rounded-[1.5rem] bg-surface/60 backdrop-blur-3xl border border-border p-5 transition-all duration-300 hover:bg-surface/80 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(197,150,58,0.08)]"
    >
      <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full opacity-[0.08] transition-opacity duration-300 group-hover:opacity-[0.12] ${stat.bgColor}`} />
      <div className="relative">
        <div className={`mb-3 inline-flex rounded-full ${stat.bgColor}/10 p-2.5 ring-1 ring-inset ring-border/60`}>
          <Icon className={`h-5 w-5 ${stat.color}`} />
        </div>
        <p className="text-3xl font-bold font-mono tabular-nums text-text-primary">{stat.value}</p>
        <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
      </div>
    </motion.div>
  )
}

function SectionHeader({ icon: Icon, label, color, count }: { icon: React.ComponentType<{ className?: string }>; label: string; color: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-full ${color.replace('text', 'bg')}/10 p-2`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{label}</h2>
      <span className="rounded-full bg-surface/80 px-2.5 py-0.5 text-xs font-medium text-text-secondary tabular-nums">{count}</span>
    </div>
  )
}

function ListItem({
  primary,
  secondary,
  status,
}: {
  primary: string
  secondary: string
  status?: string
}) {
  const StatusIcon = status ? statusIcons[status] : undefined
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-4 rounded-xl bg-surface/60 backdrop-blur-xl border border-border/60 px-4 py-3.5 transition-all duration-200 hover:bg-surface/80 hover:border-border"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{primary}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{secondary}</p>
      </div>
      {status && (
        <span className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
          statusColors[status] || 'text-text-secondary'
        } ${(statusColors[status] || 'text-text-secondary').replace('text', 'bg')}/10`}>
          {StatusIcon && <StatusIcon className="h-3 w-3" />}
          {statusLabels[status] || status}
        </span>
      )}
    </motion.div>
  )
}

function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-alt overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full bg-[rgba(197,150,58,0.12)] blur-[120px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-[rgba(0,210,255,0.06)] blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-brand blur-[2px]" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">Caricamento dati</p>
          <p className="mt-1 text-xs text-text-secondary">Recupero informazioni condivise...</p>
        </div>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-alt p-4 overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-expense/5 blur-[100px]" />
      </div>
      <GlassCard className="relative max-w-md w-full overflow-hidden">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-expense/5 blur-2xl" />
        <div className="relative space-y-6 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-expense/10">
            <AlertTriangle className="h-8 w-8 text-expense" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">Accesso non disponibile</h1>
            <p className="text-sm leading-relaxed text-text-secondary">{message}</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          <p className="text-xs text-text-secondary">
            Se pensi sia un errore, contatta il titolare del profilo NetFlow
          </p>
        </div>
      </GlassCard>
    </div>
  )
}

export function SharedViewPage() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, error } = useSharedData(token)
  const [search, setSearch] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['jobs', 'invoices']))
  const [showAll, setShowAll] = useState<Record<string, boolean>>({})

  const toggleShowAll = (section: string) => {
    setShowAll((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleExpand = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const filteredJobs = useMemo(() => {
    if (!data?.jobs) return []
    if (!search) return data.jobs
    const q = search.toLowerCase()
    return data.jobs.filter((j: any) => j.title?.toLowerCase().includes(q))
  }, [data?.jobs, search])

  const filteredInvoices = useMemo(() => {
    if (!data?.invoices) return []
    if (!search) return data.invoices
    const q = search.toLowerCase()
    return data.invoices.filter((i: any) => i.invoice_number?.toLowerCase().includes(q))
  }, [data?.invoices, search])

  const filteredQuotes = useMemo(() => {
    if (!data?.quotes) return []
    if (!search) return data.quotes
    const q = search.toLowerCase()
    return data.quotes.filter((q2: any) => q2.title?.toLowerCase().includes(q))
  }, [data?.quotes, search])

  const filteredClients = useMemo(() => {
    if (!data?.clients) return []
    if (!search) return data.clients
    const q = search.toLowerCase()
    return data.clients.filter((c: any) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
  }, [data?.clients, search])

  const filteredExpenses = useMemo(() => {
    if (!data?.expenses) return []
    if (!search) return data.expenses
    const q = search.toLowerCase()
    return data.expenses.filter((e: any) => e.title?.toLowerCase().includes(q))
  }, [data?.expenses, search])

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={(error as Error)?.message || 'Link non valido o scaduto'} />
  if (!data) return null

  const profile = data.profile as any
  const businessName = profile?.business_name || profile?.full_name || 'Utente'
  const shareInfo = data.share as any

  const stats: StatCard[] = [
    { label: 'Lavori', value: data.jobs.length, icon: Briefcase, color: 'text-brand', bgColor: 'bg-brand' },
    { label: 'Clienti', value: data.clients.length, icon: Users, color: 'text-success', bgColor: 'bg-success' },
    { label: 'Fatture', value: data.invoices.length, icon: FileText, color: 'text-pending', bgColor: 'bg-pending' },
    { label: 'Uscite', value: data.expenses.length, icon: Receipt, color: 'text-expense', bgColor: 'bg-expense' },
    { label: 'Preventivi', value: data.quotes.length, icon: FileSpreadsheet, color: 'text-warning', bgColor: 'bg-warning' },
  ]

  const sections = [
    { key: 'jobs', label: 'Lavori', icon: Briefcase, color: 'text-brand', data: filteredJobs, render: (item: any) => ({
      primary: item.title,
      secondary: `${formatDate(item.start_date)} · ${formatCurrency(item.net_amount, item.currency)}`,
      status: item.status,
    })},
    { key: 'invoices', label: 'Fatture', icon: FileText, color: 'text-pending', data: filteredInvoices, render: (item: any) => ({
      primary: `${item.invoice_number}${item.type === 'parcella' ? ' (Parcella)' : ''}`,
      secondary: `${formatDate(item.issued_date)} · ${formatCurrency(item.gross_amount, item.currency)}`,
      status: item.status,
    })},
    { key: 'quotes', label: 'Preventivi', icon: FileSpreadsheet, color: 'text-warning', data: filteredQuotes, render: (item: any) => ({
      primary: item.title,
      secondary: `${formatDate(item.issued_date)} · ${formatCurrency(item.gross_amount, item.currency)}`,
      status: item.status,
    })},
    { key: 'clients', label: 'Clienti', icon: Users, color: 'text-success', data: filteredClients, render: (item: any) => ({
      primary: item.name,
      secondary: [item.email, item.phone].filter(Boolean).join(' · ') || 'Nessun contatto',
      status: undefined,
    })},
    { key: 'expenses', label: 'Uscite', icon: Receipt, color: 'text-expense', data: filteredExpenses, render: (item: any) => ({
      primary: item.title,
      secondary: `${formatDate(item.date)} · ${formatCurrency(item.amount, item.currency)}`,
      status: undefined,
    })},
  ]

  const totalIncome = data.jobs
    .filter((j: any) => j.status === 'completed_settled')
    .reduce((sum: number, j: any) => sum + (j.net_amount || 0), 0)
  const totalPending = data.jobs
    .filter((j: any) => j.status === 'completed_pending')
    .reduce((sum: number, j: any) => sum + (j.net_amount || 0), 0)
  const totalExpenses = data.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)

  const hasSectionsWithData = sections.some((s) => s.data.length > 0)

  return (
    <div className="relative min-h-screen bg-surface-alt overflow-hidden">
      {/* Ambient light orbs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-48 -top-48 h-[700px] w-[700px] rounded-full bg-[rgba(197,150,58,0.1)] blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-[rgba(0,210,255,0.05)] blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute left-1/2 top-2/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[rgba(197,150,58,0.03)] blur-[80px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/60 bg-surface/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <div className="rounded-full bg-brand/10 p-2.5">
            <Shield className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-text-primary truncate">{businessName}</h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-medium text-success">
                <CheckCircle2 className="h-3 w-3" /> Verificato
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary">
              <Eye className="h-3 w-3" />
              Accesso {shareInfo?.access_level === 'export' ? 'lettura + export' : 'sola lettura'}
              {shareInfo?.view_count !== undefined && (
                <> · Visite: {shareInfo.view_count}</>
              )}
            </p>
          </div>
          {shareInfo?.access_level === 'export' && (
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand border border-brand/20">
              <ExternalLink className="h-3 w-3" /> Export
            </span>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          {/* Financial summary */}
          <motion.div variants={itemVariants}>
            <GlassCard className="relative overflow-hidden p-5">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-6 translate-x-6 rounded-full bg-brand/5 blur-3xl" />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-full bg-brand/10 p-2">
                    <DollarSign className="h-5 w-5 text-brand" />
                  </div>
                  <h3 className="text-base font-semibold text-text-primary">Riepilogo Finanziario</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-success/5 border border-success/10 p-4">
                    <p className="mb-1 text-xs text-text-secondary">Totale Incassato</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-success">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="rounded-xl bg-pending/5 border border-pending/10 p-4">
                    <p className="mb-1 text-xs text-text-secondary">In Attesa</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-pending">{formatCurrency(totalPending)}</p>
                  </div>
                  <div className="rounded-xl bg-expense/5 border border-expense/10 p-4">
                    <p className="mb-1 text-xs text-text-secondary">Uscite Totali</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-expense">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Search */}
          <motion.div variants={itemVariants}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/50 transition-colors duration-200 group-focus-within:text-brand" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca tra lavori, fatture, preventivi, clienti..."
                className="w-full rounded-[1rem] border border-border/60 bg-surface/60 backdrop-blur-xl py-3.5 pl-11 pr-10 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-secondary/50 transition-all hover:bg-surface/80 hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Sections */}
          {hasSectionsWithData ? (
            sections.map((section) => {
              const isExpanded = expandedSections.has(section.key)
              const showAllItems = showAll[section.key]
              const displayData = showAllItems ? section.data : section.data.slice(0, 5)
              const hasMore = section.data.length > 5
              const SectionIcon = section.icon

              if (section.data.length === 0) return null

              return (
                <motion.section key={section.key} variants={itemVariants}>
                  <div
                    className="flex cursor-pointer items-center justify-between rounded-[1.5rem] border border-border/30 bg-surface/30 px-5 py-3.5 backdrop-blur-sm transition-all duration-200 hover:bg-surface/50"
                    onClick={() => toggleExpand(section.key)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(section.key) } }}
                    role="button"
                    tabIndex={0}
                  >
                    <SectionHeader icon={SectionIcon} label={section.label} color={section.color} count={section.data.length} />
                    <button
                      className="rounded-full p-1.5 text-text-secondary/50 transition-colors hover:bg-surface/80 hover:text-text-primary"
                      aria-label={isExpanded ? `Comprimi ${section.label}` : `Espandi ${section.label}`}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key={`content-${section.key}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2">
                          {displayData.map((item: any) => {
                            const rendered = section.render(item)
                            return (
                              <ListItem
                                key={item.id}
                                primary={rendered.primary}
                                secondary={rendered.secondary}
                                status={rendered.status}
                              />
                            )
                          })}
                        </div>
                        {hasMore && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleShowAll(section.key) }}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/40 py-3 text-xs font-medium text-text-secondary transition-all hover:border-border/60 hover:bg-surface/40 hover:text-text-primary"
                          >
                            {showAllItems ? 'Mostra meno' : `Mostra tutti (${section.data.length})`}
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showAllItems ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              )
            })
          ) : (
            <motion.div variants={itemVariants} className="py-16 text-center">
              <div className="mb-4 inline-flex rounded-full bg-surface/60 p-4">
                <Search className="h-8 w-8 text-text-secondary/50" />
              </div>
              <p className="mb-1 text-base font-medium text-text-primary">Nessun risultato</p>
              <p className="text-sm text-text-secondary">Nessun dato corrisponde alla tua ricerca</p>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div variants={itemVariants} className="pt-4">
            <div className="mb-6 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-brand/10 p-1.5">
                  <Shield className="h-3.5 w-3.5 text-brand" />
                </div>
                <span className="text-xs text-text-secondary">
                  Dati condivisi tramite <span className="font-medium text-text-primary">NetFlow</span>
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-text-secondary">
                <span className="font-mono">Token: {(token || '').slice(0, 8)}...{(token || '').slice(-4)}</span>
                <span className="text-border/60">·</span>
                <span>{new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  )
}

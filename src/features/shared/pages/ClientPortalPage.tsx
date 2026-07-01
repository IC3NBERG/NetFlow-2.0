import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useClientPortalData, useShareMessages, useSendShareMessage } from '../../../lib/hooks/useClientPortal'
import { GlassCard } from '../../../shared/ui/GlassCard'
import {
  AlertTriangle, Briefcase, FileText, FileSpreadsheet,
  Clock, CheckCircle2, Shield, MessageCircle,
  ChevronDown, Send, User, X, ChevronUp, CheckCheck,
  TrendingUp, Hourglass, ReceiptText,
} from 'lucide-react'
import type { ShareMessage } from '../../../types/database'
import { useAuth } from '../../../app/providers/AuthProvider'
import { Link } from 'react-router-dom'

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  active: 'bg-pending/15 text-pending border-pending/30',
  completed_pending: 'bg-warning/15 text-warning border-warning/30',
  completed_settled: 'bg-success/15 text-success border-success/30',
  draft: 'bg-surface text-text-secondary border-border',
  sent: 'bg-pending/15 text-pending border-pending/30',
  paid: 'bg-success/15 text-success border-success/30',
  accepted: 'bg-success/15 text-success border-success/30',
  rejected: 'bg-expense/15 text-expense border-expense/30',
  converted: 'bg-brand/15 text-brand border-brand/30',
}

const statusLabels: Record<string, string> = {
  active: 'In corso',
  completed_pending: 'In attesa pagamento',
  completed_settled: 'Saldato',
  draft: 'Bozza',
  sent: 'Inviata',
  paid: 'Pagata',
  accepted: 'Accettato',
  rejected: 'Rifiutato',
  converted: 'Convertito',
}

const statusIcons: Record<string, typeof Clock> = {
  active: Clock,
  completed_pending: Hourglass,
  completed_settled: CheckCircle2,
  paid: CheckCircle2,
  accepted: CheckCircle2,
}

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(amount || 0)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  const Icon = statusIcons[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColors[status] ?? 'bg-surface text-text-secondary border-border'}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {statusLabels[status] ?? status}
    </span>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24, mass: 1.1 } },
}

// ─── Error / Loading ─────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
        <p className="text-sm text-text-secondary">Caricamento portale...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt p-6">
      <GlassCard className="max-w-md w-full">
        <div className="relative space-y-6 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-expense/10">
            <AlertTriangle className="h-8 w-8 text-expense" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">Portale non disponibile</h1>
            <p className="text-sm leading-relaxed text-text-secondary">{message}</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          <p className="text-xs text-text-secondary">Se pensi sia un errore, contatta chi ha condiviso questo link.</p>
        </div>
      </GlassCard>
    </div>
  )
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({ token, ownerName }: { token: string; ownerName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [clientName, setClientName] = useState(() => localStorage.getItem(`portal_name_${token}`) ?? '')
  const [nameEntered, setNameEntered] = useState(() => !!localStorage.getItem(`portal_name_${token}`))
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: messages = [] } = useShareMessages(token)
  const sendMessage = useSendShareMessage(token)

  const unreadCount = messages.filter(m => m.sender === 'owner').length

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [messages, isOpen])

  function handleNameSubmit() {
    if (!clientName.trim()) return
    localStorage.setItem(`portal_name_${token}`, clientName.trim())
    setNameEntered(true)
  }

  async function handleSend() {
    if (!message.trim()) return
    await sendMessage.mutateAsync({ sender: 'client', content: message.trim(), senderName: clientName || 'Cliente' })
    setMessage('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-brand px-4 py-3.5 shadow-[0_8px_32px_rgba(197,150,58,0.4)] text-black font-semibold text-sm transition-all hover:scale-105 active:scale-95"
        aria-label="Apri chat"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!isOpen && <span>Scrivi a {ownerName}</span>}
        {!isOpen && unreadCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[10px] font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[340px] max-w-[calc(100vw-48px)] flex-col rounded-[1.75rem] border border-border/60 bg-surface/95 shadow-[0_32px_80px_rgba(0,0,0,0.4)] backdrop-blur-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/40 bg-brand/10 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 ring-1 ring-brand/30">
                <Shield className="h-4.5 w-4.5 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{ownerName}</p>
                <p className="text-[10px] text-text-secondary flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Canale sicuro
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-text-secondary/60 hover:bg-surface/80 hover:text-text-primary transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Name gate */}
            {!nameEntered ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 ring-1 ring-brand/20">
                  <User className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary mb-1">Come ti chiami?</p>
                  <p className="text-xs text-text-secondary">Per identificarti nella chat con {ownerName}</p>
                </div>
                <input
                  autoFocus
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                  placeholder="Il tuo nome..."
                  className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                />
                <button
                  onClick={handleNameSubmit}
                  disabled={!clientName.trim()}
                  className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-black transition-all hover:opacity-90 disabled:opacity-40"
                >
                  Inizia la chat
                </button>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center opacity-50">
                      <MessageCircle className="h-8 w-8 text-text-secondary" />
                      <p className="text-xs text-text-secondary">Nessun messaggio ancora.<br />Scrivi il tuo primo messaggio!</p>
                    </div>
                  )}
                  {messages.map((msg: ShareMessage) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                        msg.sender === 'client'
                          ? 'bg-brand text-black rounded-br-sm'
                          : 'bg-surface-alt/80 text-text-primary rounded-bl-sm border border-border/40'
                      }`}>
                        {msg.sender === 'owner' && (
                          <p className="text-[9px] font-bold uppercase tracking-wider mb-1 opacity-60">{ownerName}</p>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p className={`text-[10px] opacity-60`}>{formatTime(msg.created_at)}</p>
                          {msg.sender === 'client' && msg.read_at && (
                            <CheckCheck className="h-3 w-3 opacity-60" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border/40 p-3">
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Scrivi un messaggio..."
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all min-h-[40px] max-h-[120px]"
                      style={{ height: 'auto' }}
                      onInput={e => {
                        const el = e.currentTarget
                        el.style.height = 'auto'
                        el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!message.trim() || sendMessage.isPending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-black transition-all hover:opacity-90 disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-text-secondary/50 mt-1.5 text-center">
                    Invio con Invio · A capo con Shift+Invio
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Section Components ───────────────────────────────────────────────────────

function SectionCard({ icon: Icon, color, label, count, children, defaultOpen = true }: {
  icon: React.ComponentType<{ className?: string }>
  color: string
  label: string
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (count === 0) return null

  return (
    <motion.section variants={itemVariants}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-[1.5rem] border border-border/30 bg-surface/30 px-5 py-4 backdrop-blur-sm transition-all hover:bg-surface/50"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-surface/80 ring-1 ring-border/40`}>
            <Icon className={`h-4.5 w-4.5 ${color}`} />
          </div>
          <span className="font-semibold text-text-primary">{label}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-surface/60 ${color}`}>{count}</span>
        </div>
        <ChevronUp className={`h-4 w-4 text-text-secondary/50 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ClientPortalPage() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, error } = useClientPortalData(token)
  const { user, isLoading: isAuthLoading } = useAuth()

  const jobs = useMemo(() => (data?.jobs ?? []) as any[], [data?.jobs])
  const invoices = useMemo(() => (data?.invoices ?? []) as any[], [data?.invoices])
  const quotes = useMemo(() => (data?.quotes ?? []) as any[], [data?.quotes])
  const profile = data?.profile as any
  const client = data?.client as any

  const ownerName = profile?.business_name || profile?.full_name || 'Professionista'
  const clientName = client?.name || 'Cliente'
  const avatarLetter = clientName.charAt(0).toUpperCase()
  const avatarColor = client?.color ?? '#C5963A'

  // Stats
  const totalJobsValue = jobs.reduce((s: number, j: any) => s + (j.net_amount || 0), 0)
  const settledJobs = jobs.filter((j: any) => j.status === 'completed_settled').length
  const pendingInvoices = invoices.filter((i: any) => i.status === 'sent' || i.status === 'draft').length

  if (isLoading || isAuthLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={(error as Error)?.message || 'Link non valido o scaduto'} />
  if (!data) return null

  // Prevent owner from accessing client side of the portal
  if (user && data.share?.user_id === user.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-alt p-6">
        <GlassCard className="max-w-md w-full">
          <div className="relative space-y-6 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
              <Shield className="h-8 w-8 text-brand" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-text-primary">Accesso limitato</h1>
              <p className="text-sm leading-relaxed text-text-secondary">
                Sei il proprietario di questo portale. Per comunicare con il cliente, utilizza il pannello chat all'interno della gestione condivisioni.
              </p>
            </div>
            <Link
              to="/settings?tab=sharing"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-black hover:bg-brand/90 transition-colors"
            >
              Vai alle Condivisioni
            </Link>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-surface-alt overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-48 -top-48 h-[700px] w-[700px] rounded-full bg-[rgba(197,150,58,0.08)] blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full bg-[rgba(0,210,255,0.04)] blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/40 bg-surface/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-5">
          <div className="rounded-2xl bg-brand/10 p-3 ring-1 ring-brand/20">
            <Shield className="h-6 w-6 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-0.5">Portale condiviso da</p>
            <h1 className="text-lg font-bold text-text-primary truncate">{ownerName}</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3.5 py-1.5">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-success">Connesso</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 pb-32 space-y-8">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">

          {/* Client greeting */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 md:p-8">
              <div className="flex items-center gap-5">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: avatarColor }}
                >
                  {avatarLetter}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text-secondary mb-1">Ciao,</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-text-primary truncate">{clientName}</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Qui puoi vedere in tempo reale i tuoi lavori, preventivi e fatture gestiti da{' '}
                    <span className="font-semibold text-text-primary">{ownerName}</span>.
                  </p>
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/40">
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand tabular-nums">{jobs.length}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Lavori totali</p>
                </div>
                <div className="text-center border-x border-border/40">
                  <p className="text-2xl font-bold text-success tabular-nums">{settledJobs}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Completati</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning tabular-nums">{pendingInvoices}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Fatture aperte</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Total value banner */}
          {totalJobsValue > 0 && (
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-4 rounded-[1.5rem] border border-brand/20 bg-brand/5 px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                  <TrendingUp className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Valore totale lavori</p>
                  <p className="text-xl font-bold text-brand">{formatCurrency(totalJobsValue)}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Jobs section */}
          <SectionCard icon={Briefcase} color="text-brand" label="Lavori" count={jobs.length}>
            {jobs.map((job: any) => (
              <div key={job.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border/30 bg-surface/40 px-5 py-4 transition-colors hover:bg-surface/60">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text-primary text-sm truncate">{job.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <p className="text-xs text-text-secondary">
                      {formatDate(job.start_date)}
                      {job.end_date && ` → ${formatDate(job.end_date)}`}
                    </p>
                    {job.net_amount > 0 && (
                      <span className="text-xs font-semibold text-brand">{formatCurrency(job.net_amount, job.currency)}</span>
                    )}
                  </div>
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </SectionCard>

          {/* Quotes section */}
          <SectionCard icon={FileSpreadsheet} color="text-warning" label="Preventivi" count={quotes.length} defaultOpen={false}>
            {quotes.map((q: any) => (
              <div key={q.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border/30 bg-surface/40 px-5 py-4 transition-colors hover:bg-surface/60">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text-primary text-sm truncate">{q.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <p className="text-xs text-text-secondary">{formatDate(q.issued_date)}</p>
                    {q.gross_amount > 0 && (
                      <span className="text-xs font-semibold text-warning">{formatCurrency(q.gross_amount, q.currency)}</span>
                    )}
                  </div>
                </div>
                <StatusBadge status={q.status} />
              </div>
            ))}
          </SectionCard>

          {/* Invoices section */}
          <SectionCard icon={FileText} color="text-pending" label="Fatture" count={invoices.length} defaultOpen={false}>
            {invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border/30 bg-surface/40 px-5 py-4 transition-colors hover:bg-surface/60">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text-primary text-sm truncate">
                    {inv.invoice_number}
                    {inv.type === 'parcella' && <span className="ml-2 text-[10px] text-text-secondary">(Parcella)</span>}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <p className="text-xs text-text-secondary">{formatDate(inv.issued_date)}</p>
                    {inv.gross_amount > 0 && (
                      <span className="text-xs font-semibold text-pending">{formatCurrency(inv.gross_amount, inv.currency)}</span>
                    )}
                  </div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))}
          </SectionCard>

          {/* Empty state */}
          {jobs.length === 0 && quotes.length === 0 && invoices.length === 0 && (
            <motion.div variants={itemVariants} className="py-20 text-center">
              <div className="mb-4 inline-flex rounded-full bg-surface/60 p-4">
                <ReceiptText className="h-8 w-8 text-text-secondary/50" />
              </div>
              <p className="text-base font-medium text-text-primary mb-1">Nessun dato ancora</p>
              <p className="text-sm text-text-secondary">I tuoi lavori e fatture appariranno qui man mano che vengono creati.</p>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center pt-4">
            <p className="text-xs text-text-secondary/50">
              Portale sicuro — powered by <span className="text-brand font-semibold">NetFlow</span>
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Floating chat */}
      <ChatPanel token={token!} ownerName={ownerName} />
    </div>
  )
}

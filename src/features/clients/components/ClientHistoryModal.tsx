import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../app/providers/AuthProvider'
import { Modal } from '../../../shared/ui/Modal'
import {
  Briefcase, FileText, History, Clock, CheckCircle2,
  AlertCircle, Mail, Phone, Building2, CreditCard, MapPin,
  Edit3, Trash2, Plus, Receipt,
  XCircle, Send, Archive, Calendar,
} from 'lucide-react'
import type { Job, Quote, AuditLog, Client } from '../../../types/database'

interface Props {
  client: Client
  open: boolean
  onClose: () => void
}

interface HistoryData {
  jobs: Job[]
  quotes: (Quote & { clients?: { name: string } | null })[]
  auditLog: AuditLog[]
}

const statusJobLabel: Record<Job['status'], string> = {
  active: 'Attivo',
  completed_pending: 'Completato (da incassare)',
  completed_settled: 'Incassato',
}

const statusJobIcon: Record<Job['status'], typeof Clock> = {
  active: Clock,
  completed_pending: AlertCircle,
  completed_settled: CheckCircle2,
}

const statusJobColor: Record<Job['status'], string> = {
  active: 'text-brand',
  completed_pending: 'text-pending',
  completed_settled: 'text-success',
}

const statusQuoteLabel: Record<Quote['status'], string> = {
  draft: 'Bozza',
  sent: 'Inviato',
  accepted: 'Accettato',
  rejected: 'Rifiutato',
  converted: 'Convertito in lavoro',
}

const statusQuoteIcon: Record<Quote['status'], typeof Clock> = {
  draft: FileText,
  sent: Send,
  accepted: CheckCircle2,
  rejected: XCircle,
  converted: Archive,
}

const statusQuoteColor: Record<Quote['status'], string> = {
  draft: 'text-text-secondary',
  sent: 'text-brand',
  accepted: 'text-success',
  rejected: 'text-expense',
  converted: 'text-brand',
}

const operationLabels: Record<string, string> = {
  INSERT: 'Creazione',
  UPDATE: 'Modifica',
  DELETE: 'Eliminazione',
}

function getOperationIcon(op: string) {
  switch (op) {
    case 'INSERT': return Plus
    case 'UPDATE': return Edit3
    case 'DELETE': return Trash2
    default: return Plus
  }
}

const operationColors: Record<string, string> = {
  INSERT: 'text-success',
  UPDATE: 'text-brand',
  DELETE: 'text-expense',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function changedFieldsLabel(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null): string {
  if (!oldData || !newData) return ''
  const fields = Object.keys(newData).filter(
    (k) => k !== 'updated_at' && k !== 'id' && k !== 'user_id' && JSON.stringify(oldData[k]) !== JSON.stringify(newData[k]),
  )
  const fieldLabels: Record<string, string> = {
    name: 'Nome',
    email: 'Email',
    phone: 'Telefono',
    vat_number: 'Partita IVA',
    fiscal_code: 'Codice Fiscale',
    address: 'Indirizzo',
    notes: 'Note',
    color: 'Colore',
  }
  return fields.map((f) => fieldLabels[f] ?? f).join(', ')
}

export function ClientHistoryModal({ client, open, onClose }: Props) {
  const { user } = useAuth()
  const [data, setData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    setData(null)
    const fetchData = async () => {
      const [jobsRes, quotesRes, auditRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('*')
          .eq('user_id', user!.id)
          .eq('client_id', client.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('quotes')
          .select('*, clients(name)')
          .eq('user_id', user!.id)
          .eq('client_id', client.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('audit_log')
          .select('*')
          .eq('user_id', user!.id)
          .eq('record_id', client.id)
          .order('created_at', { ascending: false }),
      ])
      setData({
        jobs: (jobsRes.data ?? []) as unknown as Job[],
        quotes: (quotesRes.data ?? []) as unknown as (Quote & { clients?: { name: string } | null })[],
        auditLog: (auditRes.data ?? []) as unknown as AuditLog[],
      })
      setLoading(false)
    }
    fetchData()
  }, [open, user, client.id])

  const hasData = data && (data.jobs.length > 0 || data.quotes.length > 0 || data.auditLog.length > 0)
  const totalCount = data
    ? data.jobs.length + data.quotes.length + data.auditLog.length
    : 0

  return (
    <Modal open={open} onClose={onClose} title="" className="max-w-lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm text-white"
            style={{ backgroundColor: client.color ?? '#C5963A' }}
          >
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{client.name}</h2>
            <p className="text-xs text-text-secondary">
              Cliente · {totalCount} eventi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary border-t border-border/50 pt-4">
          {client.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
          )}
          {client.vat_number && (
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">IVA: {client.vat_number}</span>
            </div>
          )}
          {client.fiscal_code && (
            <div className="flex items-center gap-1.5 truncate">
              <CreditCard className="h-3 w-3 shrink-0" />
              <span className="truncate">CF: {client.fiscal_code}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-1.5 truncate col-span-2">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.address}</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-text-secondary">Caricamento storico...</p>
          </div>
        )}

        {!loading && data && !hasData && (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <History className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Nessuna attività registrata per questo cliente</p>
          </div>
        )}

        {!loading && data && hasData && (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
            {data.jobs.length > 0 && (
              <Section icon={Briefcase} title={`Lavori (${data.jobs.length})`} color="text-brand">
                <div className="space-y-2">
                  {data.jobs.map((job) => {
                    const StatusIcon = statusJobIcon[job.status]
                    return (
                      <div
                        key={job.id}
                        className="flex items-start gap-3 rounded-xl bg-surface/40 p-3 border border-border/30"
                      >
                        <div className={`mt-0.5 ${statusJobColor[job.status]}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium truncate">{job.title}</p>
                            <span className="text-sm font-semibold font-mono tabular-nums shrink-0 text-text-primary">
                              {formatAmount(job.net_amount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusJobColor[job.status]}`}>
                              {statusJobLabel[job.status]}
                            </span>
                            <span className="text-[10px] text-text-secondary flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {formatDateShort(job.start_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            {data.quotes.length > 0 && (
              <Section icon={Receipt} title={`Preventivi (${data.quotes.length})`} color="text-brand">
                <div className="space-y-2">
                  {data.quotes.map((quote) => {
                    const StatusIcon = statusQuoteIcon[quote.status]
                    return (
                      <div
                        key={quote.id}
                        className="flex items-start gap-3 rounded-xl bg-surface/40 p-3 border border-border/30"
                      >
                        <div className={`mt-0.5 ${statusQuoteColor[quote.status]}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium truncate">{quote.title}</p>
                            <span className="text-sm font-semibold font-mono tabular-nums shrink-0 text-text-primary">
                              {formatAmount(quote.net_amount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusQuoteColor[quote.status]}`}>
                              {statusQuoteLabel[quote.status]}
                            </span>
                            <span className="text-[10px] text-text-secondary flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {formatDateShort(quote.issued_date)}
                            </span>
                          </div>
                          {quote.quote_number && (
                            <p className="text-[10px] text-text-secondary mt-0.5">#{quote.quote_number}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            {data.auditLog.length > 0 && (
              <Section icon={History} title={`Registro modifiche (${data.auditLog.length})`} color="text-brand">
                <div className="space-y-2">
                  {data.auditLog.map((entry) => {
                    const OpIcon = getOperationIcon(entry.operation)
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 rounded-xl bg-surface/40 p-3 border border-border/30"
                      >
                        <div className={`mt-0.5 ${operationColors[entry.operation]}`}>
                          <OpIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {operationLabels[entry.operation]}
                          </p>
                          {entry.operation === 'UPDATE' && entry.old_data && entry.new_data && (
                            <p className="text-[10px] text-text-secondary mt-0.5">
                              Campi modificati: {changedFieldsLabel(entry.old_data, entry.new_data)}
                            </p>
                          )}
                          <p className="text-[10px] text-text-secondary flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDate(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function Section({
  icon: Icon,
  title,
  children,
  color,
}: {
  icon: typeof Briefcase
  title: string
  children: React.ReactNode
  color: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  )
}

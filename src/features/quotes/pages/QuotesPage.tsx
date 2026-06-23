import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, X, ArrowRight, FileText, Trash2, Loader2 } from 'lucide-react'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { Toast } from '../../../shared/ui/Toast'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Badge } from '../../../shared/ui/Badge'
import { QueryLoading, QueryError } from '../../../shared/ui/QueryState'
import { useQuotes, useCreateQuote, useUpdateQuoteStatus, useConvertQuoteToJob, useDeleteQuote } from '../../../lib/hooks/useQuotes'
import { useClients } from '../../../lib/hooks/useClients'
import type { Quote, QuoteStatus } from '../../../types/database'

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null

const statusLabels: Record<QuoteStatus, string> = {
  draft: 'Bozza',
  sent: 'Inviato',
  accepted: 'Accettato',
  rejected: 'Rifiutato',
  converted: 'Convertito',
}

const statusBadge: Record<QuoteStatus, 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
  draft: 'neutral',
  sent: 'info',
  accepted: 'success',
  rejected: 'danger',
  converted: 'warning',
}

export function QuotesPage() {
  const { data: quotes, isLoading, error } = useQuotes()
  const { data: clients } = useClients()
  const createQuote = useCreateQuote()
  const updateStatus = useUpdateQuoteStatus()
  const convertToJob = useConvertQuoteToJob()
  const deleteQuote = useDeleteQuote()
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    gross_amount: 0,
    tax_rate: 22,
    valid_until: '',
    notes: '',
  })

  const netAmount = formData.gross_amount / (1 + formData.tax_rate / 100)
  const taxAmount = formData.gross_amount - netAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createQuote.mutateAsync({
        client_id: formData.client_id || undefined,
        title: formData.title,
        description: formData.description || undefined,
        gross_amount: formData.gross_amount,
        tax_amount: Math.round(taxAmount * 100) / 100,
        net_amount: Math.round(netAmount * 100) / 100,
        tax_rate: formData.tax_rate,
        valid_until: formData.valid_until || undefined,
        notes: formData.notes || undefined,
      })
      setToast({ message: 'Preventivo creato con successo', type: 'success' })
      setShowForm(false)
      setFormData({ client_id: '', title: '', description: '', gross_amount: 0, tax_rate: 22, valid_until: '', notes: '' })
    } catch {
      setToast({ message: 'Errore nella creazione del preventivo', type: 'error' })
    }
  }

  async function handleConvert(quote: Quote) {
    try {
      await convertToJob.mutateAsync({
        quoteId: quote.id,
        jobData: {
          title: quote.title,
          client_id: quote.client_id ?? undefined,
          amount_card: quote.net_amount,
          status: 'completed_pending',
        },
      })
      setToast({ message: 'Preventivo convertito in lavoro con successo', type: 'success' })
    } catch {
      setToast({ message: 'Errore nella conversione', type: 'error' })
    }
  }

  if (isLoading) return <QueryLoading />
  if (error) return <QueryError message="Errore caricamento preventivi" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Preventivi</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Nuovo Preventivo
        </Button>
      </div>

      {(!quotes || quotes.length === 0) ? (
        <GlassCard className="p-12">
          <EmptyState
            title="Nessun preventivo"
            description="Crea il tuo primo preventivo da inviare ai clienti"
          />
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote, i) => {
            const quoteTotal = quote.gross_amount + (quote.tax_amount || 0)
            return (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <GlassCard className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-text-secondary">{quote.quote_number}</p>
                      <h3 className="text-lg font-medium mt-1">{quote.title}</h3>
                      {quote.clients?.name && (
                        <p className="text-sm text-text-secondary mt-1">{quote.clients.name}</p>
                      )}
                    </div>
                    <Badge variant={statusBadge[quote.status]}>{statusLabels[quote.status]}</Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold font-mono tabular-nums">
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: quote.currency || 'EUR' }).format(quoteTotal)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quote.status === 'draft' && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ quoteId: quote.id, status: 'sent' })}>
                        <Check className="h-3.5 w-3.5" /> Invia
                      </Button>
                    )}
                    {quote.status === 'sent' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ quoteId: quote.id, status: 'accepted' })}>
                          <Check className="h-3.5 w-3.5" /> Accetta
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => updateStatus.mutate({ quoteId: quote.id, status: 'rejected' })}>
                          <X className="h-3.5 w-3.5" /> Rifiuta
                        </Button>
                      </>
                    )}
                    {quote.status === 'accepted' && (
                      <Button size="sm" onClick={() => handleConvert(quote)}>
                        <ArrowRight className="h-3.5 w-3.5" /> Crea Lavoro
                      </Button>
                    )}
                    {(quote.status === 'draft' || quote.status === 'rejected') && (
                      <Button size="sm" variant="danger" onClick={() => deleteQuote.mutate(quote.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuovo Preventivo">
        <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">Seleziona cliente</option>
                  {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titolo *</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Importo Lordo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gross_amount || ''}
                    onChange={(e) => setFormData({ ...formData, gross_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IVA (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
              <div className="text-sm text-text-secondary space-y-1 p-3 rounded-xl bg-surface/60">
                <p>Netto: <span className="text-text-primary font-mono">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(netAmount)}</span></p>
                <p>IVA: <span className="text-text-primary font-mono">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(taxAmount)}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valido fino al</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Annulla</Button>
                <Button type="submit" disabled={createQuote.isPending}>
                  {createQuote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Crea Preventivo
                </Button>
              </div>
            </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

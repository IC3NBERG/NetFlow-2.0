import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, X, ArrowRight, FileText, Trash2, Loader2, Banknote, CreditCard, ArrowLeftRight } from 'lucide-react'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { Toast } from '../../../shared/ui/Toast'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Badge } from '../../../shared/ui/Badge'
import { QueryLoading, QueryError } from '../../../shared/ui/QueryState'
import { useQuotes, useCreateQuote, useUpdateQuoteStatus, useConvertQuoteToJob, useDeleteQuote } from '../../../lib/hooks/useQuotes'
import { useClients } from '../../../lib/hooks/useClients'
import { useFiscalSetup } from '../../../lib/hooks/useFiscalSetup'
import { useAuth } from '../../../app/providers/AuthProvider'
import { netToGross, grossToNet, computeJobNetAmount } from '../../../lib/tax'
import type { Quote, QuoteStatus, PaymentMethod, TaxRegime } from '../../../types/database'

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

const paymentMethodIcons: Record<PaymentMethod, typeof Banknote> = {
  card: CreditCard,
  cash: Banknote,
  mixed: ArrowLeftRight,
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  card: 'Carta',
  cash: 'Contanti',
  mixed: 'Misto',
}

const regimeLabels: Record<TaxRegime, string> = {
  occasional: 'Prestazione Occasionale',
  vat_flat: 'Forfettario',
  vat_standard: 'Ordinario',
}

export function QuotesPage() {
  const { data: quotes, isLoading, error } = useQuotes()
  const { data: clients } = useClients()
  const { user } = useAuth()
  const { data: fiscalSetup } = useFiscalSetup()
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
    payment_method: 'card' as PaymentMethod,
    amount_card: 0,
    amount_cash: 0,
    include_cash_in_invoice: false,
    net_amount: 0,
    gross_amount: 0,
    tax_rate: 22,
    valid_until: '',
    notes: '',
  })

  const taxRegime: TaxRegime = fiscalSetup?.tax_regime ?? user?.tax_regime ?? 'occasional'
  const customIrpef = fiscalSetup?.custom_irpef_rate

  const grossTotal = formData.amount_card + formData.amount_cash
  const fiscalDeduction = formData.net_amount > 0 && grossTotal > 0
    ? grossTotal - formData.net_amount
    : 0

  const syncing = useRef(false)

  useEffect(() => {
    if (!showForm) {
      setFormData({
        client_id: '',
        title: '',
        description: '',
        payment_method: 'card',
        amount_card: 0,
        amount_cash: 0,
        include_cash_in_invoice: false,
        net_amount: 0,
        gross_amount: 0,
        tax_rate: 22,
        valid_until: '',
        notes: '',
      })
    }
  }, [showForm])

  function handleNetChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    const net = value
    const gross = value > 0 ? netToGross(value, taxRegime, customIrpef) : 0
    setFormData((prev) => ({
      ...prev,
      net_amount: net,
      ...(prev.payment_method !== 'mixed'
        ? { amount_card: gross, amount_cash: 0, gross_amount: gross }
        : { gross_amount: gross }),
    }))
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleGrossChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    const gross = value
    const net = value > 0 ? grossToNet(value, taxRegime, customIrpef) : 0
    setFormData((prev) => ({
      ...prev,
      net_amount: net,
      ...(prev.payment_method !== 'mixed'
        ? { amount_card: gross, amount_cash: 0, gross_amount: gross }
        : { gross_amount: gross }),
    }))
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handlePaymentMethodChange(method: PaymentMethod) {
    setFormData((prev) => {
      const next = { ...prev, payment_method: method }
      if (prev.net_amount > 0 && method !== 'mixed') {
        const gross = netToGross(prev.net_amount, taxRegime, customIrpef)
        next.amount_card = gross
        next.amount_cash = 0
        next.gross_amount = gross
      } else if (method === 'mixed') {
        next.gross_amount = prev.amount_card + prev.amount_cash || prev.gross_amount
      }
      return next
    })
  }

  function handleCardChange(value: number) {
    setFormData((prev) => {
      const net = computeJobNetAmount(value, prev.amount_cash, 'mixed', prev.include_cash_in_invoice, taxRegime, customIrpef)
      return { ...prev, amount_card: value, gross_amount: value + prev.amount_cash, net_amount: net }
    })
  }

  function handleCashChange(value: number) {
    setFormData((prev) => {
      const net = computeJobNetAmount(prev.amount_card, value, 'mixed', prev.include_cash_in_invoice, taxRegime, customIrpef)
      return { ...prev, amount_cash: value, gross_amount: prev.amount_card + value, net_amount: net }
    })
  }

  function handleIncludeCashChange(checked: boolean) {
    setFormData((prev) => {
      const method = prev.payment_method
      if (method === 'cash') {
        const net = computeJobNetAmount(0, prev.amount_cash, method, checked, taxRegime, customIrpef)
        return { ...prev, include_cash_in_invoice: checked, net_amount: net }
      }
      if (method === 'mixed') {
        const net = computeJobNetAmount(prev.amount_card, prev.amount_cash, method, checked, taxRegime, customIrpef)
        return { ...prev, include_cash_in_invoice: checked, net_amount: net }
      }
      return { ...prev, include_cash_in_invoice: checked }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const taxAmount = grossTotal - formData.net_amount
      await createQuote.mutateAsync({
        client_id: formData.client_id || undefined,
        title: formData.title,
        description: formData.description || undefined,
        payment_method: formData.payment_method,
        amount_card: formData.amount_card,
        amount_cash: formData.amount_cash,
        include_cash_in_invoice: formData.include_cash_in_invoice,
        gross_amount: grossTotal,
        net_amount: formData.net_amount,
        tax_amount: Math.max(0, Math.round(taxAmount * 100) / 100),
        tax_rate: formData.tax_rate,
        valid_until: formData.valid_until || undefined,
        notes: formData.notes || undefined,
      })
      setToast({ message: 'Preventivo creato con successo', type: 'success' })
      setShowForm(false)
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
          payment_method: quote.payment_method,
          amount_card: quote.amount_card,
          amount_cash: quote.amount_cash,
          include_cash_in_invoice: quote.include_cash_in_invoice,
          net_amount: quote.net_amount,
          status: 'active',
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
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Preventivi</h2>
          <p className="text-xs md:text-sm text-text-secondary">Gestisci i tuoi preventivi clienti</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="text-xs md:text-sm px-3 md:px-4">
            <Plus className="mr-1 md:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nuovo Preventivo</span>
            <span className="sm:hidden">Nuovo</span>
          </Button>
        )}
      </div>

      {(!quotes || quotes.length === 0) ? (
        <EmptyState
          title="Nessun preventivo"
          description="Crea il tuo primo preventivo da inviare ai clienti"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote, i) => {
            const PaymentIcon = paymentMethodIcons[quote.payment_method]
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
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: quote.currency || 'EUR' }).format(quote.gross_amount)}
                    </span>
                  </div>
                  {quote.net_amount > 0 && (
                    <p className="text-xs text-text-secondary">
                      Netto: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: quote.currency || 'EUR' }).format(quote.net_amount)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <PaymentIcon className="h-3.5 w-3.5" />
                    <span>{paymentMethodLabels[quote.payment_method]}</span>
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

          <div>
            <label className="block text-sm font-medium mb-2">Metodo di Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {(['card', 'cash', 'mixed'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handlePaymentMethodChange(method)}
                  className={`rounded-full border py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    formData.payment_method === method
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border bg-surface/60 text-text-secondary hover:border-brand/50'
                  }`}
                >
                  {method === 'card' ? <CreditCard className="h-3.5 w-3.5" /> : method === 'cash' ? <Banknote className="h-3.5 w-3.5" /> : <ArrowLeftRight className="h-3.5 w-3.5" />}
                  {paymentMethodLabels[method]}
                </button>
              ))}
            </div>
          </div>

          {formData.payment_method === 'mixed' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Carta (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount_card || ''}
                  onChange={(e) => handleCardChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contanti (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount_cash || ''}
                  onChange={(e) => handleCashChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
              </div>
            </div>
          )}

          {(formData.payment_method === 'cash' || formData.payment_method === 'mixed') && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-surface/60">
              <input
                type="checkbox"
                checked={formData.include_cash_in_invoice}
                onChange={(e) => handleIncludeCashChange(e.target.checked)}
                className="h-5 w-5 rounded-lg border-border bg-surface text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium">Includi contanti in fattura</p>
                <p className="text-xs text-text-secondary">
                  {formData.include_cash_in_invoice
                    ? 'Il contanti sarà tassato e incluso in fattura'
                    : 'Il contanti sarà tracciato internamente senza tassazione'}
                </p>
              </div>
            </label>
          )}

          <div className="p-3 rounded-xl bg-surface/60 space-y-1">
            <p className="text-xs text-text-secondary">
              Regime fiscale: <span className="text-text-primary font-medium">{regimeLabels[taxRegime]}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Netto desiderato (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.net_amount || ''}
                onChange={(e) => handleNetChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lordo (€)</label>
              <input
                type="number"
                step="0.01"
                value={grossTotal || ''}
                onChange={(e) => handleGrossChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
            </div>
          </div>

          {fiscalDeduction > 0 && (
            <p className="text-xs text-text-secondary">
              Deduzione fiscale: {(1 - formData.net_amount / grossTotal) * 100 > 0
                ? `${((1 - formData.net_amount / grossTotal) * 100).toFixed(1)}%`
                : '0%'} — Netto {formData.net_amount.toFixed(2)}€ → Lordo {grossTotal.toFixed(2)}€
            </p>
          )}

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

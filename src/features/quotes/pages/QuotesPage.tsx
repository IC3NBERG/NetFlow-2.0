import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { cn } from '../../../lib/utils'
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

const filters = [
  { id: 'all' as const, label: 'Tutti' },
  { id: 'draft' as const, label: 'Bozze' },
  { id: 'sent' as const, label: 'Inviati' },
  { id: 'accepted' as const, label: 'Accettati' },
  { id: 'rejected' as const, label: 'Rifiutati' },
  { id: 'converted' as const, label: 'Convertiti' },
]

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
  const [activeFilter, setActiveFilter] = useState<'all' | QuoteStatus>('all')
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

  // Handle suggested action query param
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)
    if (queryParams.get('action') === 'new') {
      window.history.replaceState({}, document.title, window.location.pathname)
      setShowForm(true)
    }
  }, [])

  function handleNetChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    const gross = value > 0 ? netToGross(value, taxRegime, customIrpef) : 0
    setFormData((prev) => ({
      ...prev,
      net_amount: value,
      gross_amount: gross,
      ...(prev.payment_method === 'card' ? { amount_card: gross, amount_cash: 0 } : {}),
      ...(prev.payment_method === 'cash' ? { amount_cash: gross, amount_card: 0 } : {}),
    }))
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleGrossChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    const net = value > 0 ? grossToNet(value, taxRegime, customIrpef) : 0
    setFormData((prev) => ({
      ...prev,
      net_amount: net,
      gross_amount: value,
      ...(prev.payment_method === 'card' ? { amount_card: value, amount_cash: 0 } : {}),
      ...(prev.payment_method === 'cash' ? { amount_cash: value, amount_card: 0 } : {}),
    }))
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handlePaymentMethodChange(method: PaymentMethod) {
    setFormData((prev) => {
      const next = { ...prev, payment_method: method }
      if (prev.net_amount > 0 && method !== 'mixed') {
        const gross = netToGross(prev.net_amount, taxRegime, customIrpef)
        if (method === 'card') {
          next.amount_card = gross
          next.amount_cash = 0
        } else {
          next.amount_card = 0
          next.amount_cash = gross
        }
        next.gross_amount = gross
      } else if (method === 'mixed') {
        next.gross_amount = prev.amount_card + prev.amount_cash || prev.gross_amount
      }
      return next
    })
  }

  function handleCashSingleChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setFormData((prev) => ({
      ...prev,
      amount_card: 0,
      amount_cash: value,
      gross_amount: value,
      net_amount: value,
    }))
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCardNettoChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    const cardLordo = value > 0 ? netToGross(value, taxRegime, customIrpef) : 0
    setFormData((prev) => {
      const cashNet = prev.include_cash_in_invoice
        ? (prev.amount_cash > 0 ? grossToNet(prev.amount_cash, taxRegime, customIrpef) : 0)
        : prev.amount_cash
      return {
        ...prev,
        amount_card: cardLordo,
        gross_amount: cardLordo + prev.amount_cash,
        net_amount: value + cashNet,
      }
    })
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCardLordoChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setFormData((prev) => {
      const cardNet = value > 0 ? grossToNet(value, taxRegime, customIrpef) : 0
      const cashNet = prev.include_cash_in_invoice
        ? (prev.amount_cash > 0 ? grossToNet(prev.amount_cash, taxRegime, customIrpef) : 0)
        : prev.amount_cash
      return {
        ...prev,
        amount_card: value,
        gross_amount: value + prev.amount_cash,
        net_amount: cardNet + cashNet,
      }
    })
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCashNettoChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    const cashLordo = value > 0 ? netToGross(value, taxRegime, customIrpef) : 0
    setFormData((prev) => ({
      ...prev,
      amount_cash: cashLordo,
      gross_amount: prev.amount_card + cashLordo,
      net_amount: (prev.amount_card > 0 ? grossToNet(prev.amount_card, taxRegime, customIrpef) : 0) + value,
    }))
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCashLordoChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setFormData((prev) => ({
      ...prev,
      amount_cash: value,
      gross_amount: prev.amount_card + value,
      net_amount: (prev.amount_card > 0 ? grossToNet(prev.amount_card, taxRegime, customIrpef) : 0) + (value > 0 ? grossToNet(value, taxRegime, customIrpef) : 0),
    }))
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCashSingleChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setFormData((prev) => ({
      ...prev,
      amount_cash: value,
      gross_amount: prev.amount_card + value,
      net_amount: (prev.amount_card > 0 ? grossToNet(prev.amount_card, taxRegime, customIrpef) : 0) + value,
    }))
    requestAnimationFrame(() => { syncing.current = false })
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

  const filteredQuotes = (quotes || []).filter((q) => {
    if (activeFilter !== 'all' && q.status !== activeFilter) return false
    return true
  })

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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              'rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all border shrink-0',
              activeFilter === filter.id
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border bg-surface text-text-secondary hover:border-brand/50 hover:text-text-primary',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {(!quotes || quotes.length === 0) ? (
        <EmptyState
          title="Nessun preventivo"
          description="Crea il tuo primo preventivo da inviare ai clienti"
        />
      ) : filteredQuotes.length === 0 ? (
        <EmptyState
          title="Nessun preventivo trovato"
          description="Nessun preventivo corrisponde allo stato selezionato."
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredQuotes.map((quote) => {
              const PaymentIcon = paymentMethodIcons[quote.payment_method]
              return (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                <GlassCard className="p-4 md:p-5 flex flex-col justify-between h-full space-y-4">
                  {/* Top Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] md:text-xs text-text-secondary font-mono tracking-tight">{quote.quote_number}</p>
                        <h3 className="text-base md:text-lg font-bold mt-0.5 line-clamp-1">{quote.title}</h3>
                        <p className="text-xs text-text-secondary font-medium mt-0.5 truncate">
                          Cliente: <span className="text-text-primary">{quote.clients?.name || '—'}</span>
                        </p>
                      </div>
                      <Badge variant={statusBadge[quote.status]} className="shrink-0 text-[10px] md:text-xs px-2.5 py-0.5 uppercase tracking-wide">
                        {statusLabels[quote.status]}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs text-text-secondary line-clamp-2 mt-1 min-h-[2rem]">
                        {quote.description || <span className="italic opacity-60">Nessun dettaglio aggiuntivo</span>}
                      </p>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-2 gap-4 border-t border-b border-border/50 py-3 my-1">
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">Lordo</p>
                      <p className="text-lg md:text-xl font-bold font-mono mt-0.5 text-text-primary">
                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: quote.currency || 'EUR' }).format(quote.gross_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">Netto</p>
                      <p className="text-lg md:text-xl font-bold font-mono mt-0.5 text-text-primary">
                        {quote.net_amount > 0 
                          ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: quote.currency || 'EUR' }).format(quote.net_amount)
                          : '—'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Payment Details & Actions */}
                  <div className="flex items-center justify-between gap-2 min-h-[2.25rem]">
                    <div className="flex items-center gap-1.5 text-text-secondary text-[11px]">
                      <PaymentIcon className="h-3.5 w-3.5" />
                      <span className="capitalize">{paymentMethodLabels[quote.payment_method]}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {quote.status === 'draft' && (
                        <Button size="sm" variant="secondary" className="text-xs px-2.5 h-8" onClick={() => updateStatus.mutate({ quoteId: quote.id, status: 'sent' })}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Invia
                        </Button>
                      )}
                      {quote.status === 'sent' && (
                        <>
                          <Button size="sm" variant="secondary" className="text-xs px-2.5 h-8" onClick={() => updateStatus.mutate({ quoteId: quote.id, status: 'accepted' })}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Accetta
                          </Button>
                          <Button size="sm" variant="danger" className="text-xs px-2.5 h-8" onClick={() => updateStatus.mutate({ quoteId: quote.id, status: 'rejected' })}>
                            <X className="h-3.5 w-3.5 mr-1" /> Rifiuta
                          </Button>
                        </>
                      )}
                      {quote.status === 'accepted' && (
                        <Button size="sm" className="text-xs px-3 h-8 shadow-sm" onClick={() => handleConvert(quote)}>
                          <ArrowRight className="h-3.5 w-3.5 mr-1" /> Crea Lavoro
                        </Button>
                      )}
                      {quote.status === 'converted' && (
                        <div className="flex items-center gap-1 text-warning bg-warning/10 px-3 py-1.5 rounded-full text-xs font-semibold">
                          <Check className="h-3.5 w-3.5" />
                          <span>Convertito</span>
                        </div>
                      )}
                      {quote.status === 'rejected' && (
                        <div className="flex items-center gap-1 text-expense bg-expense/10 px-3 py-1.5 rounded-full text-xs font-semibold">
                          <X className="h-3.5 w-3.5" />
                          <span>Rifiutato</span>
                        </div>
                      )}
                      {(quote.status === 'draft' || quote.status === 'rejected') && (
                        <Button size="sm" variant="danger" className="text-xs p-1.5 h-8 w-8 flex items-center justify-center" onClick={() => deleteQuote.mutate(quote.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
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

          {formData.payment_method === 'card' && (
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
          )}

          {formData.payment_method === 'cash' && !formData.include_cash_in_invoice && (
            <div>
              <label className="block text-sm font-medium mb-1">Contanti (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount_cash || ''}
                onChange={(e) => handleCashSingleChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
            </div>
          )}

          {formData.payment_method === 'cash' && formData.include_cash_in_invoice && (
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
          )}

          {formData.payment_method === 'mixed' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-text-secondary mb-2">Carta di credito</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Netto (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount_card > 0 ? grossToNet(formData.amount_card, taxRegime, customIrpef) : ''}
                      onChange={(e) => handleMixedCardNettoChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Lordo (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount_card || ''}
                      onChange={(e) => handleMixedCardLordoChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary mb-2">
                  Contanti
                  {!formData.include_cash_in_invoice && <span className="text-text-secondary/60 ml-1">(non in fattura)</span>}
                </p>
                {formData.include_cash_in_invoice ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Netto (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount_cash > 0 ? grossToNet(formData.amount_cash, taxRegime, customIrpef) : ''}
                        onChange={(e) => handleMixedCashNettoChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lordo (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount_cash || ''}
                        onChange={(e) => handleMixedCashLordoChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Contanti (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount_cash || ''}
                      onChange={(e) => handleMixedCashSingleChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                    />
                  </div>
                )}
              </div>
              {formData.net_amount > 0 && grossTotal > 0 && (
                <p className="text-xs text-text-secondary">
                  Totale: Netto {formData.net_amount.toFixed(2)}€ → Lordo {grossTotal.toFixed(2)}€
                </p>
              )}
            </div>
          )}

          {formData.net_amount > 0 && grossTotal > 0 && formData.payment_method !== 'mixed' && (
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

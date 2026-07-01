import { useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../shared/ui/Modal'
import { Input } from '../../../shared/ui/Input'
import { FormSection } from '../../../shared/ui/FormSection'
import { Button } from '../../../shared/ui/Button'
import { ClientSelect } from './ClientSelect'
import { CurrencySelect } from '../../../shared/ui/CurrencySelect'
import { useAuth } from '../../../app/providers/AuthProvider'
import { useFiscalSetup } from '../../../lib/hooks/useFiscalSetup'
import { netToGross, grossToNet, computeJobNetAmount } from '../../../lib/tax'
import type { Job, TaxRegime } from '../../../types/database'

const jobSchema = z.object({
  title: z.string().min(2, 'Inserisci almeno 2 caratteri'),
  description: z.string().optional(),
  payment_method: z.enum(['card', 'cash', 'mixed']),
  net_amount: z.number().min(0, 'Importo non valido'),
  amount_card: z.number().min(0, 'Importo non valido'),
  amount_cash: z.number().min(0, 'Importo non valido'),
  include_cash_in_invoice: z.boolean(),
  status: z.enum(['active', 'completed_pending', 'completed_settled']),
  client_id: z.string().nullable(),
  start_date: z.string().min(1, 'Data richiesta'),
  pending_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  attachment_urls: z.array(z.string()).default([]),
  currency: z.string().default('EUR'),
})

export type JobFormData = z.infer<typeof jobSchema>

interface JobFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: JobFormData) => Promise<void>
  initialData?: Job | null
  isSubmitting?: boolean
}

export function JobFormModal({ open, onClose, onSubmit, initialData, isSubmitting }: JobFormModalProps) {
  const { user } = useAuth()
  const { data: fiscalSetup } = useFiscalSetup()
  const taxRegime: TaxRegime = fiscalSetup?.tax_regime ?? user?.tax_regime ?? 'occasional'
  const customIrpef = fiscalSetup?.custom_irpef_rate

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description ?? '',
      payment_method: initialData.payment_method,
      net_amount: initialData.net_amount ?? 0,
      amount_card: initialData.amount_card,
      amount_cash: initialData.amount_cash,
      include_cash_in_invoice: initialData.include_cash_in_invoice,
      status: initialData.status,
      client_id: initialData.client_id,
      start_date: initialData.start_date,
      pending_date: initialData.pending_date,
      end_date: initialData.end_date,
      attachment_urls: initialData.attachment_urls ?? [],
      currency: initialData.currency ?? 'EUR',
    } : {
      title: '',
      description: '',
      payment_method: 'card',
      net_amount: 0,
      amount_card: 0,
      amount_cash: 0,
      include_cash_in_invoice: false,
      status: 'active',
      client_id: null,
      start_date: new Date().toISOString().split('T')[0] ?? '',
      pending_date: null,
      end_date: null,
    },
  })

  const syncing = useRef(false)

  useEffect(() => {
    if (!open) return
    if (initialData) {
      reset({
        title: initialData.title,
        description: initialData.description ?? '',
        payment_method: initialData.payment_method,
        net_amount: initialData.net_amount ?? 0,
        amount_card: initialData.amount_card,
        amount_cash: initialData.amount_cash,
        include_cash_in_invoice: initialData.include_cash_in_invoice,
        status: initialData.status,
        client_id: initialData.client_id,
        start_date: initialData.start_date,
        pending_date: initialData.pending_date,
        end_date: initialData.end_date,
        currency: initialData.currency ?? 'EUR',
        attachment_urls: initialData.attachment_urls ?? [],
      })
    } else {
      reset({
        title: '',
        description: '',
        payment_method: 'card',
        net_amount: 0,
        amount_card: 0,
        amount_cash: 0,
        include_cash_in_invoice: false,
        status: 'active',
        client_id: null,
        start_date: new Date().toISOString().split('T')[0] ?? '',
        pending_date: null,
        end_date: null,
        currency: 'EUR',
        attachment_urls: [],
      })
    }
  }, [initialData, open, reset])

  const paymentMethod = watch('payment_method')
  const includeCash = watch('include_cash_in_invoice')
  const netAmount = watch('net_amount')
  const amountCard = watch('amount_card')
  const amountCash = watch('amount_cash')
  const endDate = watch('end_date')
  const pendingDate = watch('pending_date')
  const grossTotal = amountCard + amountCash

  const currency = watch('currency')
  const prevCurrency = useRef(currency)

  // Real-time Currency Conversion
  useEffect(() => {
    if (prevCurrency.current === currency) return
    const from = prevCurrency.current
    prevCurrency.current = currency

    async function convert() {
      if (netAmount <= 0 && amountCard <= 0 && amountCash <= 0) return
      try {
        const { getExchangeRate } = await import('../../../lib/exchangeRate')
        // Get rates for both currencies to convert between them
        const rateFrom = await getExchangeRate(from)
        const rateTo = await getExchangeRate(currency)
        
        // Convert to EUR first, then to the target currency
        const convertVal = (val: number) => {
          const inEur = from === 'EUR' ? val : val / rateFrom
          return currency === 'EUR' ? inEur : inEur * rateTo
        }

        setValue('net_amount', Math.round(convertVal(netAmount) * 100) / 100)
        setValue('amount_card', Math.round(convertVal(amountCard) * 100) / 100)
        setValue('amount_cash', Math.round(convertVal(amountCash) * 100) / 100)
      } catch (err) {
        console.error('Real-time currency conversion failed:', err)
      }
    }
    convert()
  }, [currency, setValue, netAmount, amountCard, amountCash])

  // Bidirectional state and date synchronization
  const status = watch('status')
  const prevStatus = useRef(status)

  // 1. Sync from Status to Date
  useEffect(() => {
    if (prevStatus.current === status) return
    prevStatus.current = status

    const today = new Date().toISOString().split('T')[0]
    if (status === 'completed_settled') {
      setValue('end_date', today)
      if (!pendingDate) {
        setValue('pending_date', today)
      }
    } else if (status === 'completed_pending') {
      setValue('end_date', undefined)
      setValue('pending_date', today)
    } else if (status === 'active') {
      setValue('end_date', undefined)
      setValue('pending_date', undefined)
    }
  }, [status, setValue, pendingDate])

  // 2. Sync from Date to Status
  useEffect(() => {
    if (endDate) {
      if (status !== 'completed_settled') {
        setValue('status', 'completed_settled')
        prevStatus.current = 'completed_settled'
      }
    } else if (pendingDate) {
      if (status !== 'completed_pending') {
        setValue('status', 'completed_pending')
        prevStatus.current = 'completed_pending'
      }
    } else {
      if (status !== 'active') {
        setValue('status', 'active')
        prevStatus.current = 'active'
      }
    }
  }, [endDate, pendingDate, setValue])

  const prevIncludeCash = useRef(includeCash)

  useEffect(() => {
    if (initialData) return
    if (prevIncludeCash.current === includeCash) return
    prevIncludeCash.current = includeCash
    const net = computeJobNetAmount(amountCard, amountCash, paymentMethod, includeCash, taxRegime, customIrpef)
    setValue('net_amount', net)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeCash])

  const updateSplit = useCallback((gross: number) => {
    const method = watch('payment_method')
    if (method === 'card') {
      setValue('amount_card', gross)
      setValue('amount_cash', 0)
    } else if (method === 'cash') {
      setValue('amount_card', 0)
      setValue('amount_cash', gross)
    }
  }, [watch, setValue])

  function handleNetChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setValue('net_amount', value)
    if (value > 0) {
      const gross = netToGross(value, taxRegime, customIrpef)
      if (paymentMethod !== 'mixed') {
        updateSplit(gross)
      } else if (amountCard === 0 && amountCash === 0) {
        setValue('amount_card', gross)
        setValue('amount_cash', 0)
      }
    }
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleGrossChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    if (value > 0) {
      const net = grossToNet(value, taxRegime, customIrpef)
      setValue('net_amount', net)
      if (paymentMethod !== 'mixed') {
        updateSplit(value)
      }
    }
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handlePaymentMethodChange(method: 'card' | 'cash' | 'mixed') {
    setValue('payment_method', method)
    if (netAmount > 0 && method !== 'mixed') {
      const gross = netToGross(netAmount, taxRegime, customIrpef)
      if (method === 'card') {
        setValue('amount_card', gross)
        setValue('amount_cash', 0)
      } else {
        setValue('amount_card', 0)
        setValue('amount_cash', gross)
      }
    }
  }

  function handleCashSingleChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setValue('amount_cash', value)
    setValue('net_amount', value)
    setValue('amount_card', 0)
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCardNettoChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    const cardLordo = value > 0 ? netToGross(value, taxRegime, customIrpef) : 0
    setValue('amount_card', cardLordo)
    const cashNet = includeCash
      ? (amountCash > 0 ? grossToNet(amountCash, taxRegime, customIrpef) : 0)
      : amountCash
    setValue('net_amount', value + cashNet)
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCardLordoChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setValue('amount_card', value)
    const cardNet = value > 0 ? grossToNet(value, taxRegime, customIrpef) : 0
    const cashNet = includeCash
      ? (amountCash > 0 ? grossToNet(amountCash, taxRegime, customIrpef) : 0)
      : amountCash
    setValue('net_amount', cardNet + cashNet)
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCashNettoChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    const cashLordo = value > 0 ? netToGross(value, taxRegime, customIrpef) : 0
    setValue('amount_cash', cashLordo)
    const cardNet = amountCard > 0 ? grossToNet(amountCard, taxRegime, customIrpef) : 0
    setValue('net_amount', cardNet + value)
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCashLordoChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setValue('amount_cash', value)
    const cardNet = amountCard > 0 ? grossToNet(amountCard, taxRegime, customIrpef) : 0
    const cashNet = value > 0 ? grossToNet(value, taxRegime, customIrpef) : 0
    setValue('net_amount', cardNet + cashNet)
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleMixedCashSingleChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setValue('amount_cash', value)
    const cardNet = amountCard > 0 ? grossToNet(amountCard, taxRegime, customIrpef) : 0
    setValue('net_amount', cardNet + value)
    requestAnimationFrame(() => { syncing.current = false })
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <FormSection title="Dati Principali" className="relative z-30">
        <Input
          label="Titolo *"
          placeholder="Consulenza trimestrale"
          error={errors.title?.message}
          {...register('title')}
        />
        <div>
          <label className="block text-sm text-text-secondary mb-1">Descrizione</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Descrizione del lavoro..."
            className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 resize-none"
          />
        </div>
        <ClientSelect
          value={watch('client_id')}
          onChange={(id) => setValue('client_id', id)}
        />
      </FormSection>

      <FormSection title="Tempistiche">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Data inizio *"
            type="date"
            error={errors.start_date?.message}
            {...register('start_date')}
          />
          <Input
            label="Scadenza pag."
            type="date"
            {...register('pending_date')}
          />
          <Input
            label="Data fine"
            type="date"
            {...register('end_date')}
          />
        </div>
      </FormSection>
      <FormSection title="Tipo di Pagamento">
        <div>
          <label className="block text-sm text-text-secondary mb-2">Metodo</label>
          <div className="grid grid-cols-3 gap-2">
            {(['card', 'cash', 'mixed'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => handlePaymentMethodChange(method)}
                className={`rounded-full border py-3 text-sm font-medium transition-all ${
                  paymentMethod === method
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border bg-surface text-text-secondary hover:border-brand/50'
                }`}
              >
                {method === 'card' ? 'Carta' : method === 'cash' ? 'Contanti' : 'Misto'}
              </button>
            ))}
          </div>
        </div>

        {(paymentMethod === 'cash' || paymentMethod === 'mixed') && (
          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCash}
                onChange={(e) => setValue('include_cash_in_invoice', e.target.checked)}
                className="h-5 w-5 rounded-lg border-border bg-surface text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium">Includi contanti in fattura</p>
                <p className="text-xs text-text-secondary">
                  {includeCash
                    ? `Importo contanti fatturabile: ${amountCash} €`
                    : `Contanti non in fattura. Sarà tracciato internamente.`
                  }
                </p>
              </div>
            </label>
          </div>
        )}
      </FormSection>

      <FormSection title="Dati Fiscali" description={`Regime fiscale: ${taxRegime === 'occasional' ? 'Prestazione Occasionale' : taxRegime === 'vat_flat' ? 'Forfettario' : 'Ordinario'}`}>
        {paymentMethod === 'card' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Netto desiderato (€)</label>
              <input
                type="number"
                step="0.01"
                value={netAmount || ''}
                onChange={(e) => handleNetChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Lordo (€)</label>
              <input
                type="number"
                step="0.01"
                value={grossTotal || ''}
                onChange={(e) => handleGrossChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
              />
            </div>
          </div>
        )}

        {paymentMethod === 'cash' && !includeCash && (
          <div>
            <label className="block text-sm text-text-secondary mb-1">Contanti (€)</label>
            <input
              type="number"
              step="0.01"
              value={amountCash || ''}
              onChange={(e) => handleCashSingleChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
            />
          </div>
        )}

        {paymentMethod === 'cash' && includeCash && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Netto desiderato (€)</label>
              <input
                type="number"
                step="0.01"
                value={netAmount || ''}
                onChange={(e) => handleNetChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Lordo (€)</label>
              <input
                type="number"
                step="0.01"
                value={grossTotal || ''}
                onChange={(e) => handleGrossChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
              />
            </div>
          </div>
        )}

        {paymentMethod === 'mixed' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">Carta di credito</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Netto (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountCard > 0 ? grossToNet(amountCard, taxRegime, customIrpef) : ''}
                    onChange={(e) => handleMixedCardNettoChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Lordo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountCard || ''}
                    onChange={(e) => handleMixedCardLordoChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">
                Contanti
                {!includeCash && <span className="text-text-secondary/60 ml-1">(non in fattura)</span>}
              </p>
              {includeCash ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Netto (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountCash > 0 ? grossToNet(amountCash, taxRegime, customIrpef) : ''}
                      onChange={(e) => handleMixedCashNettoChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Lordo (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountCash || ''}
                      onChange={(e) => handleMixedCashLordoChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Contanti (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountCash || ''}
                    onChange={(e) => handleMixedCashSingleChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono"
                  />
                </div>
              )}
            </div>
            {netAmount > 0 && grossTotal > 0 && (
              <p className="text-xs text-text-secondary">
                Totale: Netto {netAmount.toFixed(2)}€ → Lordo {grossTotal.toFixed(2)}€
              </p>
            )}
          </div>
        )}

        {netAmount > 0 && grossTotal > 0 && paymentMethod !== 'mixed' && (
          <p className="text-xs text-text-secondary mt-1">
            Deduzione fiscale: {((1 - netAmount / grossTotal) * 100).toFixed(1)}% — Netto {netAmount.toFixed(2)}€ → Lordo {grossTotal.toFixed(2)}€
          </p>
        )}
      </FormSection>

      <FormSection title="Valuta">
        <CurrencySelect value={watch('currency')} onChange={(v) => setValue('currency', v)} />
      </FormSection>

      <FormSection title="Stato Avanzamento">
        <div className="grid grid-cols-3 gap-2">
          {(['active', 'completed_pending', 'completed_settled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue('status', s)}
              className={`rounded-full border py-3 text-sm font-medium transition-all ${
                watch('status') === s
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border bg-surface text-text-secondary hover:border-brand/50'
              }`}
            >
              {s === 'active' ? 'Attivo' : s === 'completed_pending' ? 'Da incassare' : 'Incassato'}
            </button>
          ))}
        </div>
      </FormSection>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" type="button" onClick={onClose} className="rounded-full">Annulla</Button>
        <Button disabled={isSubmitting} className="rounded-full">
          {isSubmitting ? 'Salvataggio...' : initialData ? 'Salva modifiche' : 'Crea lavoro'}
        </Button>
      </div>
    </form>
  )

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Modifica Lavoro' : 'Nuovo Lavoro'}>
      {formContent}
    </Modal>
  )
}

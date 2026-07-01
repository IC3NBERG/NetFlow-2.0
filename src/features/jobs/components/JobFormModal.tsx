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
  pending_date: z.string().nullable(),
  end_date: z.string().nullable(),
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

  useEffect(() => {
    if (initialData) return
    if (endDate) {
      setValue('status', 'completed_settled')
    } else if (pendingDate) {
      setValue('status', 'completed_pending')
    } else {
      setValue('status', 'active')
    }
  }, [endDate, pendingDate, initialData, setValue])

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

  function handleCardChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setValue('amount_card', value)
    setValue('net_amount', computeJobNetAmount(value, amountCash, paymentMethod, includeCash, taxRegime, customIrpef))
    requestAnimationFrame(() => { syncing.current = false })
  }

  function handleCashChange(value: number) {
    if (syncing.current) return
    syncing.current = true
    setValue('amount_cash', value)
    setValue('net_amount', computeJobNetAmount(amountCard, value, paymentMethod, includeCash, taxRegime, customIrpef))
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
            {paymentMethod === 'mixed' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Carta (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountCard || ''}
                    onChange={(e) => handleCardChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Contanti (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountCash || ''}
                    onChange={(e) => handleCashChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 font-mono tabular-nums"
                  />
                </div>
              </div>
            )}
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
                    ? `Importo totale fatturabile: ${amountCard + amountCash} €`
                    : `Solo 0 € sarà in fattura. Il contanti sarà tracciato internamente.`
                  }
                </p>
              </div>
            </label>
          </div>
        )}
      </FormSection>

      <FormSection title="Dati Fiscali" description={`Regime fiscale: ${taxRegime === 'occasional' ? 'Prestazione Occasionale' : taxRegime === 'vat_flat' ? 'Forfettario' : 'Ordinario'}`}>
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
        {netAmount > 0 && grossTotal > 0 && (
          <p className="text-xs text-text-secondary mt-1">
            Deduzione fiscale: {((1 - netAmount / grossTotal) * 100).toFixed(1)}% — Netto {netAmount.toFixed(2)}€ → Lordo {grossTotal.toFixed(2)}€
          </p>
        )}
      </FormSection>

      <FormSection title="Valuta">
        <CurrencySelect value={watch('currency')} onChange={(v) => setValue('currency', v)} />
      </FormSection>

      {initialData && (
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
      )}

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

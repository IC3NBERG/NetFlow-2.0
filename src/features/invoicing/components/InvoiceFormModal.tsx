import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { SlideOver } from '../../../shared/ui/SlideOver'
import { Input } from '../../../shared/ui/Input'
import { FormSection } from '../../../shared/ui/FormSection'
import { Button } from '../../../shared/ui/Button'
import { formatCurrency } from '../../../lib/calculations'
import type { Job } from '../../../types/database'

const invoiceSchema = z.object({
  type: z.enum(['invoice', 'parcella']),
  issued_date: z.string().min(1, 'Data richiesta'),
  due_date: z.string().optional(),
  tax_rate: z.number().min(0).max(100),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormModalProps {
  open: boolean
  onClose: () => void
  selectedJobs: Job[]
  onSubmit: (data: { type: 'invoice' | 'parcella'; issued_date: string; due_date?: string; tax_rate: number }) => Promise<void>
  isSubmitting?: boolean
}

export function InvoiceFormModal({ open, onClose, selectedJobs, onSubmit, isSubmitting }: InvoiceFormModalProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: 'invoice',
      issued_date: new Date().toISOString().split('T')[0] ?? '',
      due_date: '',
      tax_rate: 0,
    },
  })

  const invoiceType = watch('type')
  const taxRate = watch('tax_rate')

  const grossTotal = selectedJobs.reduce((sum, job) => {
    return sum + job.amount_card + (job.include_cash_in_invoice ? job.amount_cash : 0)
  }, 0)
  const taxAmount = grossTotal * (taxRate / 100)
  const netAmount = grossTotal - taxAmount

  return (
    <SlideOver open={open} onClose={onClose} title="Nuova Fattura">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <FormSection title="Tipo Documento">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Tipo documento</label>
            <div className="grid grid-cols-2 gap-2">
              {(['invoice', 'parcella'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('type', t)}
                  className={`rounded-full border py-3 text-sm font-medium transition-all ${
                    invoiceType === t
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border bg-surface text-text-secondary'
                  }`}
                >
                  {t === 'invoice' ? 'Fattura' : 'Parcella'}
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection title="Lavori e Tempistiche">
          <div className="rounded-card bg-surface border border-border p-4 space-y-2">
            <p className="text-sm font-medium">Lavori selezionati ({selectedJobs.length})</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedJobs.map((job) => (
                <div key={job.id} className="flex justify-between text-sm">
                  <span className="text-text-secondary truncate">{job.title}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatCurrency(job.amount_card + (job.include_cash_in_invoice ? job.amount_cash : 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Input
              label="Data emissione *"
              type="date"
              error={errors.issued_date?.message}
              {...register('issued_date')}
            />
            <Input
              label="Data scadenza"
              type="date"
              {...register('due_date')}
            />
          </div>
        </FormSection>

        <FormSection title="Riepilogo Fiscale">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Aliquota IVA (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('tax_rate', { valueAsNumber: true })}
              className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand transition-all"
            />
          </div>

          <div className="rounded-card bg-brand/5 border border-brand/20 p-4 space-y-1 mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Imponibile</span>
              <span className="font-mono font-semibold tabular-nums">{formatCurrency(grossTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">IVA ({taxRate}%)</span>
              <span className="font-mono font-semibold tabular-nums">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-1 mt-1">
              <span>Totale</span>
              <span className="font-mono tabular-nums">{formatCurrency(netAmount)}</span>
            </div>
          </div>
        </FormSection>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" type="button" onClick={onClose} className="rounded-full">Annulla</Button>
          <Button disabled={isSubmitting || selectedJobs.length === 0} className="rounded-full">
            {isSubmitting ? 'Creazione...' : `Crea ${invoiceType === 'invoice' ? 'fattura' : 'parcella'}`}
          </Button>
        </div>
      </form>
    </SlideOver>
  )
}

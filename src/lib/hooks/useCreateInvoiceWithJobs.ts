import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { executeWithSync } from '../syncExecute'
import { OfflineQueuedError } from '../syncBridge'
import type { Invoice, Job } from '../../types/database'

async function generateInvoiceNumber(type: 'invoice' | 'parcella'): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = type === 'invoice' ? 'FT' : 'PA'
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}-${year}-%`)
  const seq = String((count ?? 0) + 1).padStart(4, '0')
  const check = Math.random().toString(36).slice(2, 3).toUpperCase()
  return `${prefix}-${year}-${seq}${check}`
}

export interface CreateInvoiceInput {
  jobs: Job[]
  type: 'invoice' | 'parcella'
  issued_date: string
  due_date?: string
  tax_rate: number
}

export function useCreateInvoiceWithJobs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const { jobs, type, issued_date, due_date, tax_rate } = input
      const grossAmount = jobs.reduce(
        (sum, j) => sum + j.amount_card + (j.include_cash_in_invoice ? j.amount_cash : 0),
        0,
      )
      const taxAmount = grossAmount * (tax_rate / 100)
      const netAmount = grossAmount - taxAmount
      const invoiceNumber = await generateInvoiceNumber(type)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const payload = {
        user_id: session.user.id,
        invoice_number: invoiceNumber,
        type,
        gross_amount: grossAmount,
        tax_amount: taxAmount,
        net_amount: netAmount,
        status: 'draft' as const,
        issued_date,
        due_date: due_date || null,
        paid_date: null,
        pdf_url: null,
        __job_ids: jobs.map((j) => j.id),
      }

      return executeWithSync(
        { table: 'invoices', operation: 'insert', payload },
        async () => {
          const { __job_ids, ...invoiceRow } = payload
          const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .insert(invoiceRow)
            .select()
            .single()
          if (invError || !invoice) throw invError ?? new Error('Failed to create invoice')

          const { error: linkError } = await supabase
            .from('invoice_jobs')
            .insert(__job_ids.map((job_id) => ({ invoice_id: invoice.id, job_id })))
          if (linkError) throw linkError

          return { invoice: invoice as unknown as Invoice, invoiceNumber }
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
      }
    },
  })
}

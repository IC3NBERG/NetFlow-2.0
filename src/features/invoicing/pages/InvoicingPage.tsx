import { useState, useCallback, useEffect } from 'react'
import { useJobs } from '../../../lib/hooks/useJobs'
import { useInvoices, useUpdateInvoice } from '../../../lib/hooks/useInvoices'
import { useCreateInvoiceWithJobs } from '../../../lib/hooks/useCreateInvoiceWithJobs'
import { useClients } from '../../../lib/hooks/useClients'
import { Button } from '../../../shared/ui/Button'
import { Toast } from '../../../shared/ui/Toast'
import { Plus } from 'lucide-react'
import { PendingJobsList } from '../components/PendingJobsList'
import { InvoiceFormModal } from '../components/InvoiceFormModal'
import { InvoiceList } from '../components/InvoiceList'
import { supabase } from '../../../lib/supabase'
import { isOfflineQueued, isOfflineSyncDisabled } from '../../../lib/syncExecute'
import type { InvoiceJob, Job } from '../../../types/database'

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null

export function InvoicingPage() {
  const { data: jobs = [] } = useJobs()
  const { data: invoices = [] } = useInvoices()
  const { data: clients = [] } = useClients()
  const updateInvoice = useUpdateInvoice()
  const createInvoiceWithJobs = useCreateInvoiceWithJobs()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [invoiceJobs, setInvoiceJobs] = useState<InvoiceJob[]>([])

  useEffect(() => {
    supabase.from('invoice_jobs').select('*').then(({ data, error }) => {
      if (!error && data) setInvoiceJobs(data)
    })
  }, [invoices])

  const pendingJobs = jobs.filter((j) => j.status === 'completed_pending')
  const selectedJobs = jobs.filter((j) => selectedIds.has(j.id))

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === pendingJobs.length ? new Set() : new Set(pendingJobs.map((j) => j.id)),
    )
  }, [pendingJobs])

  async function handleCreateInvoice(data: { type: 'invoice' | 'parcella'; issued_date: string; due_date?: string; tax_rate: number }) {
    if (selectedJobs.length === 0) return
    try {
      const result = await createInvoiceWithJobs.mutateAsync({
        jobs: selectedJobs,
        type: data.type,
        issued_date: data.issued_date,
        due_date: data.due_date,
        tax_rate: data.tax_rate,
      })
      setSelectedIds(new Set())
      setIsFormOpen(false)
      const label = data.type === 'invoice' ? 'Fattura' : 'Parcella'
      const number = result && typeof result === 'object' && 'invoiceNumber' in result
        ? result.invoiceNumber
        : null
      setToast({
        message: number ? `${label} ${number} creata` : `${label} in coda per sincronizzazione offline`,
        type: number ? 'success' : 'info',
      })
    } catch (err) {
      if (isOfflineQueued(err)) {
        setSelectedIds(new Set())
        setIsFormOpen(false)
        setToast({ message: 'Fattura in coda — verrà sincronizzata al ritorno online', type: 'info' })
      } else if (isOfflineSyncDisabled(err)) {
        setToast({ message: 'Sei offline e la sincronizzazione è disattivata', type: 'error' })
      } else {
        setToast({ message: 'Errore durante la creazione', type: 'error' })
      }
    }
  }

  async function handleMarkAsPaid(invoiceId: string) {
    try {
      await updateInvoice.mutateAsync({
        id: invoiceId,
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0] ?? '',
      })
      setToast({ message: 'Documento segnato come pagato', type: 'success' })
    } catch (err) {
      if (isOfflineQueued(err)) {
        setToast({ message: 'Aggiornamento in coda — sincronizzazione al ritorno online', type: 'info' })
      } else {
        setToast({ message: 'Errore durante l\'aggiornamento', type: 'error' })
      }
    }
  }

  async function handleMarkAsSent(invoiceId: string) {
    try {
      await updateInvoice.mutateAsync({ id: invoiceId, status: 'sent' })
      setToast({ message: 'Documento segnato come inviato', type: 'success' })
    } catch (err) {
      if (isOfflineQueued(err)) {
        setToast({ message: 'Aggiornamento in coda — sincronizzazione al ritorno online', type: 'info' })
      } else {
        setToast({ message: 'Errore durante l\'aggiornamento', type: 'error' })
      }
    }
  }

  const relatedJobs = useCallback((invoiceId: string): Job[] => {
    const jobIds = invoiceJobs
      .filter((ij) => ij.invoice_id === invoiceId)
      .map((ij) => ij.job_id)
    return jobs.filter((j) => jobIds.includes(j.id))
  }, [invoiceJobs, jobs])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Fatturazione</h2>
          <p className="text-xs md:text-sm text-text-secondary">Lavori conclusi in attesa di incasso</p>
        </div>
        {!isFormOpen && selectedJobs.length > 0 && (
          <Button onClick={() => setIsFormOpen(true)} className="text-xs md:text-sm px-3 md:px-4">
            <Plus className="mr-1 md:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Crea fattura ({selectedJobs.length})</span>
            <span className="sm:hidden">Fattura ({selectedJobs.length})</span>
          </Button>
        )}
      </div>

      <PendingJobsList
        jobs={pendingJobs}
        clients={clients}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onSelectAll={handleSelectAll}
      />

      <InvoiceList
        invoices={invoices}
        onMarkAsPaid={handleMarkAsPaid}
        onMarkAsSent={handleMarkAsSent}
        relatedJobs={relatedJobs}
      />

      <InvoiceFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        selectedJobs={selectedJobs}
        onSubmit={handleCreateInvoice}
        isSubmitting={createInvoiceWithJobs.isPending}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

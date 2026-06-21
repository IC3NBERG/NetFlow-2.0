import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob } from '../../../lib/hooks/useJobs'
import { useJobsUIStore } from '../../../lib/stores/jobsUI'
import { JobCard } from '../components/JobCard'
import { JobFormModal, type JobFormData } from '../components/JobFormModal'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Toast } from '../../../shared/ui/Toast'
import { QueryLoading, QueryError } from '../../../shared/ui/QueryState'
import { isOfflineQueued, isOfflineSyncDisabled } from '../../../lib/syncExecute'
import { cn } from '../../../lib/utils'
import type { Job } from '../../../types/database'
import { motion } from 'framer-motion'

const tabs = [
  { id: 'general' as const, label: 'Generali' },
  { id: 'card' as const, label: 'Carta' },
  { id: 'cash' as const, label: 'Cash' },
  { id: 'mixed' as const, label: 'Misti' },
]

const filters = [
  { id: 'all' as const, label: 'Tutti' },
  { id: 'active' as const, label: 'In corso' },
  { id: 'completed_pending' as const, label: 'Da incassare' },
  { id: 'completed_settled' as const, label: 'Incassati' },
]

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null

export function JobsPage() {
  const { data: jobs = [], isLoading, isError, error, refetch } = useJobs()
  const createJob = useCreateJob()
  const updateJob = useUpdateJob()
  const deleteJob = useDeleteJob()
  const { activeTab, activeFilter, isFormOpen, editingJobId, setActiveTab, setActiveFilter, openForm, closeForm } = useJobsUIStore()
  const [toast, setToast] = useState<ToastState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filtered = jobs.filter((j) => {
    if (activeFilter !== 'all' && j.status !== activeFilter) return false
    if (activeTab === 'card' && j.payment_method !== 'card') return false
    if (activeTab === 'cash' && j.payment_method !== 'cash') return false
    if (activeTab === 'mixed' && j.payment_method !== 'mixed') return false
    return true
  })

  const editingJob = editingJobId ? jobs.find((j) => j.id === editingJobId) ?? null : null

  async function handleSubmit(data: JobFormData) {
    setIsSubmitting(true)
    const payload = { ...data, description: data.description || null, pending_date: data.pending_date || null, end_date: data.end_date || null, client_id: data.client_id || null }
    try {
      if (editingJob) {
        await updateJob.mutateAsync({ id: editingJob.id, ...payload })
        setToast({ message: 'Lavoro aggiornato', type: 'success' })
      } else {
        const status = payload.end_date ? 'completed_settled' as const
          : payload.pending_date ? 'completed_pending' as const
          : 'active' as const
        await createJob.mutateAsync({ ...payload, status })
        setToast({ message: 'Lavoro creato', type: 'success' })
      }
      closeForm()
    } catch (err) {
      if (isOfflineQueued(err)) {
        setToast({ message: 'Salvato offline — verrà sincronizzato al ritorno della connessione', type: 'info' })
        closeForm()
      } else if (isOfflineSyncDisabled(err)) {
        setToast({ message: 'Sei offline e la sincronizzazione è disattivata nelle impostazioni', type: 'error' })
      } else {
        setToast({ message: 'Errore durante il salvataggio', type: 'error' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStatusChange(id: string, status: Job['status']) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const extra: Partial<Job> = {}
      if (status === 'completed_pending') extra.pending_date = today
      if (status === 'completed_settled') extra.end_date = today
      await updateJob.mutateAsync({ id, status, ...extra })
      setToast({
        message: status === 'completed_pending' ? 'Lavoro concluso, da incassare' : 'Lavoro incassato',
        type: 'success',
      })
    } catch (err) {
      if (isOfflineQueued(err)) {
        setToast({ message: 'Aggiornamento in coda — sincronizzazione al ritorno online', type: 'info' })
      } else if (isOfflineSyncDisabled(err)) {
        setToast({ message: 'Sei offline e la sincronizzazione è disattivata nelle impostazioni', type: 'error' })
      } else {
        setToast({ message: 'Errore durante l\'aggiornamento', type: 'error' })
      }
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteJob.mutateAsync(id)
      setToast({ message: 'Lavoro eliminato', type: 'success' })
    } catch (err) {
      if (isOfflineQueued(err)) {
        setToast({ message: 'Eliminazione in coda — sincronizzazione al ritorno online', type: 'info' })
      } else if (isOfflineSyncDisabled(err)) {
        setToast({ message: 'Sei offline e la sincronizzazione è disattivata nelle impostazioni', type: 'error' })
      } else {
        setToast({ message: 'Errore durante l\'eliminazione', type: 'error' })
      }
    }
  }

  if (isLoading) return <QueryLoading message="Caricamento lavori..." />
  if (isError) return <QueryError message={error?.message} onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Lavori</h2>
          <p className="text-xs md:text-sm text-text-secondary">Gestisci i tuoi lavori e progetti</p>
        </div>
        <Button onClick={() => openForm()} className="text-xs md:text-sm px-3 md:px-4">
          <Plus className="mr-1 md:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Nuovo Lavoro</span>
          <span className="sm:hidden">Nuovo</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-full bg-surface p-1 border border-border w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all shrink-0',
                activeTab === tab.id
                  ? 'bg-brand text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-text-secondary">Caricamento...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nessun lavoro trovato"
          description={
            activeFilter !== 'all'
              ? 'Nessun lavoro corrisponde al filtro selezionato.'
              : 'Crea il tuo primo lavoro per iniziare a tracciare i tuoi progetti.'
          }
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={(j) => openForm(j.id)}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </motion.div>
      )}

      <JobFormModal
        open={isFormOpen}
        onClose={closeForm}
        onSubmit={handleSubmit}
        initialData={editingJob}
        isSubmitting={isSubmitting}
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

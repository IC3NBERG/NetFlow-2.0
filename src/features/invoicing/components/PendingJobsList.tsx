import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { formatCurrency } from '../../../lib/calculations'
import { Checkbox } from '../../../shared/ui/Checkbox'
import type { Job, Client } from '../../../types/database'

interface PendingJobsListProps {
  jobs: Job[]
  clients: Client[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectAll: () => void
}

export function PendingJobsList({ jobs, clients, selectedIds, onToggle, onSelectAll }: PendingJobsListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{jobs.length} lavori in attesa</p>
        {jobs.length > 0 && (
          <button onClick={onSelectAll} className="text-sm text-brand hover:underline">
            {selectedIds.size === jobs.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
          </button>
        )}
      </div>
      {jobs.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-text-secondary">Nessun lavoro in attesa di incasso</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:gap-3 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const client = clients.find((c) => c.id === job.client_id)
            const total = job.amount_card + (job.include_cash_in_invoice ? job.amount_cash : 0)
            return (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard
                  className={`p-3 md:p-4 cursor-pointer transition-all ${
                    selectedIds.has(job.id) ? 'ring-2 ring-brand' : ''
                  }`}
                  onClick={() => onToggle(job.id)}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <Checkbox
                      checked={selectedIds.has(job.id)}
                      onCheckedChange={() => onToggle(job.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base truncate">{job.title}</p>
                      {client && <p className="text-[10px] md:text-xs text-text-secondary truncate">{client.name}</p>}
                      <div className="flex items-center justify-between mt-1.5 md:mt-2 gap-2">
                        <span className="text-sm md:text-lg font-bold font-mono tracking-tight">
                          <span className="font-mono tabular-nums">{formatCurrency(total)}</span>
                        </span>
                        <span className="text-[10px] md:text-xs text-text-secondary shrink-0">
                          {job.payment_method === 'mixed' && 'Misto · '}
                          {job.amount_cash > 0 && !job.include_cash_in_invoice && 'Cash no fatt.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

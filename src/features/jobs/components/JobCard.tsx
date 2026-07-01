import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Edit3, Trash2, CreditCard, Banknote, ArrowRightCircle, CheckCircle, FileText, Check } from 'lucide-react'
import { cn, formatDate } from '../../../lib/utils'
import { formatCurrency } from '../../../lib/calculations'
import type { Job } from '../../../types/database'

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'In corso', color: 'bg-brand/20 text-brand' },
  completed_pending: { label: 'Da incassare', color: 'bg-pending/20 text-pending' },
  completed_settled: { label: 'Incassato', color: 'bg-success/20 text-success' },
}

const paymentIcons = {
  card: CreditCard,
  cash: Banknote,
  mixed: Banknote,
}

interface JobCardProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: Job['status']) => void
}

export function JobCard({ job, onEdit, onDelete, onStatusChange }: JobCardProps) {
  const navigate = useNavigate()
  const status = statusLabels[job.status] ?? { label: 'Sconosciuto', color: 'bg-pending/20 text-pending' }
  const PaymentIcon = paymentIcons[job.payment_method]

  function nextStatus(): { status: Job['status']; label: string; icon: typeof ArrowRightCircle } | null {
    if (job.status === 'active') return { status: 'completed_pending', label: 'Concludi', icon: ArrowRightCircle }
    if (job.status === 'completed_pending') return { status: 'completed_settled', label: 'Incassa', icon: CheckCircle }
    return null
  }

  const next = nextStatus()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <GlassCard className="flex flex-col justify-between h-full p-4 md:p-5 space-y-4">
        {/* Top Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] md:text-xs font-semibold tracking-wide uppercase', status.color)}>
                {status.label}
              </span>
              <div className="flex items-center gap-1 text-text-secondary">
                <PaymentIcon className="h-3.5 w-3.5" />
                <span className="text-[10px] md:text-xs font-medium capitalize">
                  {job.payment_method === 'card' ? 'Carta' : job.payment_method === 'cash' ? 'Contanti' : 'Misto'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(job)} className="h-8 w-8 text-text-secondary hover:text-text-primary">
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(job.id)} className="h-8 w-8 text-text-secondary hover:text-expense">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base md:text-lg line-clamp-1">{job.title}</h3>
            <p className="text-xs text-text-secondary line-clamp-2 mt-1 min-h-[2rem]">
              {job.description || <span className="italic opacity-60">Nessuna descrizione fornita</span>}
            </p>
          </div>
        </div>

        {/* Financial & Timeframe Info */}
        <div className="grid grid-cols-2 gap-4 border-t border-b border-border/50 py-3 my-1">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">Importo</p>
              <p className="text-lg md:text-xl font-bold font-mono tabular-nums tracking-tight mt-0.5">
                {formatCurrency(job.amount_card + (job.include_cash_in_invoice ? job.amount_cash : 0))}
              </p>
            </div>
            <div className="flex flex-col gap-0.5 text-[10px] text-text-secondary font-mono mt-1">
              {job.amount_card > 0 && (
                <span className="flex items-center gap-1">
                  <CreditCard className="h-2.5 w-2.5" />
                  {formatCurrency(job.amount_card)}
                </span>
              )}
              {job.amount_cash > 0 && (
                <span className="flex items-center gap-1">
                  <Banknote className="h-2.5 w-2.5" />
                  {formatCurrency(job.amount_cash)}
                  {!job.include_cash_in_invoice && <span className="text-expense text-[9px] font-semibold">(No fatt.)</span>}
                </span>
              )}
            </div>
          </div>

          <div className="text-right text-[11px] text-text-secondary space-y-1 self-center">
            <div className="flex justify-between md:justify-end gap-1.5">
              <span className="opacity-75">Inizio:</span>
              <span className="font-medium text-text-primary">{formatDate(job.start_date)}</span>
            </div>
            <div className="flex justify-between md:justify-end gap-1.5">
              <span className="opacity-75">Attesa:</span>
              <span className="font-medium text-text-primary">{job.pending_date ? formatDate(job.pending_date) : '—'}</span>
            </div>
            <div className="flex justify-between md:justify-end gap-1.5">
              <span className="opacity-75">Fine:</span>
              <span className="font-medium text-text-primary">{job.end_date ? formatDate(job.end_date) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 min-h-[2.25rem]">
          <div className="text-[10px] text-text-secondary">
            {job.payment_method !== 'card' && (
              <p>Cash in fattura: <span className="font-semibold text-text-primary">{job.include_cash_in_invoice ? 'Sì' : 'No'}</span></p>
            )}
          </div>
          <div className="flex gap-2">
            {next && (
              <Button
                size="sm"
                onClick={() => onStatusChange(job.id, next.status)}
                className="text-xs px-3 h-8 shadow-sm"
              >
                <next.icon className="mr-1 h-3.5 w-3.5" />
                <span>{next.label}</span>
              </Button>
            )}

            {job.status === 'completed_pending' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/invoicing?job=${job.id}`)}
                className="text-xs px-3 h-8 border border-border/60 hover:bg-surface-alt"
              >
                <FileText className="mr-1 h-3.5 w-3.5 text-brand" />
                <span>Fattura</span>
              </Button>
            )}

            {job.status === 'completed_settled' && (
              <div className="flex items-center gap-1.5 text-success bg-success/10 px-3 py-1.5 rounded-full text-xs font-semibold">
                <Check className="h-3.5 w-3.5" />
                <span>Completato</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}


import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Edit3, Trash2, ChevronDown, ChevronUp, CreditCard, Banknote, ArrowRightCircle, CheckCircle, FileText } from 'lucide-react'
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
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const status = statusLabels[job.status] ?? { label: 'Sconosciuto', color: 'bg-pending/20 text-pending' }
  const PaymentIcon = paymentIcons[job.payment_method]

  function nextStatus(): { status: Job['status']; label: string; icon: typeof ArrowRightCircle } | null {
    if (job.status === 'active') return { status: 'completed_pending', label: 'Concludi e passa a da incassare', icon: ArrowRightCircle }
    if (job.status === 'completed_pending') return { status: 'completed_settled', label: 'Segna come incassato', icon: CheckCircle }
    return null
  }

  const next = nextStatus()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="space-y-3 md:space-y-4 p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1.5 md:space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-medium', status.color)}>
                {status.label}
              </span>
              <PaymentIcon className="h-3.5 md:h-4 w-3.5 md:w-4 text-text-secondary" />
              {job.payment_method === 'mixed' && (
                <span className="text-[10px] md:text-xs text-text-secondary">Misto</span>
              )}
            </div>
            <h3 className="font-semibold text-base md:text-lg">{job.title}</h3>
            {job.description && !expanded && (
              <p className="text-xs md:text-sm text-text-secondary line-clamp-2">{job.description}</p>
            )}
          </div>
          <div className="flex items-center gap-0.5 md:gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(job)} className="h-8 w-8 md:h-9 md:w-9">
              <Edit3 className="h-3.5 md:h-4 w-3.5 md:w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(job.id)} className="h-8 w-8 md:h-9 md:w-9">
              <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} className="h-8 w-8 md:h-9 md:w-9">
              {expanded ? <ChevronUp className="h-3.5 md:h-4 w-3.5 md:w-4" /> : <ChevronDown className="h-3.5 md:h-4 w-3.5 md:w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
          <div className="space-y-1">
            <p className="text-lg md:text-xl lg:text-2xl font-bold font-mono tabular-nums tracking-tight">{formatCurrency(job.amount_card + (job.include_cash_in_invoice ? job.amount_cash : 0))}</p>
            <div className="flex gap-2 md:gap-3 text-[10px] md:text-xs text-text-secondary">
              {job.amount_card > 0 && (
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {formatCurrency(job.amount_card)}
                </span>
              )}
              {job.amount_cash > 0 && (
                <span className="flex items-center gap-1">
                  <Banknote className="h-3 w-3" />
                  {formatCurrency(job.amount_cash)}
                  {!job.include_cash_in_invoice && <span className="text-pending">(no fatt.)</span>}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-[10px] md:text-xs text-text-secondary">
            <p>Inizio: {formatDate(job.start_date)}</p>
            {job.pending_date && <p className="hidden sm:block">Attesa: {formatDate(job.pending_date)}</p>}
            {job.end_date && <p className="hidden sm:block">Fine: {formatDate(job.end_date)}</p>}
          </div>
        </div>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 border-t border-border pt-3 md:pt-4"
          >
            {job.description && (
              <div>
                <p className="text-xs text-text-secondary mb-1">Descrizione</p>
                <p className="text-xs md:text-sm">{job.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <p className="text-[10px] md:text-xs text-text-secondary">Metodo pagamento</p>
                <p className="capitalize">{job.payment_method === 'card' ? 'Carta' : job.payment_method === 'cash' ? 'Contanti' : 'Misto'}</p>
              </div>
              {job.payment_method !== 'card' && (
                <div>
                  <p className="text-[10px] md:text-xs text-text-secondary">Cash in fattura</p>
                  <p>{job.include_cash_in_invoice ? 'Sì' : 'No'}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              {next && (
                <Button
                  size="sm"
                  onClick={() => onStatusChange(job.id, next.status)}
                  className="text-xs"
                >
                  <next.icon className="mr-1 h-3.5 md:h-4 w-3.5 md:w-4" />
                  <span className="hidden sm:inline">{next.label}</span>
                  <span className="sm:hidden">{next.label === 'Concludi e passa a da incassare' ? 'Concludi' : 'Incassa'}</span>
                </Button>
              )}
              {job.status === 'completed_pending' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/invoicing?job=${job.id}`)}
                  className="text-xs"
                >
                  <FileText className="mr-1 h-3.5 md:h-4 w-3.5 md:w-4" />
                  <span className="hidden sm:inline">Fatturalo</span>
                  <span className="sm:hidden">Fattura</span>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { formatCurrency } from '../../../lib/calculations'
import type { LedgerMetrics } from '../../../lib/hooks/useLedgerData'

interface LedgerStatsProps {
  metrics: LedgerMetrics
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemAnim = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
}

const cards = [
  { key: 'totalJobs', label: 'Lavori incassati', color: 'text-brand' },
  { key: 'grossTotal', label: 'Totale lordo', color: 'text-[#00D2FF]' },
  { key: 'cardTotal', label: 'di cui carta', color: 'text-brand' },
  { key: 'cashTotal', label: 'di cui contanti', color: 'text-[#00B894]' },
  { key: 'avgPerJob', label: 'Media per lavoro', color: 'text-text-primary' },
] as const

export function LedgerStats({ metrics }: LedgerStatsProps) {
  return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-4"
      >
        {cards.map(({ key, label, color }) => (
          <motion.div key={key} variants={itemAnim}>
            <GlassCard hover={false} className="p-2.5 md:p-4">
              <p className="text-[10px] md:text-xs text-text-secondary mb-0.5 md:mb-1">{label}</p>
              <p className={`text-sm md:text-lg font-bold font-mono ${color}`}>
              {key === 'totalJobs'
                ? metrics.totalJobs
                : formatCurrency(metrics[key as keyof LedgerMetrics] as number)}
            </p>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}

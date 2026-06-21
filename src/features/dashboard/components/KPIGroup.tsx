import { GlassCard } from '../../../shared/ui/GlassCard'
import { formatCurrency } from '../../../lib/calculations'

interface KPI {
  label: string
  value: number
  color: string
}

interface KPIGroupProps {
  metrics: KPI[]
}

export function KPIGroup({ metrics }: KPIGroupProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric) => (
        <GlassCard key={metric.label} className="p-3 md:p-4 lg:p-5">
          <p className="text-xs md:text-sm text-text-secondary mb-1">{metric.label}</p>
          <p className={`text-lg md:text-xl lg:text-2xl font-bold font-mono tabular-nums tracking-tight ${metric.color}`}>
            {formatCurrency(metric.value)}
          </p>
        </GlassCard>
      ))}
    </div>
  )
}

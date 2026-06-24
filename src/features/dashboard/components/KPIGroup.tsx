import { GlassCard } from '../../../shared/ui/GlassCard'
import { formatCurrency } from '../../../lib/calculations'

interface KPI {
  label: string
  value: number
  color: string
}

interface KPIItemProps {
  label: string
  value: number
  color: string
}

function KPIItem({ label, value, color }: KPIItemProps) {
  return (
    <GlassCard className="p-3 md:p-4 lg:p-5">
      <p className="text-xs md:text-sm text-text-secondary mb-1">{label}</p>
      <p className={`text-lg md:text-xl lg:text-2xl font-bold font-mono tabular-nums tracking-tight ${color}`}>
        {formatCurrency(value)}
      </p>
    </GlassCard>
  )
}

interface KPIGroupProps {
  metrics: KPI[]
}

export function KPIGroup({ metrics }: KPIGroupProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="flex flex-col gap-4">
        <KPIItem label={metrics[0]!.label} value={metrics[0]!.value} color={metrics[0]!.color} />
        <KPIItem label={metrics[1]!.label} value={metrics[1]!.value} color={metrics[1]!.color} />
      </div>
      <div className="flex flex-col gap-4">
        <KPIItem label={metrics[2]!.label} value={metrics[2]!.value} color={metrics[2]!.color} />
        <KPIItem label={metrics[3]!.label} value={metrics[3]!.value} color={metrics[3]!.color} />
      </div>
      <div className="flex flex-col gap-4">
        <KPIItem label={metrics[4]!.label} value={metrics[4]!.value} color={metrics[4]!.color} />
        <KPIItem label={metrics[5]!.label} value={metrics[5]!.value} color={metrics[5]!.color} />
      </div>
      <div className="flex flex-col gap-4">
        <KPIItem label={metrics[6]!.label} value={metrics[6]!.value} color={metrics[6]!.color} />
        <KPIItem label={metrics[7]!.label} value={metrics[7]!.value} color={metrics[7]!.color} />
      </div>
    </div>
  )
}

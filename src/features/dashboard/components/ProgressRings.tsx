import { useState } from 'react'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Briefcase, Clock, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '../../../lib/calculations'
import type { MoneyMetrics } from '../../../types/metrics'
import type { GoalMetric } from '../../../types/database'

type MetricView = 'all' | 'gross' | 'net' | 'cash'

interface ProgressRingsProps {
  workloadPercent: number
  workloadActive?: number
  workloadPending?: number
  workloadSettled?: number
  segments: Array<{
    label: string
    value: number
    color: string
  }>
  goalMetric: GoalMetric
  goalCurrent: number
  goalTarget: number
  metrics?: MoneyMetrics
}

const metricViews: { key: MetricView; label: string }[] = [
  { key: 'all', label: 'Tutto' },
  { key: 'gross', label: 'Lordo' },
  { key: 'net', label: 'Netto' },
  { key: 'cash', label: 'Cash' },
]

function getGoalMetricCurrent(metrics: MoneyMetrics, goalMetric: GoalMetric): number {
  switch (goalMetric) {
    case 'gross_settled':
      return metrics.gross_settled
    case 'gross_total':
      return metrics.gross_settled + metrics.gross_pending
    case 'cash_only':
      return metrics.cash_settled
    case 'net_settled':
      return metrics.net_settled
    case 'net_pending':
      return metrics.net_pending
    default:
      return metrics.gross_settled + metrics.gross_pending
  }
}

function getViewGoalCurrent(metrics: MoneyMetrics, view: MetricView): number {
  switch (view) {
    case 'net':
      return metrics.net_settled + metrics.net_pending
    case 'cash':
      return metrics.cash_settled + metrics.cash_pending
    case 'gross':
      return metrics.gross_settled + metrics.gross_pending
    case 'all':
      return metrics.gross_settled + metrics.gross_pending
  }
}

export function ProgressRings({
  workloadPercent,
  workloadActive = 0,
  workloadPending = 0,
  workloadSettled = 0,
  segments,
  goalMetric,
  goalCurrent,
  goalTarget,
  metrics,
}: ProgressRingsProps) {
  const [metricView, setMetricView] = useState<MetricView>('all')

  const workloadClamped = Math.min(workloadPercent, 100)
  const goalMetricCurrent = metrics ? getGoalMetricCurrent(metrics, goalMetric) : goalCurrent
  const viewGoalCurrent = metrics ? getViewGoalCurrent(metrics, metricView) : goalCurrent
  const progress = goalTarget > 0 ? Math.min(goalMetricCurrent / goalTarget, 1) : 0
  const goalPercent = goalTarget > 0 ? Math.round(progress * 100) : 0
  const filteredSegments = metricView === 'all'
    ? segments
    : segments.filter((seg) => {
        if (metricView === 'net') return seg.label === 'Netto'
        if (metricView === 'gross') return seg.label === 'Lordo'
        if (metricView === 'cash') return seg.label === 'Cash'
        return true
      })

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Stato Attivita</h3>
        <span className="text-sm font-bold font-mono text-brand">{goalPercent}%</span>
      </div>

      <div className="flex gap-3 items-center pb-3 border-b border-border">
        <RingSVG percent={workloadClamped} size={56} strokeWidth={5} color="#00D2FF" />
        <div className="flex-1 grid grid-cols-3 gap-1.5">
          <StatusItem icon={<Briefcase className="h-3 w-3 text-[#00D2FF]" />} label="Attivi" value={workloadActive} />
          <StatusItem icon={<Clock className="h-3 w-3 text-pending" />} label="In attesa" value={workloadPending} />
          <StatusItem icon={<CheckCircle2 className="h-3 w-3 text-success" />} label="Incassati" value={workloadSettled} />
        </div>
      </div>

      <div className="flex-1 flex flex-col pt-2.5 min-h-0">
        <div className="flex gap-1 mb-2.5">
          {metricViews.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setMetricView(v.key)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                metricView === v.key
                  ? 'bg-brand text-white'
                  : 'bg-surface text-text-secondary hover:bg-brand/10 hover:text-brand'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center">
          {metricView === 'all' ? (
            <div className="flex gap-4 justify-center">
              {filteredSegments.map((seg) => {
                const segPercent = goalTarget > 0 ? Math.min((seg.value / goalTarget) * 100, 100) : 0
                return (
                  <div key={seg.label} className="flex flex-col items-center gap-1">
                    <RingSVG percent={segPercent} size={48} strokeWidth={4} color={seg.color} />
                    <span className="text-[10px] font-medium text-text-secondary">{seg.label}</span>
                    <span className="text-[11px] font-bold font-mono">{Math.round(segPercent)}%</span>
                  </div>
                )
              })}
            </div>
          ) : (
            filteredSegments.map((seg) => {
              const segPercent = goalTarget > 0 ? Math.min((seg.value / goalTarget) * 100, 100) : 0
              return (
                <div key={seg.label} className="flex flex-col items-center gap-1.5">
                  <RingSVG percent={segPercent} size={64} strokeWidth={6} color={seg.color} />
                  <span className="text-xs font-medium">{seg.label}</span>
                  <p className="text-[10px] text-text-secondary text-center leading-tight">
                    {formatCurrency(viewGoalCurrent)} / {formatCurrency(goalTarget)}
                  </p>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-2 mt-auto">
          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, #6C5CE7, #00D2FF)' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-secondary mt-1">
            <span>{formatCurrency(goalMetricCurrent)}</span>
            <span>{formatCurrency(goalTarget)}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

function StatusItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-surface/40 py-2 px-1">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] text-text-secondary">{label}</span>
      </div>
      <span className="text-base font-bold font-mono">{value}</span>
    </div>
  )
}

function RingSVG({ percent, size, strokeWidth, color }: { percent: number; size: number; strokeWidth: number; color: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold font-mono tracking-tight" style={{ color, fontSize: size * 0.26 }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  )
}

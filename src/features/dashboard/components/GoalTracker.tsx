import { useState } from 'react'
import { RadialProgress } from '../../../shared/ui/RadialProgress'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { formatCurrency } from '../../../lib/calculations'
import type { MoneyMetrics } from '../../../types/metrics'
import type { GoalMetric } from '../../../types/database'

type MetricView = 'all' | 'gross' | 'net' | 'cash'

interface GoalTrackerProps {
  target: number
  current: number
  metricLabel: string
  goalMetric: GoalMetric
  segments: Array<{
    label: string
    value: number
    color: string
  }>
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

function getViewCurrent(metrics: MoneyMetrics, view: MetricView, grossCurrent: number): number {
  switch (view) {
    case 'net':
      return metrics.net_settled + metrics.net_pending
    case 'cash':
      return metrics.cash_settled + metrics.cash_pending
    case 'gross':
      return grossCurrent
    case 'all':
      return grossCurrent
  }
}

export function GoalTracker({ target, current, metricLabel, goalMetric, segments, metrics }: GoalTrackerProps) {
  const [metricView, setMetricView] = useState<MetricView>('all')

  const grossCurrent = metrics ? metrics.gross_pending + metrics.gross_settled : current
  const goalMetricCurrent = metrics ? getGoalMetricCurrent(metrics, goalMetric) : current

  const displayCurrent = metrics ? getViewCurrent(metrics, metricView, grossCurrent) : current
  const progress = target > 0 ? Math.min(goalMetricCurrent / target, 1) : 0

  const goalPercent = target > 0 ? Math.round(progress * 100) : 0

  const filteredSegments = metricView === 'all'
    ? segments
    : segments.filter((seg) => {
        if (metricView === 'net') return seg.label === 'Netto'
        if (metricView === 'gross') return seg.label === 'Lordo'
        if (metricView === 'cash') return seg.label === 'Cash'
        return true
      })

  return (
    <GlassCard className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Obiettivo {metricLabel}</h3>
      </div>

      <div className="flex gap-1 mb-4">
        {metricViews.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setMetricView(v.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              metricView === v.key
                ? 'bg-brand text-white'
                : 'bg-surface text-text-secondary hover:bg-brand/10 hover:text-brand'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mb-4 md:mb-5">
        <div className="mt-1 flex items-baseline gap-1 md:gap-2 flex-wrap">
          <span className="text-xl md:text-3xl font-bold font-mono tracking-tight text-brand">
            {formatCurrency(displayCurrent)}
          </span>
          <span className="text-[11px] md:text-sm text-text-secondary">
            di {formatCurrency(target)} ({goalPercent}%)
          </span>
        </div>
      </div>

      <div className="min-h-[100px] md:h-[140px] mb-4 md:mb-5">
        {metricView === 'all' ? (
          <div className="grid grid-cols-3 gap-2 md:gap-3 h-full">
            {filteredSegments.map((seg) => {
              const segPercent = target > 0 ? Math.min((seg.value / target) * 100, 100) : 0
              return (
                <div key={seg.label} className="flex flex-col items-center justify-center">
                  <RadialProgress
                    value={seg.value}
                    max={target}
                    size={70}
                    strokeWidth={8}
                    color={seg.color}
                    hideLabel
                  />
                  <span className="mt-1 text-[10px] md:text-xs font-medium text-text-secondary">{seg.label}</span>
                  <span className="text-[11px] md:text-sm font-bold font-mono">{Math.round(segPercent)}%</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {filteredSegments.map((seg) => {
              const segPercent = target > 0 ? Math.min((seg.value / target) * 100, 100) : 0
              return (
                <div key={seg.label} className="flex flex-col items-center">
                  <RadialProgress
                    value={seg.value}
                    max={target}
                    size={90}
                    strokeWidth={10}
                    color={seg.color}
                    hideLabel
                  />
                  <span className="mt-1 text-[10px] md:text-xs font-medium text-text-secondary">{seg.label}</span>
                  <span className="text-[11px] md:text-sm font-bold font-mono">{Math.round(segPercent)}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Progresso totale</span>
          <span className="font-medium">{goalPercent}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, #C5963A, #00D2FF)' }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary">
          <span>{formatCurrency(goalMetricCurrent)}</span>
          <span>{formatCurrency(target)}</span>
        </div>
      </div>
    </GlassCard>
  )
}

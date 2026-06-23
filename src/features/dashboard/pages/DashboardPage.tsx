import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { AreaChart } from '../../../shared/charts/AreaChart'
import { BarChart } from '../../../shared/charts/BarChart'
import { KPIGroup } from '../components/KPIGroup'
import { ProgressRings } from '../components/ProgressRings'
import { useDashboardData } from '../hooks/useDashboardData'
import { formatCurrency } from '../../../lib/calculations'
import { resolveDashboardLayout } from '../../../lib/dashboardLayout'
import { QueryLoading, QueryError } from '../../../shared/ui/QueryState'
import type { DashboardModuleId } from '../../../types/database'

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardData()

  if (isLoading) return <QueryLoading message="Caricamento dashboard..." />
  if (isError) return <QueryError message={error?.message} onRetry={() => refetch()} />
  if (!data) return null

  const layout = resolveDashboardLayout(data.profile?.dashboard_layout)
  const kpiMetrics = [
    { label: 'In Attesa', value: data.metrics.gross_pending, color: 'text-pending' },
    { label: 'Incassati', value: data.metrics.gross_settled, color: 'text-success' },
    { label: 'Netti In Attesa', value: data.metrics.net_pending, color: 'text-pending' },
    { label: 'Netti Incassati', value: data.metrics.net_settled, color: 'text-success' },
    { label: 'Cash In Attesa', value: data.metrics.cash_pending, color: 'text-pending' },
    { label: 'Cash Incassati', value: data.metrics.cash_settled, color: 'text-success' },
    { label: 'Uscite', value: data.metrics.expenses_total, color: 'text-expense' },
    { label: 'Saldo', value: data.metrics.balance, color: 'text-success' },
  ]

  const modules: Record<DashboardModuleId, ReactNode> = {
    'kpi-group': <KPIGroup metrics={kpiMetrics} />,
    'progress-rings': (
      <ProgressRings
        workloadPercent={data.workloadPercent}
        workloadActive={data.jobs.filter((j) => j.status === 'active').length}
        workloadPending={data.jobs.filter((j) => j.status === 'completed_pending').length}
        workloadSettled={data.jobs.filter((j) => j.status === 'completed_settled').length}
        segments={data.segments}
        goalMetric={data.fiscalSetup?.goal_metric ?? data.profile?.goal_metric ?? 'net_settled'}
        goalCurrent={data.financialCurrent}
        goalTarget={data.financialGoal}
        metrics={data.metrics}
      />
    ),
    charts: data.monthlySummary.length > 0 ? (
      <GlassCard className="p-4 md:p-6 h-full flex flex-col">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Andamento Economico</h3>
        <div className="flex-1">
          <AreaChart data={data.monthlySummary} />
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4">
          <div className="text-center">
            <p className="text-[10px] md:text-xs text-text-secondary">Entrate totali</p>
            <p className="text-sm md:text-lg font-bold font-mono text-text-primary">
              {formatCurrency(data.monthlySummary.reduce((s, m) => s + m.income, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] md:text-xs text-text-secondary">Uscite totali</p>
            <p className="text-sm md:text-lg font-bold font-mono text-text-primary">
              {formatCurrency(data.monthlySummary.reduce((s, m) => s + m.expenses, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] md:text-xs text-text-secondary">Saldo netto</p>
            <p className="text-sm md:text-lg font-bold font-mono text-text-primary">
              {formatCurrency(data.metrics.balance)}
            </p>
          </div>
        </div>
      </GlassCard>
    ) : (
      <GlassCard className="p-4 md:p-6 h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          <p>Nessun dato disponibile. Inizia a creare lavori.</p>
        </div>
      </GlassCard>
    ),
    'bar-chart': data.monthlySummary.length > 0 ? (
      <GlassCard className="p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Confronto Carta / Cash</h3>
        <BarChart data={data.monthlySummary} />
      </GlassCard>
    ) : (
      <GlassCard className="p-4 md:p-6">
        <div className="flex items-center justify-center h-48 md:h-72 text-text-secondary">
          <p>Nessun dato disponibile. Inizia a creare lavori.</p>
        </div>
      </GlassCard>
    ),
    'quick-register': (
        <GlassCard className="p-4 md:p-6 text-center">
          <p className="text-xs md:text-sm text-text-secondary">Vai al Registro per l&apos;archivio completo dei lavori incassati.</p>
        </GlassCard>
    ),
  }

  const colSpan: Partial<Record<DashboardModuleId, string>> = {
    'kpi-group': 'md:col-span-2 lg:col-span-5',
    charts: 'md:col-span-2 lg:col-span-3',
    'quick-register': 'lg:col-span-2',
    'progress-rings': 'lg:col-span-2',
    'bar-chart': 'md:col-span-2 lg:col-span-5',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold">Dashboard</h2>
        <p className="text-xs md:text-sm text-text-secondary">Panoramica finanziaria</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {layout.filter((m) => m.visible).map((mod, index) => (
          <ModuleWrapper
            key={`${mod.id}-${mod.order}`}
            index={index}
            className={colSpan[mod.id] ?? 'lg:col-span-2'}
          >
            {modules[mod.id]}
          </ModuleWrapper>
        ))}

        {data.jobs.length === 0 && (
          <ModuleWrapper index={layout.length} className="lg:col-span-5">
            <GlassCard className="p-6 md:p-12 text-center">
              <p className="text-base md:text-xl font-semibold text-text-secondary">Benvenuto in NetFlow</p>
              <p className="text-xs md:text-sm text-text-secondary mt-2">
                Crea il tuo primo lavoro nella sezione Lavori per vedere la dashboard popolarsi.
              </p>
            </GlassCard>
          </ModuleWrapper>
        )}
      </div>
    </motion.div>
  )
}

function ModuleWrapper({ index, className, children }: { index: number; className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2) }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

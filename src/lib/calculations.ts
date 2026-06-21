import type { Job, JobStatus, TaxRegime } from '../types/database'
import type { MoneyMetrics } from '../types/metrics'
import { grossToNet } from './tax'

export function calculateMetrics(jobs: Job[], expensesTotal: number, regime?: TaxRegime, customIrpefRate?: number): MoneyMetrics {
  const pending = jobs.filter((j) => j.status === 'completed_pending')
  const settled = jobs.filter((j) => j.status === 'completed_settled')

  const gross_pending = pending.reduce(sumGross, 0)
  const gross_settled = settled.reduce(sumGross, 0)
  const cash_pending = pending.reduce(sumCash, 0)
  const cash_settled = settled.reduce(sumCash, 0)

  return {
    gross_pending,
    gross_settled,
    net_pending: pending.reduce((t, j) => t + getNetAmount(j, regime, customIrpefRate), 0),
    net_settled: settled.reduce((t, j) => t + getNetAmount(j, regime, customIrpefRate), 0),
    cash_pending,
    cash_settled,
    expenses_total: expensesTotal,
    balance: settled.reduce((t, j) => t + getNetAmount(j, regime, customIrpefRate), 0) - expensesTotal,
    goal_progress: 0,
  }
}

function getNetAmount(job: Job, regime?: TaxRegime, customIrpefRate?: number | null): number {
  if (job.net_amount && job.net_amount > 0) return job.net_amount
  if (regime) {
    const gross = job.amount_card + job.amount_cash
    return grossToNet(gross, regime, customIrpefRate)
  }
  return 0
}

function sumGross(total: number, job: Job): number {
  return total + job.amount_card + job.amount_cash
}

function sumCash(total: number, job: Job): number {
  return total + job.amount_cash
}

export function calculateGoalProgress(
  jobs: Job[],
  target: number,
  metric: 'net_settled' | 'gross_total' | 'cash_only' | 'gross_settled' | 'net_pending',
  regime?: TaxRegime,
  customIrpefRate?: number | null,
): number {
  if (target <= 0) return 0

  const settled = jobs.filter((j) => j.status === 'completed_settled')
  const pending = jobs.filter((j) => j.status === 'completed_pending')

  let current = 0
  switch (metric) {
    case 'gross_settled':
      current = settled.reduce(sumGross, 0)
      break
    case 'gross_total':
      current = [...settled, ...pending].reduce(sumGross, 0)
      break
    case 'cash_only':
      current = settled.reduce(sumCash, 0)
      break
    case 'net_settled':
      current = settled.reduce((t, j) => t + getNetAmount(j, regime, customIrpefRate), 0)
      break
    case 'net_pending':
      current = pending.reduce((t, j) => t + getNetAmount(j, regime, customIrpefRate), 0)
      break
  }

  return Math.min(Math.round((current / target) * 100), 100)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function filterJobsByStatus(jobs: Job[], statusFilter: JobStatus | 'all'): Job[] {
  if (statusFilter === 'all') return jobs
  return jobs.filter((j) => j.status === statusFilter)
}

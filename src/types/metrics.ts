import type { GoalMetric, JobStatus } from './database'

export interface MoneyMetrics {
  gross_pending: number
  gross_settled: number
  net_pending: number
  net_settled: number
  cash_pending: number
  cash_settled: number
  expenses_total: number
  balance: number
  goal_progress: number
}

export interface MonthlySummary {
  month: string
  income: number
  expenses: number
  balance: number
  cash_income: number
  card_income: number
}

export interface DashboardKPIs {
  order_pending: number
  settled: number
  net_pending: number
  net_settled: number
  cash_pending: number
  cash_settled: number
  expenses: number
  balance: number
  goal: {
    target: number
    current: number
    metric: GoalMetric
    progress: number
  }
  segments: Array<{
    label: string
    value: number
    max: number
    progress: number
    color: string
  }>
}

export interface SyncQueueItem {
  id: string
  table: 'jobs' | 'transactions' | 'invoices' | 'clients' | 'profiles' | 'user_settings' | 'expenses' | 'fiscal_setups' | 'invoice_jobs'
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  record_id?: string
  temp_id?: string
  timestamp: number
  retries: number
  max_retries: number
}

export type JobStatusFilter = JobStatus | 'all'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { useFiscalYearStore } from '../../../lib/stores/fiscalYear'
import { getYearRange } from '../../../lib/fiscalYear'
import { calculateMetrics, calculateGoalProgress } from '../../../lib/calculations'
import type { Job, Profile, FiscalSetup, TaxRegime, Expense } from '../../../types/database'
import type { MonthlySummary } from '../../../types/metrics'
import { grossToNet } from '../../../lib/tax'

export function useDashboardData() {
  const year = useFiscalYearStore((s) => s.year)
  const range = getYearRange(year)
  return useQuery({
    queryKey: ['dashboard', year],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const [jobsRes, profileRes, fiscalSetupRes, expensesRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('start_date', range.gte)
          .lte('start_date', range.lte),
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase
          .from('fiscal_setups')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('year', year)
          .maybeSingle(),
        supabase
          .from('expenses')
          .select('amount, date')
          .eq('user_id', session.user.id)
          .gte('date', range.gte)
          .lte('date', range.lte),
      ])
      if (jobsRes.error) throw jobsRes.error
      if (profileRes.error) throw profileRes.error
      if (fiscalSetupRes.error) throw fiscalSetupRes.error
      if (expensesRes.error) throw expensesRes.error

      const jobs = (jobsRes.data ?? []) as unknown as Job[]
      const profile = profileRes.data as unknown as Profile | null
      const fiscalSetup = fiscalSetupRes.data as unknown as FiscalSetup | null
      const expenses = (expensesRes.data ?? []) as unknown as Pick<Expense, 'amount' | 'date'>[]
      const expensesTotal = expenses.reduce((t, e) => t + e.amount, 0)

      const regime = fiscalSetup?.tax_regime ?? profile?.tax_regime ?? 'occasional'
      const customIrpefRate = fiscalSetup?.custom_irpef_rate ?? undefined

      const metrics = calculateMetrics(jobs, expensesTotal, regime, customIrpefRate)

      const fiscalGoal = fiscalSetup?.financial_goal ?? profile?.financial_goal ?? 0
      const fiscalMetric = fiscalSetup?.goal_metric ?? profile?.goal_metric ?? 'net_settled'

      const goalProgress = fiscalGoal > 0
        ? calculateGoalProgress(jobs, fiscalGoal, fiscalMetric, regime, customIrpefRate)
        : 0

      const segments = buildSegments(jobs, regime, customIrpefRate)
      const monthlySummary = buildMonthlySummary(jobs, expenses)
      const workloadPercent = calculateWorkloadPercent(jobs)
      const financialLoadPercent = fiscalGoal > 0
        ? Math.min((metrics.gross_pending + metrics.gross_settled) / fiscalGoal * 100, 100)
        : 0

      return {
        metrics,
        goalProgress,
        segments,
        monthlySummary,
        workloadPercent,
        financialLoadPercent,
        financialCurrent: metrics.gross_pending + metrics.gross_settled,
        financialGoal: fiscalGoal,
        profile,
        fiscalSetup,
        jobs,
      }
    },
    staleTime: 1000 * 60 * 2,
  })
}

function buildSegments(jobs: Job[], regime: TaxRegime, customIrpefRate?: number | null) {
  const settled = jobs.filter((j) => j.status === 'completed_settled')
  const pending = jobs.filter((j) => j.status === 'completed_pending')

  const netSettled = settled.reduce((t, j) => {
    return t + (j.net_amount > 0 ? j.net_amount : grossToNet(j.amount_card + j.amount_cash, regime, customIrpefRate))
  }, 0)

  const grossTotal = [...settled, ...pending].reduce((t, j) => t + j.amount_card + j.amount_cash, 0)
  const cashTotal = [...settled, ...pending].reduce((t, j) => t + j.amount_cash, 0)

  return [
    { label: 'Netto', value: netSettled, color: '#C5963A' },
    { label: 'Lordo', value: grossTotal, color: '#00D2FF' },
    { label: 'Cash', value: cashTotal, color: '#00B894' },
  ]
}

function buildMonthlySummary(jobs: Job[], expenses: Pick<Expense, 'amount' | 'date'>[]): MonthlySummary[] {
  const months: Record<string, MonthlySummary> = {}
  const settled = jobs.filter((j) => j.status === 'completed_settled')

  for (const job of settled) {
    const month = (job.end_date ?? job.start_date).slice(0, 7)
    if (!months[month]) {
      months[month] = { month, income: 0, expenses: 0, balance: 0, cash_income: 0, card_income: 0 }
    }
    const total = job.amount_card + job.amount_cash
    months[month].income += total
    months[month].cash_income += job.amount_cash
    months[month].card_income += job.amount_card
  }

  for (const expense of expenses) {
    const month = expense.date.slice(0, 7)
    if (!months[month]) {
      months[month] = { month, income: 0, expenses: 0, balance: 0, cash_income: 0, card_income: 0 }
    }
    months[month].expenses += expense.amount
  }

  for (const m of Object.values(months)) {
    m.balance = m.income - m.expenses
  }

  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
}

function calculateWorkloadPercent(jobs: Job[]): number {
  const active = jobs.filter((j) => j.status === 'active').length
  const total = jobs.length
  if (total === 0) return 0
  return Math.round((active / total) * 100)
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useFiscalYearStore } from '../stores/fiscalYear'
import type { FiscalSetup, TaxRegime, GoalMetric, GoalData } from '../../types/database'

export function useFiscalSetup() {
  const year = useFiscalYearStore((s) => s.year)
  return useQuery({
    queryKey: ['fiscal_setup', year],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return null
      const { data, error } = await supabase
        .from('fiscal_setups')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('year', year)
        .maybeSingle()
      if (error) throw error
      return (data ?? null) as unknown as FiscalSetup | null
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpsertFiscalSetup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (setup: {
      year: number
      tax_regime: TaxRegime
      financial_goal: number
      goal_metric: GoalMetric
      goal_data?: GoalData
      custom_irpef_rate?: number | null
    }) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('fiscal_setups')
        .upsert({
          user_id: user.user.id,
          year: setup.year,
          tax_regime: setup.tax_regime,
          financial_goal: setup.financial_goal,
          goal_metric: setup.goal_metric,
          goal_data: setup.goal_data ?? {},
          custom_irpef_rate: setup.custom_irpef_rate ?? null,
        }, { onConflict: 'user_id,year' })
        .select()
        .single()

      if (error) throw error
      return data as unknown as FiscalSetup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_setup'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

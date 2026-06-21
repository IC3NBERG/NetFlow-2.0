import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useFiscalYearStore } from '../stores/fiscalYear'
import { getYearRange } from '../fiscalYear'
import { executeWithSync } from '../syncExecute'
import { OfflineQueuedError } from '../syncBridge'
import type { Expense } from '../../types/database'

type InsertExpense = Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>
type UpdateExpense = Partial<InsertExpense> & { id: string }

export function useExpenses() {
  const year = useFiscalYearStore((s) => s.year)
  const range = getYearRange(year)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses', year],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.user.id)
        .gte('date', range.gte)
        .lte('date', range.lte)
        .order('date', { ascending: false })

      if (error) throw error
      return data as unknown as Expense[]
    },
  })

  const createExpense = useMutation({
    mutationFn: async (expense: InsertExpense) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')
      const payload = { ...expense, user_id: user.user.id }
      return executeWithSync(
        { table: 'expenses', operation: 'insert', payload },
        async () => {
          const { data, error } = await supabase.from('expenses').insert(payload).select().single()
          if (error) throw error
          return data as unknown as Expense
        },
      )
    },
    onSettled: (_data, err) => {
      if (!err || err instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
  })

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...fields }: UpdateExpense) => {
      return executeWithSync(
        { table: 'expenses', operation: 'update', payload: fields, record_id: id },
        async () => {
          const { data, error } = await supabase.from('expenses').update(fields).eq('id', id).select().single()
          if (error) throw error
          return data as unknown as Expense
        },
      )
    },
    onSettled: (_data, err) => {
      if (!err || err instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
  })

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      return executeWithSync(
        { table: 'expenses', operation: 'delete', payload: {}, record_id: id },
        async () => {
          const { error } = await supabase.from('expenses').delete().eq('id', id)
          if (error) throw error
        },
      )
    },
    onSettled: (_data, err) => {
      if (!err || err instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
  })

  return { data, isLoading, error, createExpense, updateExpense, deleteExpense }
}

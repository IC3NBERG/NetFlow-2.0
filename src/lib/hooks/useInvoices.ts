import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useFiscalYearStore } from '../stores/fiscalYear'
import { getYearRange } from '../fiscalYear'
import { executeWithSync } from '../syncExecute'
import { OfflineQueuedError } from '../syncBridge'
import type { Invoice } from '../../types/database'

export function useInvoices() {
  const year = useFiscalYearStore((s) => s.year)
  const range = getYearRange(year)
  return useQuery({
    queryKey: ['invoices', year],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.user.id)
        .gte('issued_date', range.gte)
        .lte('issued_date', range.lte)
        .order('issued_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Invoice[]
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, 'id' | 'created_at'>) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')
      const payload = { ...invoice, user_id: user.user.id }
      return executeWithSync(
        { table: 'invoices', operation: 'insert', payload },
        async () => {
          const { data, error } = await supabase.from('invoices').insert(payload).select().single()
          if (error) throw error
          return data as unknown as Invoice
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
      }
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Invoice> & { id: string }) => {
      return executeWithSync(
        { table: 'invoices', operation: 'update', payload: data, record_id: id },
        async () => {
          const { error } = await supabase.from('invoices').update(data).eq('id', id)
          if (error) throw error
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
      }
    },
  })
}

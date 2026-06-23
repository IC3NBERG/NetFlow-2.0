import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { executeWithSync } from '../syncExecute'
import { OfflineQueuedError } from '../syncBridge'
import { useAuth } from '../../app/providers/AuthProvider'
import type { Quote } from '../../types/database'

export function useQuotes(clientId?: string | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['quotes', user?.id, clientId],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')
      let query = supabase
        .from('quotes')
        .select('*, clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (clientId) query = query.eq('client_id', clientId)
      const { data, error } = await query
      if (error) throw error
      return data as (Quote & { clients: { name: string } | null })[]
    },
    enabled: !!user,
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (quote: {
      client_id?: string
      title: string
      description?: string
      gross_amount: number
      tax_amount: number
      net_amount: number
      tax_rate: number
      valid_until?: string
      notes?: string
    }) => {
      if (!user) throw new Error('Not authenticated')
      const quoteNumber = `P-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`
      const payload = { ...quote, user_id: user.id, quote_number: quoteNumber }
      return executeWithSync(
        { table: 'quotes', operation: 'insert', payload },
        async () => {
          const { data, error } = await supabase.from('quotes').insert(payload).select().single()
          if (error) throw error
          return data as Quote
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['quotes'] })
      }
    },
  })
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: Quote['status'] }) => {
      const { error } = await supabase.from('quotes').update({ status }).eq('id', quoteId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

export function useConvertQuoteToJob() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({
      quoteId,
      jobData,
    }: {
      quoteId: string
      jobData: {
        title: string
        client_id?: string
        amount_card: number
        status: 'completed_pending'
      }
    }) => {
      if (!user) throw new Error('Not authenticated')
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          ...jobData,
          user_id: user.id,
          net_amount: jobData.amount_card,
          start_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()
      if (jobError) throw jobError
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status: 'converted', converted_job_id: job.id })
        .eq('id', quoteId)
      if (updateError) throw updateError
      return job
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useDeleteQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase.from('quotes').delete().eq('id', quoteId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

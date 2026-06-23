import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useFiscalYearStore } from '../stores/fiscalYear'
import { getYearRange } from '../fiscalYear'
import { executeWithSync } from '../syncExecute'
import { OfflineQueuedError } from '../syncBridge'
import type { Job } from '../../types/database'

export function useJobs() {
  const year = useFiscalYearStore((s) => s.year)
  const range = getYearRange(year)
  return useQuery({
    queryKey: ['jobs', year],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('start_date', range.gte)
        .lte('start_date', range.lte)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Job[]
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const payload = { ...job, user_id: session.user.id }
      return executeWithSync(
        { table: 'jobs', operation: 'insert', payload },
        async () => {
          const { data, error } = await supabase.from('jobs').insert(payload).select().single()
          if (error) throw error
          return data as unknown as Job
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...job }: Partial<Job> & { id: string }) => {
      return executeWithSync(
        { table: 'jobs', operation: 'update', payload: job, record_id: id },
        async () => {
          const { data, error } = await supabase.from('jobs').update(job).eq('id', id).select().single()
          if (error) throw error
          return data as unknown as Job
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithSync(
        { table: 'jobs', operation: 'delete', payload: {}, record_id: id },
        async () => {
          const { error } = await supabase.from('jobs').delete().eq('id', id)
          if (error) throw error
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
  })
}

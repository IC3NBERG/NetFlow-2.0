import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { executeWithSync } from '../syncExecute'
import { OfflineQueuedError } from '../syncBridge'
import { useAuth } from '../../app/providers/AuthProvider'
import type { Client } from '../../types/database'

export function useClients() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as Client[]
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated')
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        console.error('[useCreateClient] No active session — user may need to re-login')
        throw new Error('Sessione scaduta. Effettua di nuovo il login.')
      }
      const payload = { ...client, user_id: user.id }
      return executeWithSync(
        { table: 'clients', operation: 'insert', payload },
        async () => {
          const { data, error } = await supabase.from('clients').insert(payload).select().single()
          if (error) {
            console.error('[useCreateClient] Supabase error:', error)
            throw error
          }
          return data as unknown as Client
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['clients'] })
      }
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      return executeWithSync(
        { table: 'clients', operation: 'update', payload: data, record_id: id },
        async () => {
          const { error } = await supabase.from('clients').update(data).eq('id', id)
          if (error) throw error
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['clients'] })
      }
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithSync(
        { table: 'clients', operation: 'delete', payload: {}, record_id: id },
        async () => {
          const { error } = await supabase.from('clients').delete().eq('id', id)
          if (error) throw error
        },
      )
    },
    onSettled: (_data, error) => {
      if (!error || error instanceof OfflineQueuedError) {
        queryClient.invalidateQueries({ queryKey: ['clients'] })
      }
    },
  })
}

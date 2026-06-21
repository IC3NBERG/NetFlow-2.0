import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from '../../app/providers/AuthProvider'

export interface CustomEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  date: string
  color: string
  created_at: string
}

export function useCustomEvents() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['custom_events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_events')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: true })
      if (error) throw error
      return data as CustomEvent[]
    },
    enabled: !!user,
  })
}

export function useCreateCustomEvent() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (event: { title: string; description?: string; date: string; color?: string }) => {
      const { data, error } = await supabase
        .from('custom_events')
        .insert({ ...event, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data as CustomEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_events'] })
    },
  })
}

export function useDeleteCustomEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_events'] })
    },
  })
}

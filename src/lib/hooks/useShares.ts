import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from '../../app/providers/AuthProvider'
import type { Share } from '../../types/database'

export function useShares() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['shares', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shares')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Share[]
    },
    enabled: !!user,
  })
}

export function useCreateShare() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (share: {
      access_level: Share['access_level']
      description?: string
      expires_at?: string
    }) => {
      const { data, error } = await supabase
        .from('shares')
        .insert({ ...share, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data as Share
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shares'] }),
  })
}

export function useDeleteShare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.from('shares').delete().eq('id', shareId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shares'] }),
  })
}

export function useShareByToken(token: string | undefined) {
  return useQuery({
    queryKey: ['share', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shares')
        .select('*')
        .eq('token', token)
        .single()
      if (error) throw error
      return data as Share
    },
    enabled: !!token,
  })
}

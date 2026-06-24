import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from '../../app/providers/AuthProvider'
import type { Share, ShareSection } from '../../types/database'

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
      name?: string
      description?: string
      expires_at?: string
      password?: string
      max_views?: number
      sections?: ShareSection[]
    }) => {
      const payload: Record<string, unknown> = {
        ...share,
        user_id: user!.id,
        sections: share.sections ?? ['jobs', 'clients', 'invoices', 'expenses', 'quotes'],
      }
      delete payload.password
      if (share.password) {
        payload.password_hash = share.password
      }
      const { data, error } = await supabase
        .from('shares')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Share
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shares'] }),
  })
}

export function useUpdateShare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string
      name?: string
      description?: string | null
      is_active?: boolean
      access_level?: Share['access_level']
      expires_at?: string | null
      max_views?: number | null
      sections?: ShareSection[]
    }) => {
      const { error } = await supabase
        .from('shares')
        .update(data)
        .eq('id', id)
      if (error) throw error
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

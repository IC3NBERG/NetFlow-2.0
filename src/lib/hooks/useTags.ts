import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from '../../app/providers/AuthProvider'
import type { Tag } from '../../types/database'

export function useTags() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user!.id)
        .order('name')
      if (error) throw error
      return data as Tag[]
    },
    enabled: !!user,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .insert({ ...tag, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data as Tag
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', tagId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })
}

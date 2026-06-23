import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { UserSettings } from '../../types/database'

export function useUserSettings() {
  return useQuery({
    queryKey: ['user_settings'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      return (data ?? null) as unknown as UserSettings | null
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', session.user.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user_settings'] }),
  })
}

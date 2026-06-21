import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { Profile } from '../../types/database'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Profile> & { id: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', data.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

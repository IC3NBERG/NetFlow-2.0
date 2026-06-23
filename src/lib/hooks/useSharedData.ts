import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

interface SharedData {
  profile: Record<string, unknown> | null
  jobs: Record<string, unknown>[]
  clients: Record<string, unknown>[]
  invoices: Record<string, unknown>[]
  expenses: Record<string, unknown>[]
  quotes: Record<string, unknown>[]
  share: Record<string, unknown>
}

export function useSharedData(token: string | undefined) {
  return useQuery({
    queryKey: ['shared_data', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shared_data', { token })
      if (error) throw error
      return data as unknown as SharedData
    },
    enabled: !!token,
    retry: 1,
  })
}

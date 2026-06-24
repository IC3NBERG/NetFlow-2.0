import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { Profile, Job, Client, Invoice, Expense, Quote, Share } from '../../types/database'

export interface SharedData {
  profile: Profile | null
  jobs: Job[]
  clients: Client[]
  invoices: Invoice[]
  expenses: Expense[]
  quotes: Quote[]
  share: Share
}

interface ShareInfo {
  has_password: boolean
  name: string | null
  description: string | null
  access_level: string
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

export function useShareInfo(token: string | undefined) {
  return useQuery({
    queryKey: ['share_info', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_share_info', { p_token: token })
      if (error) throw error
      return data as unknown as ShareInfo
    },
    enabled: !!token,
    retry: 1,
  })
}

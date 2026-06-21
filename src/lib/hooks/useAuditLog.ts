import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from '../../app/providers/AuthProvider'
import type { AuditLog } from '../../types/database'

export function useAuditLog() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['audit_log', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as AuditLog[]
    },
    enabled: !!user,
  })
}

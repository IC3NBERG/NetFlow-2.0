import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user) return
      const uid = session.user.id

      const channel = supabase
        .channel(`netflow-${uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `user_id=eq.${uid}` }, () => {
          queryClient.invalidateQueries({ queryKey: ['jobs'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['ledger'] })
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${uid}` }, () => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] })
          queryClient.invalidateQueries({ queryKey: ['jobs'] })
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${uid}` }, () => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `user_id=eq.${uid}` }, () => {
          queryClient.invalidateQueries({ queryKey: ['clients'] })
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    })

    return () => {
      active = false
    }
  }, [queryClient])
}

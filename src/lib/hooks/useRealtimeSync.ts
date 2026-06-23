import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user) return
      const uid = session.user.id

      channel = supabase
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
        .subscribe((_status: string, err?: Error) => {
          if (err) console.warn('[Realtime] Subscription error:', err.message)
        })
    })

    return () => {
      active = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [queryClient])
}

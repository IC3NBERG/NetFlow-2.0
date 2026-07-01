import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'

const MAX_RETRIES = 10
const BASE_DELAY = 2000

function subscribeWithRetry(
  label: string,
  buildChannel: () => ReturnType<typeof supabase.channel>,
): () => void {
  let cancelled = false
  let retries = 0
  let channel: ReturnType<typeof supabase.channel> | null = null

  function attempt() {
    if (cancelled) return
    channel = buildChannel()
    channel.subscribe((status: string, err?: Error) => {
      if (cancelled) return
      if (status === 'SUBSCRIBED') {
        retries = 0
        return
      }
      if (err && retries < MAX_RETRIES) {
        retries++
        const delay = Math.min(BASE_DELAY * Math.pow(2, retries - 1), 30000)
        if (retries === 1) console.warn(`[Realtime] ${label} error:`, err.message)
        setTimeout(attempt, delay)
      } else if (err) {
        if (retries === MAX_RETRIES) console.warn(`[Realtime] ${label}: stopped retrying after ${MAX_RETRIES} attempts`)
      }
    })
  }

  attempt()

  return () => {
    cancelled = true
    if (channel) supabase.removeChannel(channel)
  }
}

export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user) return
      const uid = session.user.id

      cleanupRef.current = subscribeWithRetry('Sync', () =>
        supabase
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
          }),
      )
    })

    return () => {
      active = false
      cleanupRef.current?.()
    }
  }, [queryClient])
}

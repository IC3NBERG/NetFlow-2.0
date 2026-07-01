import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useUnreadNotificationCounts } from './useNotifications'

const NOTIFICATIONS_KEY = ['notifications']
const UNREAD_COUNTS_KEY = ['notifications', 'unread_counts']
const MAX_RETRIES = 10
const BASE_DELAY = 2000

function subscribeWithRetry(
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
        if (retries === 1) console.warn('[Realtime] Notification subscription error:', err.message)
        setTimeout(attempt, delay)
      } else if (err) {
        if (retries === MAX_RETRIES) console.warn('[Realtime] Notifications: stopped retrying')
      }
    })
  }

  attempt()

  return () => {
    cancelled = true
    if (channel) supabase.removeChannel(channel)
  }
}

export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || !session?.user) return

      cleanupRef.current = subscribeWithRetry(() =>
        supabase
          .channel('notifications-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${session.user.id}`,
            },
            () => {
              queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
              queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_KEY })
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${session.user.id}`,
            },
            () => {
              queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
              queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_KEY })
            },
          ),
      )
    })

    return () => {
      mounted = false
      cleanupRef.current?.()
    }
  }, [queryClient])
}

export function useNewNotificationTracker() {
  const { data: unreadCounts } = useUnreadNotificationCounts()
  const prevTotalRef = useRef(0)
  const currentTotal = Object.values(unreadCounts ?? {}).reduce((a: number, b: number) => a + b, 0)

  useEffect(() => {
    if (prevTotalRef.current === 0) {
      prevTotalRef.current = currentTotal
      return
    }
    if (currentTotal > prevTotalRef.current) {
      prevTotalRef.current = currentTotal
      if (!document.hasFocus()) {
        const newCount = currentTotal - prevTotalRef.current
        window.dispatchEvent(new CustomEvent('new-notification', { detail: { count: newCount } }))
      }
    } else {
      prevTotalRef.current = currentTotal
    }
  }, [currentTotal])
}

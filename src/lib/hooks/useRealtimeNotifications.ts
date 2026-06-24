import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useUnreadNotificationCounts } from './useNotifications'

const NOTIFICATIONS_KEY = ['notifications']
const UNREAD_COUNTS_KEY = ['notifications', 'unread_counts']

export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || !session?.user) return

      const channel = supabase
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
        )
        .subscribe((_status: string, err?: Error) => {
          if (err) console.warn('[Realtime] Notification subscription error:', err.message)
        })

      channelRef.current = channel
    })

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
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

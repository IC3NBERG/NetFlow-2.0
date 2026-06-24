import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { Notification, NotificationCategory } from '../../types/database'

const NOTIFICATIONS_KEY = ['notifications']
const UNREAD_COUNTS_KEY = ['notifications', 'unread_counts']

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, { limit }],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return []
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      return (data ?? []) as Notification[]
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

export function useUnreadNotificationCounts() {
  return useQuery({
    queryKey: UNREAD_COUNTS_KEY,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return {} as Record<NotificationCategory, number>
      const { data, error } = await supabase.rpc('get_unread_notification_counts')
      if (error) return {} as Record<NotificationCategory, number>
      return (data ?? {}) as Record<NotificationCategory, number>
    },
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  })
}

export function useNotificationsByCategory(category: NotificationCategory, limit = 20) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, { category, limit }],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return []
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(limit)
      return (data ?? []) as Notification[]
    },
    staleTime: 1000 * 30,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_KEY })
    },
  })
}

export function useDismissNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('dismiss_notification', {
        p_notification_id: notificationId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_KEY })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read')
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_KEY })
    },
  })
}

export function useCreateNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notification: {
      category: NotificationCategory
      title: string
      message: string
      link?: string
      icon?: string
      metadata?: Record<string, unknown>
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: session.user.id,
          category: notification.category,
          title: notification.title,
          message: notification.message,
          link: notification.link ?? null,
          icon: notification.icon ?? null,
          metadata: notification.metadata ?? {},
        })
        .select()
        .single()
      if (error) throw error
      return data as Notification
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_KEY })
    },
  })
}

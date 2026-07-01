import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { UserSettings, NotificationCategory } from '../../types/database'

const defaultNotificationPreferences: Record<NotificationCategory, boolean> = {
  deadline: true,
  invoice: true,
  backup: true,
  sync: true,
  goal: true,
  quote: true,
  expense: true,
  system: true,
  message: true,
}

export function useUserSettings() {
  return useQuery({
    queryKey: ['user_settings'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      const settings = (data ?? null) as unknown as UserSettings | null
      if (settings && !settings.notification_preferences) {
        settings.notification_preferences = { ...defaultNotificationPreferences }
      }
      return settings
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', session.user.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user_settings'] }),
  })
}

export function useNotificationPreference(category: NotificationCategory) {
  const { data: settings } = useUserSettings()
  return settings?.notification_preferences?.[category] ?? true
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient()
  const { data: settings } = useUserSettings()
  return useMutation({
    mutationFn: async ({
      category,
      enabled,
    }: {
      category: NotificationCategory
      enabled: boolean
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const currentPrefs = settings?.notification_preferences ?? { ...defaultNotificationPreferences }
      const updatedPrefs = { ...currentPrefs, [category]: enabled }
      const { error } = await supabase
        .from('user_settings')
        .update({ notification_preferences: updatedPrefs })
        .eq('user_id', session.user.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user_settings'] }),
  })
}

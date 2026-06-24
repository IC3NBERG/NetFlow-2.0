import { useEffect, useCallback, useRef } from 'react'
import { useUserSettings } from './useUserSettings'
import { useUnreadNotificationCounts } from './useNotifications'

const NOTIFICATION_ICON = '/logo-icon.svg'

export function useOsNotifications() {
  const { data: settings } = useUserSettings()
  const { data: unreadCounts } = useUnreadNotificationCounts()
  const prevTotalRef = useRef(0)

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }, [])

  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  useEffect(() => {
    if (settings?.notifications_enabled === false) return
    const currentTotal = Object.values(unreadCounts ?? {}).reduce((a: number, b: number) => a + b, 0)

    if (prevTotalRef.current === 0) {
      prevTotalRef.current = currentTotal
      return
    }

    if (currentTotal > prevTotalRef.current) {
      prevTotalRef.current = currentTotal
      sendOsNotification('Nuove notifiche', `Hai ${currentTotal} notifica${currentTotal > 1 ? 'e' : ''} non lett${currentTotal > 1 ? 'e' : 'a'}`)
    } else {
      prevTotalRef.current = currentTotal
    }
  }, [unreadCounts, settings])

  useEffect(() => {
    function handleNewNotification(e: Event) {
      const detail = (e as CustomEvent).detail as { count: number }
      if (settings?.notifications_enabled === false) return
      sendOsNotification(
        'Nuova notifica',
        `Hai ${detail.count} nuova${detail.count > 1 ? 'e' : ''} notifica${detail.count > 1 ? 'e' : ''}`,
      )
    }
    window.addEventListener('new-notification', handleNewNotification)
    return () => window.removeEventListener('new-notification', handleNewNotification)
  }, [settings])

  async function sendOsNotification(title: string, body: string) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (document.hasFocus()) return
    try {
      new Notification(title, { body, icon: NOTIFICATION_ICON, tag: 'netflow-notification', silent: true })
    } catch {
      // Notification API may fail
    }
  }

  return { requestPermission }
}

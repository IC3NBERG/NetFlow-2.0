import { useEffect, useRef, useCallback } from 'react'
import { useUserSettings } from './useUserSettings'
import { useUnreadNotificationCounts } from './useNotifications'

export function useNotificationSound() {
  const { data: settings } = useUserSettings()
  const { data: unreadCounts } = useUnreadNotificationCounts()
  const audioCtxRef = useRef<AudioContext | null>(null)
  const prevTotalRef = useRef(0)

  const playChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.setValueAtTime(1108, ctx.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch {
      // Audio not available
    }
  }, [])

  useEffect(() => {
    if (settings?.notifications_enabled === false) return
    const currentTotal = Object.values(unreadCounts ?? {}).reduce((a: number, b: number) => a + b, 0)
    if (prevTotalRef.current === 0) {
      prevTotalRef.current = currentTotal
      return
    }
    if (currentTotal > prevTotalRef.current) playChime()
    prevTotalRef.current = currentTotal
  }, [unreadCounts, settings, playChime])
}

import { useEffect, useRef } from 'react'
import { useUnreadNotificationCounts } from './useNotifications'

export function useFaviconBadge() {
  const { data: unreadCounts } = useUnreadNotificationCounts()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const currentTotal = Object.values(unreadCounts ?? {}).reduce((a: number, b: number) => a + b, 0)
    updateFavicon(currentTotal)
  }, [unreadCounts])

  function updateFavicon(count: number) {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return
    if (count === 0) {
      link.href = '/favicon.png'
      return
    }
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    const canvas = canvasRef.current
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, 32, 32)
      ctx.drawImage(img, 0, 0, 32, 32)
      const label = count > 9 ? '9+' : String(count)
      ctx.beginPath()
      ctx.arc(26, 6, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#E32400'
      ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, 26, 7)
      link.href = canvas.toDataURL('image/png')
    }
    img.crossOrigin = 'anonymous'
    img.src = '/favicon.png'
  }
}

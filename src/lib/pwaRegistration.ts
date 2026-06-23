import { Workbox } from 'workbox-window'

export function registerPWA() {
  if (!('serviceWorker' in navigator)) return

  const wb = new Workbox('/sw.js')

  wb.addEventListener('waiting', () => {
    wb.messageSW({ type: 'SKIP_WAITING' })
  })

  wb.addEventListener('controlling', () => {
    window.location.reload()
  })

  wb.register()
}

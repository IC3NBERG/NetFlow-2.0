import { Workbox } from 'workbox-window'

export function registerPWA() {
  if (!('serviceWorker' in navigator)) return

  const wb = new Workbox('/sw.js')

  // Quando un nuovo SW è pronto, forziamo l'attivazione saltando la fase "waiting"
  wb.addEventListener('waiting', () => {
    wb.messageSW({ type: 'SKIP_WAITING' })
  })

  // Appena il nuovo SW prende il controllo, forziamo il reload della pagina
  wb.addEventListener('controlling', () => {
    window.location.reload()
  })

  wb.register()

  // Controlliamo periodicamente la presenza di nuove versioni del service worker (ogni 10 minuti)
  setInterval(() => {
    wb.update()
  }, 10 * 60 * 1000)

  // Registra un controllo immediato al caricamento
  window.addEventListener('load', () => {
    wb.update()
  })
}

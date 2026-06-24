import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Clock } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { useUserSettings } from '../../lib/hooks/useUserSettings'
import { useCreateNotification } from '../../lib/hooks/useNotifications'

export function BackupReminder() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: settings } = useUserSettings()
  const createNotif = useCreateNotification()

  useEffect(() => {
    if (settings?.notifications_enabled === false) return

    const raw = localStorage.getItem('backup-reminder-dismissed')
    const lastDismissed = raw ? Number(raw) : null
    const intervalMs = (settings?.backup_reminder_interval_days ?? 7) * 24 * 60 * 60 * 1000
    const shouldShow = !lastDismissed
      || !Number.isFinite(lastDismissed)
      || Date.now() - lastDismissed > intervalMs

    if (shouldShow) {
      const timer = setTimeout(() => setOpen(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [settings?.notifications_enabled, settings?.backup_reminder_interval_days])

  const dismiss = useCallback((snoozeDays?: number) => {
    if (snoozeDays) {
      const snoozeMs = snoozeDays * 24 * 60 * 60 * 1000
      localStorage.setItem('backup-reminder-dismissed', String(Date.now() + snoozeMs))
    } else {
      localStorage.setItem('backup-reminder-dismissed', String(Date.now()))
    }
    setOpen(false)
  }, [])

  async function handleGoToSettings() {
    const raw = localStorage.getItem('backup-reminder-dismissed')
    const lastDismissed = raw ? Number(raw) : null
    if (lastDismissed && !isNaN(lastDismissed)) {
      const daysSince = Math.floor((Date.now() - lastDismissed) / 86400000)
      await createNotif.mutateAsync({
        category: 'backup',
        title: 'Backup eseguito',
        message: `Hai gestito il backup dopo ${daysSince} giorni`,
        link: '/settings',
        icon: 'Download',
        metadata: { source: 'backup_navigate', days_since_backup: daysSince },
      })
    }
    dismiss()
    navigate('/settings')
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => dismiss()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-surface rounded-modal p-6 w-full max-w-md shadow-2xl"
          >
            <button
              onClick={() => dismiss()}
              className="absolute right-4 top-4 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F59E0B]/20">
                <Download className="h-7 w-7 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Backup consigliato</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  È passato un po' di tempo dall'ultimo backup.
                  Esporta i tuoi dati per tenerli al sicuro.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Button onClick={handleGoToSettings} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Vai alle impostazioni
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => dismiss(1)} className="flex-1 text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    Ricorda tra 1 giorno
                  </Button>
                  <Button variant="secondary" onClick={() => dismiss(3)} className="flex-1 text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    Ricorda tra 3 giorni
                  </Button>
                </div>
                <button
                  onClick={() => dismiss()}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  Più tardi
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

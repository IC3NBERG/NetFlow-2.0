import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from './Button'
import { useUserSettings } from '../../lib/hooks/useUserSettings'

export function BackupReminder() {
  const [open, setOpen] = useState(false)
  const { data: settings } = useUserSettings()

  useEffect(() => {
    if (settings?.notifications_enabled === false) return

    const raw = localStorage.getItem('backup-reminder-dismissed')
    const lastDismissed = raw ? Number(raw) : null
    const shouldShow = !lastDismissed
      || !Number.isFinite(lastDismissed)
      || Date.now() - lastDismissed > 7 * 24 * 60 * 60 * 1000
    if (shouldShow) {
      const timer = setTimeout(() => setOpen(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [settings?.notifications_enabled])

  function dismiss() {
    localStorage.setItem('backup-reminder-dismissed', String(Date.now()))
    setOpen(false)
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
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-surface rounded-modal p-6 w-full max-w-md shadow-2xl"
          >
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F59E0B]/20">
                <AlertTriangle className="h-7 w-7 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Backup consigliato</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  È passata più di una settimana dal tuo ultimo backup.
                  Esporta i tuoi dati per tenerli al sicuro.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={dismiss}>
                  Più tardi
                </Button>
                <Button onClick={() => { window.location.href = '/settings'; dismiss() }}>
                  Vai alle impostazioni
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

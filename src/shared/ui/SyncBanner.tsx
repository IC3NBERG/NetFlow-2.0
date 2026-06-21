import { motion, AnimatePresence } from 'framer-motion'
import { useSync, useSyncStatus } from '../../app/providers/SyncProvider'
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'

export function SyncBanner() {
  const { isOnline, queueLength, isSyncing } = useSync()
  const { status, conflictCount, clearConflict } = useSyncStatus()

  if (status === 'conflict') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed left-1/2 top-4 z-[999] -translate-x-1/2 rounded-full px-4 md:px-5 py-1.5 md:py-2 shadow-lg backdrop-blur-md border bg-[#F59E0B]/20 border-[#F59E0B]/30 text-[#F59E0B]"
        >
          <div className="flex items-center gap-2 md:gap-3 text-[11px] md:text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Conflitto di sincronizzazione rilevato ({conflictCount})</span>
            <button type="button" onClick={clearConflict} className="underline text-xs">
              Ignora
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  if (isOnline && queueLength === 0 && !isSyncing && status !== 'error') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
          className={`fixed left-1/2 top-4 z-[999] -translate-x-1/2 rounded-full px-4 md:px-5 py-1.5 md:py-2 shadow-lg backdrop-blur-md border ${
          status === 'error'
            ? 'bg-expense/20 border-expense/30 text-expense'
            : isOnline
              ? 'bg-success/20 border-success/30 text-success'
              : 'bg-expense/20 border-expense/30 text-expense'
        }`}
      >
        <div className="flex items-center gap-2 md:gap-3 text-[11px] md:text-sm">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>
                {status === 'error'
                  ? 'Sincronizzazione fallita — controlla Impostazioni'
                  : isSyncing
                    ? 'Sincronizzazione in corso...'
                    : queueLength > 0
                      ? `${queueLength} modifiche in attesa di sincronizzazione`
                      : 'Connessione ripristinata'}
              </span>
              {isSyncing && <RefreshCw className="h-4 w-4 animate-spin" />}
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="hidden sm:inline">Offline — Le modifiche verranno sincronizzate al ritorno della connessione</span>
              <span className="sm:hidden">Offline — Modifiche in coda</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

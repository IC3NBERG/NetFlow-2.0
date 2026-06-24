import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { openDB, type IDBPDatabase } from 'idb'
import { supabase } from '../../lib/supabase'
import type { SyncQueueItem } from '../../types/metrics'
import { generateId } from '../../lib/utils'
import { registerSyncHandlers, setSyncEnabled } from '../../lib/syncBridge'

export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error'

interface SyncContextValue {
  isOnline: boolean
  queueLength: number
  isSyncing: boolean
  failedCount: number
  conflictCount: number
  syncStatus: SyncStatus
  enqueue: (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'max_retries'>) => Promise<void>
  forceSync: () => Promise<void>
  clearConflict: () => void
}

const SyncContext = createContext<SyncContextValue | null>(null)

const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000]

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB('fintrack-sync', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

function buildSyncUrl(table: string, operation: SyncQueueItem['operation'], recordId?: string): string {
  const base = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}`
  if (operation === 'insert') return base
  if (!recordId) throw new Error(`record_id required for ${operation}`)
  return `${base}?id=eq.${recordId}`
}

function deriveSyncStatus(isSyncing: boolean, failedCount: number, conflictCount: number): SyncStatus {
  if (isSyncing) return 'syncing'
  if (conflictCount > 0) return 'conflict'
  if (failedCount > 0) return 'error'
  return 'idle'
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queueLength, setQueueLength] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [failedCount, setFailedCount] = useState(0)
  const [conflictCount, setConflictCount] = useState(0)

  const syncStatus = useMemo(
    () => deriveSyncStatus(isSyncing, failedCount, conflictCount),
    [isSyncing, failedCount, conflictCount],
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateQueueLength = useCallback(async () => {
    const db = await getDb()
    const count = await db.count('queue')
    setQueueLength(count)
  }, [])

  useEffect(() => {
    updateQueueLength()
  }, [updateQueueLength])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const { data } = await supabase
        .from('user_settings')
        .select('sync_enabled')
        .eq('user_id', session.user.id)
        .maybeSingle()
      setSyncEnabled(data?.sync_enabled ?? true)
    })
  }, [])

  const enqueue = useCallback(async (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'max_retries'>) => {
    const db = await getDb()
    await db.add('queue', {
      ...item,
      id: generateId(),
      timestamp: Date.now(),
      retries: 0,
      max_retries: 5,
    })
    await updateQueueLength()
  }, [updateQueueLength])

  useEffect(() => {
    registerSyncHandlers({ enqueue })
  }, [enqueue])

  const processQueue = useCallback(async () => {
    if (!navigator.onLine) return
    setIsSyncing(true)
    let failed = 0
    let conflicts = 0
    try {
      const db = await getDb()
      const allItems = await db.getAll('queue')
      allItems.sort((a, b) => a.timestamp - b.timestamp)

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const baseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      for (const item of allItems) {
        if (item.retries > 0) {
          const delay = BACKOFF_MS[Math.min(item.retries - 1, BACKOFF_MS.length - 1)]
          await new Promise((r) => setTimeout(r, delay))
        }

        try {
          const url = buildSyncUrl(item.table, item.operation, item.record_id)
          const payload = { ...item.payload }
          const jobIds = payload.__job_ids as string[] | undefined
          delete payload.__job_ids

          const response = await fetch(url, {
            method: item.operation === 'insert' ? 'POST'
              : item.operation === 'update' ? 'PATCH'
              : 'DELETE',
            headers: {
              ...baseHeaders,
              Prefer: item.operation === 'insert' ? 'return=representation' : 'return=minimal',
            },
            body: item.operation !== 'delete' ? JSON.stringify(payload) : undefined,
          })

          if (response.status === 409) {
            conflicts += 1
            await db.delete('queue', item.id)
            continue
          }

          if (!response.ok) throw new Error(`HTTP ${response.status}`)

          if (item.operation === 'insert' && jobIds?.length && item.table === 'invoices') {
            const rows = await response.json() as Array<{ id: string }>
            const invoiceId = rows[0]?.id
            if (invoiceId) {
              for (const job_id of jobIds) {
                const linkRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/invoice_jobs`, {
                  method: 'POST',
                  headers: { ...baseHeaders, Prefer: 'return=minimal' },
                  body: JSON.stringify({ invoice_id: invoiceId, job_id }),
                })
                if (!linkRes.ok) throw new Error(`HTTP ${linkRes.status} linking job`)
              }
            }
          }

          await db.delete('queue', item.id)
        } catch {
          item.retries += 1
          if (item.retries >= item.max_retries) {
            await db.delete('queue', item.id)
            failed += 1
            console.error(`Sync failed for ${item.table}/${item.id} after ${item.retries} retries`)
          } else {
            await db.put('queue', item)
          }
        }
      }

      if (failed > 0) setFailedCount((c) => c + failed)
      if (conflicts > 0) setConflictCount((c) => c + conflicts)

      await updateQueueLength()
    } finally {
      setIsSyncing(false)
    }
  }, [updateQueueLength])

  useEffect(() => {
    if (isOnline && queueLength > 0 && !isSyncing) {
      processQueue()
    }
  }, [isOnline, queueLength, isSyncing, processQueue])

  useEffect(() => {
    if (isOnline && queueLength === 0 && !isSyncing && syncStatus !== 'error') {
      const hadOffline = sessionStorage.getItem('was_offline')
      if (hadOffline === 'true') {
        import('../../lib/notificationService').then(({ createNotification }) => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session?.user) return
            supabase
              .from('user_settings')
              .select('notification_preferences, notifications_enabled')
              .eq('user_id', session.user.id)
              .single()
              .then(({ data: s }) => {
                if (!s?.notifications_enabled) return
                const prefs = (s.notification_preferences ?? {}) as Record<string, boolean>
                if (!prefs.sync) return
                createNotification({
                  category: 'sync',
                  title: 'Sincronizzazione completata',
                  message: 'Tutti i dati sono stati sincronizzati con successo.',
                  link: '/settings',
                  icon: 'RefreshCw',
                  metadata: { source: 'sync_reconnect' },
                }).catch(() => {})
              })
          })
        })
      }
    }
    if (!isOnline) {
      sessionStorage.setItem('was_offline', 'true')
    }
  }, [isOnline, queueLength, isSyncing, syncStatus])

  async function forceSync() {
    if (isOnline) await processQueue()
  }

  function clearConflict() {
    setConflictCount(0)
  }

  return (
    <SyncContext.Provider value={{
      isOnline, queueLength, isSyncing, failedCount, conflictCount, syncStatus,
      enqueue, forceSync, clearConflict,
    }}>
      {children}
    </SyncContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}

/** @see DEBUG_AND_REPAIR.md §3.3 */
// eslint-disable-next-line react-refresh/only-export-components
export function useSyncStatus() {
  const ctx = useSync()
  return {
    status: ctx.syncStatus,
    isOnline: ctx.isOnline,
    queueLength: ctx.queueLength,
    failedCount: ctx.failedCount,
    conflictCount: ctx.conflictCount,
    clearConflict: ctx.clearConflict,
  }
}

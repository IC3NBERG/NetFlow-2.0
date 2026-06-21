import type { SyncQueueItem } from '../types/metrics'

type EnqueueFn = (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'max_retries'>) => Promise<void>

let enqueueFn: EnqueueFn | null = null
let syncEnabled = true

export function registerSyncHandlers(handlers: { enqueue: EnqueueFn; syncEnabled?: boolean }) {
  enqueueFn = handlers.enqueue
  if (handlers.syncEnabled !== undefined) syncEnabled = handlers.syncEnabled
}

export function setSyncEnabled(enabled: boolean) {
  syncEnabled = enabled
}

export function isSyncEnabled(): boolean {
  return syncEnabled
}

export function getEnqueue(): EnqueueFn | null {
  return enqueueFn
}

export class OfflineQueuedError extends Error {
  constructor() {
    super('OFFLINE_QUEUED')
    this.name = 'OfflineQueuedError'
  }
}

export function isOfflineQueued(err: unknown): err is OfflineQueuedError {
  return err instanceof OfflineQueuedError
}

import { getEnqueue, isSyncEnabled, OfflineQueuedError, isOfflineQueued } from './syncBridge'
import type { SyncQueueItem } from '../types/metrics'

export { isOfflineQueued }

type QueueItem = Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'max_retries'>

export class OfflineSyncDisabledError extends Error {
  constructor() {
    super('OFFLINE_SYNC_DISABLED')
    this.name = 'OfflineSyncDisabledError'
  }
}

export function isOfflineSyncDisabled(err: unknown): err is OfflineSyncDisabledError {
  return err instanceof OfflineSyncDisabledError
}

export async function executeWithSync<T>(
  item: QueueItem,
  onlineExecute: () => Promise<T>,
): Promise<T> {
  const enqueue = getEnqueue()

  if (!navigator.onLine) {
    if (!isSyncEnabled()) {
      throw new OfflineSyncDisabledError()
    }
    if (enqueue) {
      await enqueue(item)
      throw new OfflineQueuedError()
    }
  }

  try {
    return await onlineExecute()
  } catch (err) {
    if (!navigator.onLine && isSyncEnabled() && enqueue) {
      await enqueue(item)
      throw new OfflineQueuedError()
    }
    throw err
  }
}

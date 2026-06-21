import type { QueryClient } from '@tanstack/react-query'

export async function hardResetPwa(queryClient: QueryClient): Promise<void> {
  queryClient.invalidateQueries()

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
    await registration.update()
  }

  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map((name) => caches.delete(name)))

  window.location.reload()
}

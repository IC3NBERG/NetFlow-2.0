import { useEffect } from 'react'
import { supabase } from '../supabase'

export function useNotificationCleanup() {
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      try {
        await supabase.rpc('cleanup_notifications', { p_older_than_days: 30 })
      } catch {
        // silent cleanup
      }
    })()
  }, [])
}

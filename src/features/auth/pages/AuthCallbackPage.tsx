import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { PageLoader } from '../../../shared/ui/PageLoader'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.auth.signOut()
      }
      navigate('/login', { replace: true })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        supabase.auth.signOut()
        navigate('/login', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return <PageLoader />
}

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setStatus('error')
      }
    }, 10000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      if (session) {
        supabase.auth.signOut()
      }
      setStatus('success')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        clearTimeout(timeout)
        supabase.auth.signOut()
        setStatus('success')
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Conferma in corso...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="space-y-6 text-center p-6 md:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/20">
            {status === 'success' ? (
              <CheckCircle className="h-7 w-7 text-success" />
            ) : (
              <span className="text-3xl">⚠️</span>
            )}
          </div>

          {status === 'success' ? (
            <>
              <h1 className="text-2xl font-bold">Email confermata!</h1>
              <p className="text-text-secondary">
                Il tuo account è stato attivato con successo.
                Puoi chiudere questa finestra ed effettuare il login
                nella pagina che hai già aperto.
              </p>
              <Button variant="primary" onClick={() => navigate('/login', { replace: true })}>
                Vai al login
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Qualcosa è andato storto</h1>
              <p className="text-text-secondary">
                Il link di conferma non è valido o è scaduto.
                Prova a registrarti di nuovo.
              </p>
              <Button variant="primary" onClick={() => navigate('/register', { replace: true })}>
                Registrati
              </Button>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

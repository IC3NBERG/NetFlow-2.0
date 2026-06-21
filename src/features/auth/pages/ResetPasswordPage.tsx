import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase'
import { updatePasswordSchema, type UpdatePasswordFormData } from '../../../lib/validations'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Loader2, CheckCircle } from 'lucide-react'
import { Logo } from '../../../shared/ui/Logo'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  })

  useEffect(() => {
    let cancelled = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!cancelled && event === 'PASSWORD_RECOVERY') {
        setIsReady(true)
      }
    })

    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!cancelled) {
          if (session) {
            setIsReady(true)
          } else {
            setError('Link di recupero non valido o scaduto.')
          }
        }
      })
    } else {
      setError('Nessun token di recupero trovato. Usa il link ricevuto via email.')
    }

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function onSubmit(data: UpdatePasswordFormData) {
    setIsSubmitting(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })
    if (updateError) {
      setError(updateError.message)
    } else {
      setIsSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    }
    setIsSubmitting(false)
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="space-y-6 text-center p-6 md:p-8">
            <div className="mx-auto flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full bg-success/20">
              <CheckCircle className="h-5 md:h-7 w-5 md:w-7 text-success" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">Password aggiornata</h1>
            <p className="text-xs md:text-sm text-text-secondary">
              La tua password è stata reimpostata con successo. Verrai reindirizzato al login...
            </p>
          </Card>
        </motion.div>
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
        <Card className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            <Logo variant="full" className="mb-4 h-10 w-10 md:h-14 md:w-14" />
            <h1 className="text-xl md:text-2xl font-bold">Nuova password</h1>
            <p className="mt-1 text-xs md:text-sm text-text-secondary">
              Scegli una nuova password per il tuo account
            </p>
          </div>

          {!isReady && !error && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          )}

          {error && (
            <div className="rounded-card bg-expense/10 border border-expense/20 px-4 py-3 text-sm text-expense">
              {error}
            </div>
          )}

          {isReady && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                id="password"
                type="password"
                label="Nuova password"
                placeholder="Min. 8 caratteri"
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                id="confirmPassword"
                type="password"
                label="Conferma password"
                placeholder="Ripeti la password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Aggiornamento in corso...' : 'Aggiorna password'}
              </Button>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

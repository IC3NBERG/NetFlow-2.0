import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase'
import { resetPasswordSchema, type ResetPasswordFormData } from '../../../lib/validations'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Logo } from '../../../shared/ui/Logo'

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  async function onSubmit(data: ResetPasswordFormData) {
    setIsSubmitting(true)
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (resetError) {
      setError(resetError.message)
    } else {
      setIsSuccess(true)
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
            <div className="mx-auto flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full bg-brand/20">
              <MailCheck className="h-5 md:h-7 w-5 md:w-7 text-brand" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">Email inviata</h1>
            <p className="text-xs md:text-sm text-text-secondary">
              Se l'indirizzo email è registrato, riceverai un messaggio con le istruzioni per reimpostare la password.
            </p>
            <Link to="/login">
              <Button variant="secondary">Torna al login</Button>
            </Link>
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
            <h1 className="text-xl md:text-2xl font-bold">Recupera password</h1>
            <p className="mt-1 text-xs md:text-sm text-text-secondary">
              Inserisci la tua email per ricevere il link di reset
            </p>
          </div>

          {error && (
            <div className="rounded-card bg-expense/10 border border-expense/20 px-4 py-3 text-sm text-expense">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="nome@esempio.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Invio in corso...' : 'Invia link di recupero'}
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            <Link to="/login" className="inline-flex items-center gap-1 text-brand font-medium hover:underline">
              <ArrowLeft className="h-3 w-3" />
              Torna al login
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}

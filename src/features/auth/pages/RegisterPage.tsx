import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../../app/providers/AuthProvider'
import { registerSchema, type RegisterFormData } from '../../../lib/validations'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { UserPlus, MailCheck } from 'lucide-react'
import { Logo } from '../../../shared/ui/Logo'

export function RegisterPage() {
  const { signUp, error } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterFormData) {
    setIsSubmitting(true)
    try {
      await signUp(data.email, data.password)
      setIsSuccess(true)
    } catch {
      // error is set in AuthProvider
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/20">
              <MailCheck className="h-7 w-7 text-success" />
            </div>
            <h1 className="text-2xl font-bold">Verifica la tua email</h1>
            <p className="text-text-secondary">
              Ti abbiamo inviato un messaggio di conferma. Clicca sul link nella email per attivare il tuo account.
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
        <Card className="space-y-5 md:space-y-6 p-5 md:p-8">
          <div className="text-center">
            <div className="mx-auto mb-3 md:mb-4">
              <Logo variant="full" className="h-10 w-10 md:h-14 md:w-14" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">Crea il tuo account</h1>
            <p className="mt-1 text-xs md:text-sm text-text-secondary">
              Registrati per iniziare a tracciare le tue finanze
            </p>
          </div>

          {error && (
            <div className="rounded-card bg-expense/10 border border-expense/20 px-4 py-3 text-sm text-expense">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="text"
              placeholder="Nome completo"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              type="email"
              placeholder="Email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              type="password"
              placeholder="Password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              type="password"
              placeholder="Conferma password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button className="w-full" size="lg" disabled={isSubmitting}>
              <UserPlus className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Registrazione in corso...' : 'Registrati'}
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Hai già un account?{' '}
            <Link to="/login" className="text-brand hover:underline">
              Accedi
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}

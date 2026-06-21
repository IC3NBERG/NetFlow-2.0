import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../../app/providers/AuthProvider'
import { loginSchema, type LoginFormData } from '../../../lib/validations'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { LogIn } from 'lucide-react'
import { Logo } from '../../../shared/ui/Logo'

export function LoginPage() {
  const { signIn, error } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setIsSubmitting(true)
    try {
      await signIn(data.email, data.password)
    } catch {
      // error is set in AuthProvider
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="flex flex-col items-center text-center">
            <Logo variant="full" className="mb-3 md:mb-4 h-10 w-10 md:h-14 md:w-14" />
            <h1 className="text-xl md:text-2xl font-bold">Accedi a NetFlow</h1>
            <p className="mt-1 text-xs md:text-sm text-text-secondary">
              Inserisci le tue credenziali per continuare
            </p>
          </div>

          {error && (
            <div className="rounded-card bg-expense/10 border border-expense/20 px-4 py-3 text-sm text-expense">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="-mt-2 text-right">
              <Link to="/forgot-password" className="text-xs text-text-secondary hover:text-brand hover:underline">
                Password dimenticata?
              </Link>
            </div>

            <Button className="w-full" size="lg" disabled={isSubmitting}>
              <LogIn className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Non hai un account?{' '}
            <Link to="/register" className="text-brand hover:underline">
              Registrati
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}

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
import { Logo } from '../../../shared/ui/Logo'

export function LoginPage() {
  const { signIn, error } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setIsSubmitting(true)
    try {
      await signIn(data.email, data.password, rememberMe)
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
        <Card className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            <Logo variant="full" className="mb-4 h-10 w-10 md:h-14 md:w-14" />
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="nome@esempio.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="Inserisci la password"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-surface text-brand focus:ring-brand/50
                    focus:outline-none focus:ring-2 transition-colors cursor-pointer"
                />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  Resta connesso
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-text-secondary hover:text-brand hover:underline transition-colors"
              >
                Password dimenticata?
              </Link>
            </div>

            <Button className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Non hai un account?{' '}
            <Link to="/register" className="text-brand font-medium hover:underline">
              Registrati
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}

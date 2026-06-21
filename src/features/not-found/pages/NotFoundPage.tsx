import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <Card className="space-y-5 md:space-y-6 p-5 md:p-8">
          <div className="mx-auto flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-full bg-brand/10">
            <span className="text-2xl md:text-4xl font-bold text-brand">404</span>
          </div>
          <h1 className="text-lg md:text-2xl font-bold">Pagina non trovata</h1>
          <p className="text-xs md:text-sm text-text-secondary">
            La pagina che stai cercando non esiste o è stata spostata.
          </p>
          <Link to="/dashboard">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Torna alla dashboard
            </Button>
          </Link>
        </Card>
      </motion.div>
    </div>
  )
}

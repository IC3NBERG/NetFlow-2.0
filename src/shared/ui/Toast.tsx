import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = 'info', onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 200)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }

  const Icon = icons[type]

  const colors = {
    success: 'border-success text-success',
    error: 'border-expense text-expense',
    info: 'border-brand text-brand',
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            'fixed z-50 flex items-center gap-3 rounded-card border border-border bg-surface px-4 md:px-5 py-2.5 md:py-3 shadow-lg',
            'bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-auto',
            colors[type],
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <p className="text-sm text-text-primary">{message}</p>
          <button onClick={onClose} className="ml-2 text-text-secondary hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

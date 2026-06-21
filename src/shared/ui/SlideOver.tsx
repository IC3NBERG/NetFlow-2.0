import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function SlideOver({ open, onClose, title, children }: SlideOverProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-full md:max-w-lg h-full rounded-none md:rounded-modal overflow-y-auto bg-surface/60 backdrop-blur-xl border-l border-border"
            style={{
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-surface/70 backdrop-blur-sm border-b border-border"
              style={{
                borderRadius: '1rem 0 0 0',
              }}
            >
              {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
              {!title && <div />}
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-text-secondary hover:bg-black/5 hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 md:px-6 py-4 md:py-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

import { type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface FormSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        'mb-8 rounded-2xl border border-white/5 bg-surface/30 p-6 shadow-sm backdrop-blur-md',
        'transition-all duration-200 hover:bg-surface/40',
        className,
      )}
    >
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-base font-semibold text-text-primary tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-5">{children}</div>
    </div>
  )
}

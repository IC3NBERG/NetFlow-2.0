import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          'rounded-card p-6',
          variant === 'default' && 'bg-surface',
          variant === 'surface' && 'bg-surface/60 backdrop-blur-3xl border border-white/[0.08]',
          className,
        )}
      {...props}
    >
      {children}
    </div>
  ),
)
Card.displayName = 'Card'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, hover = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-card bg-surface/60 backdrop-blur-3xl shadow-2xl shadow-black/30',
        'transition-all duration-300 ease-out',
        hover && 'hover:bg-surface/80 hover:scale-[1.01]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
GlassCard.displayName = 'GlassCard'

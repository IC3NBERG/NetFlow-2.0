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
        'border border-white/[0.06]',
        'transition-all duration-300 ease-out',
        hover && 'hover:bg-surface/80 hover:scale-[1.01] hover:shadow-[0_8px_40px_rgba(108,92,231,0.08)] hover:border-white/[0.12]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
GlassCard.displayName = 'GlassCard'

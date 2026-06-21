import { type VariantProps, cva } from 'class-variance-authority'
import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        success: 'bg-success/20 text-success',
        warning: 'bg-[#F59E0B]/20 text-[#F59E0B]',
        danger: 'bg-expense/20 text-expense',
        info: 'bg-brand/20 text-brand',
        neutral: 'bg-surface text-text-secondary border border-border',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}

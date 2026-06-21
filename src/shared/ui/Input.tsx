import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-input border px-4 py-3 min-h-[48px] bg-surface text-text-primary placeholder:text-text-secondary/50',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
          'transition-all duration-200 border-border',
          error && 'border-expense focus:ring-expense',
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-expense">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'

import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  showPasswordToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, showPasswordToggle, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const canToggle = isPassword && showPasswordToggle !== false
    const inputType = canToggle && showPassword ? 'text' : type

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={inputType}
            className={cn(
              'w-full rounded-input border bg-surface px-4 py-3 min-h-[48px]',
              'text-text-primary placeholder:text-text-secondary/50',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              error
                ? 'border-expense focus:ring-expense/50'
                : 'border-border focus:ring-brand/50',
              canToggle && 'pr-12',
              className,
            )}
            {...props}
          />
          {canToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'text-text-secondary/60 hover:text-text-primary',
                'transition-colors duration-200',
                'p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-brand/50',
              )}
              tabIndex={-1}
              aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-expense">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

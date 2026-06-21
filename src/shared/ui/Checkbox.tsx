import { cn } from '../../lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function Checkbox({ checked, onCheckedChange, className }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onCheckedChange(!checked) }}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all',
        checked
          ? 'border-brand bg-brand text-white'
          : 'border-border bg-surface hover:border-brand/50',
        className,
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  )
}

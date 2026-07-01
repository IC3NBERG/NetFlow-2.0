import { cn } from '../../lib/utils'

interface LogoProps {
  variant?: 'icon' | 'full'
  className?: string
}

export function Logo({ variant = 'icon', className }: LogoProps) {
  if (variant === 'full') {
    return (
      <img
        src="/logo-icon.png"
        alt="NetFlow"
        className={cn('h-14 w-14 object-contain rounded-2xl', className)}
      />
    )
  }

  return (
    <img
      src="/logo.jpg"
      alt="NetFlow"
      className={cn('h-10 w-10 object-contain rounded-xl', className)}
    />
  )
}

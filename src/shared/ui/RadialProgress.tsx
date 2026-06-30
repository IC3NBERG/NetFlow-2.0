import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface RadialProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  className?: string
  bgColor?: string
  hideLabel?: boolean
}

export function RadialProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = '#C5963A',
  label,
  className,
  bgColor = 'var(--color-border)',
  hideLabel = false,
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value / max, 0), 1)
  const offset = circumference * (1 - progress)

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {!hideLabel && (
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold font-mono tracking-tight">
            {Math.round(progress * 100)}%
          </span>
          {label && <span className="text-xs text-text-secondary">{label}</span>}
        </div>
      )}
    </div>
  )
}

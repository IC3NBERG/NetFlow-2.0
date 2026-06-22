import { type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  illustration?: ReactNode
  action?: ReactNode
  className?: string
}

function DefaultIllustration() {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Background Soft Blob */}
      <circle
        cx="100"
        cy="100"
        r="80"
        fill="url(#blobGradient)"
        opacity="0.15"
      />
      {/* Abstract Rounded Rectangles */}
      <rect
        x="60"
        y="70"
        width="80"
        height="50"
        rx="16"
        fill="url(#rectGradient1)"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="2"
      />
      <rect
        x="75"
        y="90"
        width="70"
        height="60"
        rx="16"
        fill="url(#rectGradient2)"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="2"
        className="opacity-80"
      />
      
      {/* Small floating accents */}
      <circle cx="150" cy="60" r="8" fill="url(#blobGradient)" opacity="0.3" />
      <circle cx="50" cy="140" r="12" fill="url(#rectGradient2)" opacity="0.2" />

      <defs>
        <radialGradient id="blobGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(90) scale(80)">
          <stop stopColor="#6C5CE7" />
          <stop offset="1" stopColor="#00D2FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rectGradient1" x1="60" y1="70" x2="140" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6C5CE7" stopOpacity="0.3" />
          <stop offset="1" stopColor="#00D2FF" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="rectGradient2" x1="75" y1="90" x2="145" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00D2FF" stopOpacity="0.3" />
          <stop offset="1" stopColor="#6C5CE7" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function EmptyState({
  title,
  description,
  illustration,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500',
        'bg-surface/60 backdrop-blur-xl rounded-2xl',
        className,
      )}
    >
      <div className="mb-6 text-brand/80">
        {illustration || <DefaultIllustration />}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-text-primary">
        {title}
      </h3>
      {description && (
        <p className="mb-8 max-w-sm text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

import { useLocation } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'

export type NavDirection = 'forward' | 'backward'

export function useNavigationDirection(): NavDirection {
  const location = useLocation()
  const [direction, setDirection] = useState<NavDirection>('forward')
  const stackRef = useRef<string[]>([])

  useEffect(() => {
    const path = location.pathname
    const prevPath = stackRef.current[stackRef.current.length - 1]

    if (prevPath === path) return

    const pathIndex = stackRef.current.indexOf(path)

    if (pathIndex !== -1) {
      setDirection('backward')
      stackRef.current = stackRef.current.slice(0, pathIndex + 1)
    } else {
      setDirection('forward')
      stackRef.current.push(path)
    }
  }, [location.pathname])

  return direction
}

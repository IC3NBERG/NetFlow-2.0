import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Theme } from '../../types/database'
import { useCustomizationStore } from '../../lib/stores/customization'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function hexToRgb(hex: string): string {
  const cleanHex = hex.replace(/^#/, '')
  const bigint = parseInt(cleanHex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r} ${g} ${b}`
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { brandColor, successColor, expenseColor } = useCustomizationStore()
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('fintrack-theme') as Theme | null
    return stored ?? 'system'
  })

  useEffect(() => {
    const brandRgb = hexToRgb(brandColor)
    const successRgb = hexToRgb(successColor)
    const expenseRgb = hexToRgb(expenseColor)

    let styleEl = document.getElementById('custom-theme-colors')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'custom-theme-colors'
      document.head.appendChild(styleEl)
    }

    styleEl.innerHTML = `
      :root, .dark {
        --color-brand: ${brandRgb};
        --color-success: ${successRgb};
        --color-expense: ${expenseRgb};
      }
    `
  }, [brandColor, successColor, expenseColor])

  useEffect(() => {
    localStorage.setItem('fintrack-theme', theme)

    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const root = document.documentElement
      if (mediaQuery.matches) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
      }
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: 'rgb(var(--color-brand) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          alt: 'rgb(var(--color-surface-alt) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        pending: 'rgb(var(--color-pending) / <alpha-value>)',
        expense: 'rgb(var(--color-expense) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        },
      },
      borderRadius: {
        card: '1.5rem',
        modal: '2rem',
        input: '1rem',
      },
      borderColor: {
        border: 'rgba(var(--color-border))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float-slow': 'float-slow 25s ease-in-out infinite',
        'float-medium': 'float-medium 20s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 8s ease-in-out infinite',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(40px, -30px) rotate(1deg)' },
          '66%': { transform: 'translate(-20px, 40px) rotate(-1deg)' },
        },
        'float-medium': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(-30px, 20px) rotate(1deg)' },
          '75%': { transform: 'translate(30px, -20px) rotate(-1deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config

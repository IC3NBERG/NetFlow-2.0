import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-xl font-semibold text-text-primary">Si è verificato un errore</h1>
          <p className="max-w-md text-sm text-text-secondary">{this.state.message || 'Errore imprevisto nell\'applicazione.'}</p>
          <Button onClick={() => window.location.reload()}>Ricarica pagina</Button>
        </div>
      )
    }
    return this.props.children
  }
}

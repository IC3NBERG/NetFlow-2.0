import { Button } from './Button'

export function QueryLoading({ message = 'Caricamento...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
    </div>
  )
}

export function QueryError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
      <p className="text-lg font-semibold text-expense">Errore nel caricamento</p>
      <p className="max-w-md text-sm text-text-secondary">
        {message ?? 'Impossibile recuperare i dati. Verifica la connessione e riprova.'}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Riprova
        </Button>
      )}
    </div>
  )
}

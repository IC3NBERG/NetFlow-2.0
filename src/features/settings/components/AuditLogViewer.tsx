import { useAuditLog } from '../../../lib/hooks/useAuditLog'
import { QueryLoading } from '../../../shared/ui/QueryState'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const tableLabels: Record<string, string> = {
  jobs: 'Lavoro',
  invoices: 'Fattura',
  clients: 'Cliente',
  expenses: 'Spesa',
  quotes: 'Preventivo',
}

const operationIcons: Record<string, string> = {
  INSERT: '🟢',
  UPDATE: '🔵',
  DELETE: '🔴',
}

export function AuditLogViewer() {
  const { data: logs, isLoading } = useAuditLog()

  if (isLoading) return <QueryLoading />

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-secondary">Nessuna modifica registrata</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 rounded-xl bg-surface/60 px-4 py-3">
          <span className="text-sm mt-0.5">{operationIcons[log.operation]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {tableLabels[log.table_name] || log.table_name}
              {log.operation === 'INSERT' ? ' creato' : log.operation === 'DELETE' ? ' eliminato' : ' modificato'}
            </p>
            <p className="text-xs text-text-secondary">
              {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: it })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

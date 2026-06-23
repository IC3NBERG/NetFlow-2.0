import { useState } from 'react'
import { useAuditLog } from '../../../lib/hooks/useAuditLog'
import { QueryLoading } from '../../../shared/ui/QueryState'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { AuditLog } from '../../../types/database'

const tableLabels: Record<string, string> = {
  jobs: 'Lavoro',
  invoices: 'Fattura',
  clients: 'Cliente',
  expenses: 'Spesa',
  quotes: 'Preventivo',
}

function getActionLabel(tableName: string, operation: string) {
  const isFeminine = tableName === 'invoices' || tableName === 'expenses'
  if (operation === 'INSERT') return isFeminine ? 'creata' : 'creato'
  if (operation === 'DELETE') return isFeminine ? 'eliminata' : 'eliminato'
  return isFeminine ? 'modificata' : 'modificato'
}

function getRecordIdentifier(log: AuditLog) {
  const data = log.new_data || log.old_data
  if (!data) return ''
  if (log.table_name === 'invoices') {
    return data.invoice_number ? `N. ${data.invoice_number}` : ''
  }
  if (log.table_name === 'quotes') {
    const num = data.quote_number ? `N. ${data.quote_number}` : ''
    const title = data.title ? ` (${data.title})` : ''
    return `${num}${title}`
  }
  return String(data.title || data.name || '')
}

export function AuditLogViewer() {
  const { data: logs, isLoading } = useAuditLog()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) return <QueryLoading />

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-secondary/70">Nessuna modifica registrata</p>
      </div>
    )
  }

  return (
    <div className="relative pl-4 border-l-2 border-border/40 space-y-6 max-h-[500px] overflow-y-auto pr-2 py-2">
      {logs.map((log) => {
        const identifier = getRecordIdentifier(log)
        const label = tableLabels[log.table_name] || log.table_name
        const action = getActionLabel(log.table_name, log.operation)
        const isExpanded = expandedId === log.id

        return (
          <div key={log.id} className="relative group">
            {/* Timeline node icon */}
            <div className={cn(
              "absolute -left-[27px] top-1.5 flex h-6.5 w-6.5 items-center justify-center rounded-full border-2 border-surface shadow-md transition-all duration-200",
              log.operation === 'INSERT' && "bg-success/15 text-success border-success/30",
              log.operation === 'UPDATE' && "bg-brand/15 text-brand border-brand/30",
              log.operation === 'DELETE' && "bg-expense/15 text-expense border-expense/30"
            )}>
              {log.operation === 'INSERT' && <Plus className="h-3.5 w-3.5" />}
              {log.operation === 'UPDATE' && <Pencil className="h-3.5 w-3.5" />}
              {log.operation === 'DELETE' && <Trash2 className="h-3.5 w-3.5" />}
            </div>

            <div className="flex flex-col gap-1 rounded-xl bg-surface/50 border border-border/40 hover:border-border/80 px-4 py-3 transition-all duration-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    <span className="font-semibold">{label}</span>{' '}
                    <span className={cn(
                      log.operation === 'INSERT' && "text-success",
                      log.operation === 'UPDATE' && "text-brand",
                      log.operation === 'DELETE' && "text-expense"
                    )}>
                      {action}
                    </span>
                    {identifier && (
                      <span className="text-text-secondary/90 font-normal">
                        : <span className="font-medium text-text-primary/90">{identifier}</span>
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-secondary/70 mt-0.5">
                    {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: it })}
                  </p>
                </div>
                
                {log.operation === 'UPDATE' && (log.old_data || log.new_data) && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="p-1 rounded-lg hover:bg-text-secondary/10 text-text-secondary transition-colors"
                    title="Vedi modifiche"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {isExpanded && log.operation === 'UPDATE' && (
                <div className="mt-2 text-xs border-t border-border/30 pt-2 space-y-1 text-text-secondary/80">
                  <p className="font-semibold text-text-primary/70 mb-1">Dettagli modifiche:</p>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto bg-surface-alt/50 p-2 rounded-lg border border-border/20">
                    {Object.keys(log.new_data || {}).map((key) => {
                      const oldVal = log.old_data?.[key]
                      const newVal = log.new_data?.[key]
                      if (JSON.stringify(oldVal) === JSON.stringify(newVal) || key === 'updated_at') return null
                      return (
                        <div key={key} className="flex flex-wrap gap-1 items-baseline">
                          <span className="font-mono text-[10px] text-brand/80 font-bold mr-1">{key}:</span>
                          <span className="line-through text-expense/80">{oldVal === null ? 'null' : String(oldVal)}</span>
                          <span className="text-text-secondary/60">→</span>
                          <span className="text-success font-medium">{newVal === null ? 'null' : String(newVal)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

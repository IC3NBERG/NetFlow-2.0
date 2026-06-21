import { Input } from '../../../shared/ui/Input'
import type { LedgerFilters as Filters } from '../../../lib/hooks/useLedgerData'
import type { PaymentMethod, JobStatus } from '../../../types/database'

interface LedgerFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

const methods: { value: PaymentMethod | 'all'; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'card', label: 'Carta' },
  { value: 'cash', label: 'Contanti' },
  { value: 'mixed', label: 'Misto' },
]

const statuses: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'completed_settled', label: 'Incassati' },
  { value: 'completed_pending', label: 'In attesa' },
  { value: 'all', label: 'Tutti' },
]

export function LedgerFilters({ filters, onChange }: LedgerFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-3 md:gap-4 items-stretch md:items-end">
      <div className="flex-1 min-w-[150px] md:min-w-[200px]">
        <Input
          placeholder="Cerca cliente o lavoro..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="flex gap-2 md:gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] md:text-xs text-text-secondary">Da</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="rounded-input border border-border bg-surface px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] md:text-xs text-text-secondary">A</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="rounded-input border border-border bg-surface px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] md:text-xs text-text-secondary">Metodo</label>
          <select
            value={filters.method}
            onChange={(e) => onChange({ ...filters, method: e.target.value as PaymentMethod | 'all' })}
            className="rounded-input border border-border bg-surface px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {methods.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] md:text-xs text-text-secondary">Stato</label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value as JobStatus | 'all' })}
            className="rounded-input border border-border bg-surface px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

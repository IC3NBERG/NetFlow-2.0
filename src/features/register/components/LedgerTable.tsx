import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { Badge } from '../../../shared/ui/Badge'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { formatCurrency } from '../../../lib/calculations'
import { formatDate } from '../../../lib/utils'
import type { LedgerEntry } from '../../../lib/hooks/useLedgerData'

interface LedgerTableProps {
  entries: LedgerEntry[]
  onViewDetail?: (entry: LedgerEntry) => void
}

type SortKey = 'start_date' | 'amount_card' | 'client_name' | 'payment_method'
type SortDir = 'asc' | 'desc'

const methodLabels: Record<string, string> = {
  card: 'Carta',
  cash: 'Contanti',
  mixed: 'Misto',
}

const statusLabels: Record<string, string> = {
  active: 'Attivo',
  completed_pending: 'In attesa',
  completed_settled: 'Incassato',
}

const statusColors: Record<string, 'info' | 'warning' | 'success'> = {
  active: 'info',
  completed_pending: 'warning',
  completed_settled: 'success',
}

export function LedgerTable({ entries, onViewDetail }: LedgerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('start_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const perPage = 10

  const sorted = useMemo(() => {
    const copy = [...entries]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'start_date':
          cmp = a.start_date.localeCompare(b.start_date)
          break
        case 'amount_card': {
          const aTotal = a.amount_card + (a.include_cash_in_invoice ? a.amount_cash : 0)
          const bTotal = b.amount_card + (b.include_cash_in_invoice ? b.amount_cash : 0)
          cmp = aTotal - bTotal
          break
        }
        case 'client_name':
          cmp = (a.client_name ?? '').localeCompare(b.client_name ?? '')
          break
        case 'payment_method':
          cmp = a.payment_method.localeCompare(b.payment_method)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [entries, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const paged = sorted.slice(page * perPage, (page + 1) * perPage)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  function SortIcon({ columnKey }: { columnKey: SortKey }) {
    if (sortKey !== columnKey) return null
    return sortDir === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Nessun risultato"
        description="Nessun risultato trovato"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-card">
        <table className="w-full text-left text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th
                className="cursor-pointer px-4 md:px-6 py-3 md:py-4 font-medium hover:text-text-primary transition-colors"
                onClick={() => toggleSort('start_date')}
              >
                Data <SortIcon columnKey="start_date" />
              </th>
              <th
                className="hidden md:table-cell cursor-pointer px-6 py-4 font-medium hover:text-text-primary transition-colors"
                onClick={() => toggleSort('client_name')}
              >
                Cliente <SortIcon columnKey="client_name" />
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 font-medium">Lavoro</th>
              <th
                className="hidden md:table-cell cursor-pointer px-6 py-4 font-medium hover:text-text-primary transition-colors"
                onClick={() => toggleSort('payment_method')}
              >
                Metodo <SortIcon columnKey="payment_method" />
              </th>
              <th
                className="cursor-pointer px-4 md:px-6 py-3 md:py-4 font-medium text-right hover:text-text-primary transition-colors"
                onClick={() => toggleSort('amount_card')}
              >
                Importo <SortIcon columnKey="amount_card" />
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 font-medium text-center">Stato</th>
              {onViewDetail && <th className="px-4 md:px-6 py-3 md:py-4" />}
            </tr>
          </thead>
          <motion.tbody variants={container} initial="hidden" animate="show">
            {paged.map((entry) => {
              const total = entry.amount_card + (entry.include_cash_in_invoice ? entry.amount_cash : 0)
              return (
                <motion.tr
                  key={entry.id}
                  variants={item}
                  className="border-b border-border/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => onViewDetail && onViewDetail(entry)}
                >
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    {formatDate(entry.start_date)}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-text-primary font-medium">
                    {entry.client_name ?? '—'}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 max-w-[120px] md:max-w-[200px] truncate">{entry.title}</td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    {methodLabels[entry.payment_method] ?? entry.payment_method}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-right font-mono tabular-nums">
                    {formatCurrency(total)}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                    <Badge variant={statusColors[entry.status] ?? 'info'}>
                      {statusLabels[entry.status] ?? entry.status}
                    </Badge>
                  </td>
                  {onViewDetail && (
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(entry)}
                        className="h-8 w-8 md:h-9 md:w-9"
                      >
                        <Eye className="h-3.5 md:h-4 w-3.5 md:w-4" />
                      </Button>
                    </td>
                  )}
                </motion.tr>
              )
            })}
          </motion.tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs md:text-sm text-text-secondary">
        <p className="hidden md:block">
          Pagina {page + 1} di {totalPages} ({sorted.length} risultati)
        </p>
        <p className="md:hidden">
          {page + 1}/{totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="text-xs px-2 md:px-3"
          >
            Precedente
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs px-2 md:px-3"
          >
            Successiva
          </Button>
        </div>
      </div>
    </div>
  )
}

import { useCallback, useState } from 'react'
import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { useLedgerData } from '../../../lib/hooks/useLedgerData'
import { LedgerStats } from '../components/LedgerStats'
import { LedgerTable } from '../components/LedgerTable'
import { LedgerFilters } from '../components/LedgerFilters'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { SlideOver } from '../../../shared/ui/SlideOver'
import { Badge } from '../../../shared/ui/Badge'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { formatCurrency } from '../../../lib/calculations'
import { formatDate } from '../../../lib/utils'
import { exportToCSV, exportToJSON } from '../../../lib/export'
import type { LedgerEntry } from '../../../lib/hooks/useLedgerData'

const methodLabels: Record<string, string> = {
  card: 'Carta',
  cash: 'Contanti',
  mixed: 'Misto',
}

export function RegisterPage() {
  const { entries, metrics, filters, setFilters, isLoading } = useLedgerData()
  const [detailEntry, setDetailEntry] = useState<LedgerEntry | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleExportCSV = useCallback(() => {
    exportToCSV(entries)
    setShowExportMenu(false)
  }, [entries])

  const handleExportJSON = useCallback(() => {
    exportToJSON(entries)
    setShowExportMenu(false)
  }, [entries])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Registro</h2>
          <p className="text-xs md:text-sm text-text-secondary">Storico completo dei lavori incassati</p>
        </div>
        <div className="relative">
          <Button onClick={() => setShowExportMenu((v) => !v)}>
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-card bg-surface border border-border shadow-2xl overflow-hidden z-10">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-surface/80 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#00B894]" />
                CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-surface/80 transition-colors"
              >
                <FileJson className="h-4 w-4 text-brand" />
                JSON
              </button>
            </div>
          )}
        </div>
      </div>

      <LedgerStats metrics={metrics} />

      <GlassCard className="p-3 md:p-4">
        <LedgerFilters filters={filters} onChange={setFilters} />
      </GlassCard>

      {isLoading ? (
        <GlassCard className="flex items-center justify-center py-12">
          <p className="text-text-secondary">Caricamento...</p>
        </GlassCard>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nessun risultato"
          description="Nessun lavoro corrisponde ai filtri selezionati"
        />
      ) : (
        <GlassCard className="p-2 md:p-4">
          <LedgerTable entries={entries} onViewDetail={setDetailEntry} />
        </GlassCard>
      )}

      <SlideOver
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        title="Dettaglio lavoro"
      >
        {detailEntry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <p className="text-[10px] md:text-xs text-text-secondary">Cliente</p>
                <p className="text-xs md:text-sm font-medium">{detailEntry.client_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-text-secondary">Data</p>
                <p className="text-xs md:text-sm font-medium">{formatDate(detailEntry.start_date)}</p>
              </div>
              <div className="md:col-span-1">
                <p className="text-[10px] md:text-xs text-text-secondary">Metodo pagamento</p>
                <p className="text-xs md:text-sm font-medium">
                  {methodLabels[detailEntry.payment_method] ?? detailEntry.payment_method}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-text-secondary">Stato</p>
                <Badge variant={detailEntry.status === 'completed_settled' ? 'success' : 'warning'}>
                  {detailEntry.status === 'completed_settled' ? 'Incassato' : 'In attesa'}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-[10px] md:text-xs text-text-secondary">Titolo</p>
              <p className="text-xs md:text-sm font-medium">{detailEntry.title}</p>
            </div>

            {detailEntry.description && (
              <div>
                <p className="text-xs text-text-secondary">Descrizione</p>
                <p className="text-text-secondary">{detailEntry.description}</p>
              </div>
            )}

            <div className="border-t border-border pt-3 md:pt-4">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <p className="text-[10px] md:text-xs text-text-secondary">Importo carta</p>
                  <p className="font-mono font-medium tabular-nums text-xs md:text-sm">{formatCurrency(detailEntry.amount_card)}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-text-secondary">Importo contanti</p>
                  <p className="font-mono font-medium tabular-nums text-xs md:text-sm">{formatCurrency(detailEntry.amount_cash)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] md:text-xs text-text-secondary">Includi contanti in fattura</p>
                  <p className="text-xs md:text-sm font-medium">{detailEntry.include_cash_in_invoice ? 'Sì' : 'No'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] md:text-xs text-text-secondary">Totale</p>
                  <p className="font-mono tabular-nums text-base md:text-lg font-bold text-brand">
                    {formatCurrency(
                      detailEntry.amount_card +
                        (detailEntry.include_cash_in_invoice ? detailEntry.amount_cash : 0),
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}

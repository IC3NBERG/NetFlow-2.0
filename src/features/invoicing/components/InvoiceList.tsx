import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Toast } from '../../../shared/ui/Toast'
import { InvoiceQRCode } from '../../../shared/ui/InvoiceQRCode'
import { formatCurrency } from '../../../lib/calculations'
import { cn } from '../../../lib/utils'
import { useAuth } from '../../../app/providers/AuthProvider'
import { generateInvoicePdf } from '../../../lib/pdfInvoice'
import { CheckCircle, Send, FileText, Download, QrCode, Loader2 } from 'lucide-react'
import type { Invoice, Job, Client } from '../../../types/database'

interface InvoiceListProps {
  invoices: Invoice[]
  onMarkAsPaid: (id: string) => void
  onMarkAsSent: (id: string) => void
  relatedJobs: (invoiceId: string) => Job[]
  clients: Client[]
}

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null

const statusConfig = {
  draft: { label: 'Bozza', color: 'bg-pending/20 text-pending' },
  sent: { label: 'Inviata', color: 'bg-brand/20 text-brand' },
  paid: { label: 'Pagata', color: 'bg-success/20 text-success' },
}

const filters = [
  { id: 'all' as const, label: 'Tutte' },
  { id: 'draft' as const, label: 'Bozze' },
  { id: 'sent' as const, label: 'Inviate' },
  { id: 'paid' as const, label: 'Pagate' },
]

export function InvoiceList({ invoices, onMarkAsPaid, onMarkAsSent, relatedJobs, clients }: InvoiceListProps) {
  const { user } = useAuth()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [qrVisibleId, setQrVisibleId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | Invoice['status']>('all')

  async function handleDownloadPdf(inv: Invoice) {
    setDownloadingId(inv.id)
    try {
      const jobs = relatedJobs(inv.id)
      const firstJob = jobs[0]
      const client = firstJob?.client_id
        ? clients.find((c) => c.id === firstJob.client_id) ?? null
        : null
      const goalData = user?.goal_data && typeof user.goal_data === 'object' ? user.goal_data as { invoice_footer?: string; iban?: string } : null
      const blob = await generateInvoicePdf({
        type: inv.type as 'invoice' | 'parcella',
        invoiceNumber: inv.invoice_number,
        issuedDate: new Date(inv.issued_date).toLocaleDateString('it-IT'),
        dueDate: inv.due_date ? new Date(inv.due_date).toLocaleDateString('it-IT') : null,
        jobs: jobs.map((j) => ({ title: j.title, amount_card: j.amount_card, amount_cash: j.amount_cash })),
        client: client ? { name: client.name, address: client.address, vat_number: client.vat_number, fiscal_code: client.fiscal_code } : null,
        profile: {
          business_name: user?.business_name ?? null,
          full_name: user?.full_name ?? null,
          address: user?.address ?? null,
          vat_number: user?.vat_number ?? null,
          fiscal_code: user?.fiscal_code ?? null,
          logo_url: user?.logo_url ?? null,
        },
        grossAmount: inv.gross_amount,
        taxAmount: inv.tax_amount,
        netAmount: inv.net_amount,
        footer: goalData?.invoice_footer ?? undefined,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${inv.invoice_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setToast({ message: 'PDF scaricato con successo', type: 'success' })
    } catch (err) {
      console.error('PDF generation failed:', err)
      setToast({ message: 'Errore generazione PDF', type: 'error' })
    } finally {
      setDownloadingId(null)
    }
  }

  if (invoices.length === 0) return null

  const filteredInvoices = invoices.filter((inv) => {
    if (activeFilter !== 'all' && inv.status !== activeFilter) return false
    return true
  })

  return (
    <div className="space-y-4 pt-4 border-t border-border/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold">Documenti generati</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-all border shrink-0',
                activeFilter === filter.id
                  ? 'border-brand bg-brand/10 text-brand shadow-sm shadow-brand/5'
                  : 'border-border/60 bg-surface/50 text-text-secondary hover:border-brand/40 hover:text-text-primary',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/60 rounded-card bg-surface/20">
          <p className="text-sm text-text-secondary">Nessun documento corrisponde a questo filtro.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredInvoices.map((inv) => {
              const status = statusConfig[inv.status]
              const linkedJobs = relatedJobs(inv.id)
              const isPaid = inv.status === 'paid'
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                <GlassCard
                  className={cn(
                    "relative p-4 flex flex-col justify-between min-h-[175px] transition-all duration-300 h-full",
                    isPaid
                      ? "border border-success/30 shadow-sm shadow-success/5 bg-success/[0.02]"
                      : "border border-border/40"
                  )}
                >
                {isPaid && (
                  <div className="absolute top-2 right-2 flex items-center justify-center h-5 w-5 rounded-full bg-success/20 text-success shadow-sm">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <FileText className={cn("h-4 w-4 shrink-0", isPaid ? "text-success" : "text-brand")} />
                        <span className="font-bold text-sm truncate">{inv.invoice_number}</span>
                      </div>
                      <span className={cn('inline-block mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase', status.color)}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-base font-bold font-mono tabular-nums", isPaid ? "text-success" : "text-text-primary")}>
                        {formatCurrency(inv.net_amount)}
                      </p>
                      <p className="text-[10px] text-text-secondary font-mono mt-0.5">Lordo: {formatCurrency(inv.gross_amount)}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-text-secondary space-y-1 border-t border-border/30 pt-2.5">
                    <div className="flex justify-between">
                      <span>Emissione:</span>
                      <span className="font-medium text-text-primary">{new Date(inv.issued_date).toLocaleDateString('it-IT')}</span>
                    </div>
                    {inv.type === 'parcella' && (
                      <div className="flex justify-between">
                        <span>Tipo:</span>
                        <span className="font-semibold text-text-primary capitalize">Parcella</span>
                      </div>
                    )}
                    {linkedJobs.length > 0 && (
                      <div className="flex justify-between">
                        <span>Dettaglio:</span>
                        <span className="font-medium text-text-primary truncate max-w-[120px]">
                          {linkedJobs.length} lavoro{linkedJobs.length > 1 ? 'i' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4 border-t border-border/30 pt-2.5">
                  <Button size="sm" variant="ghost" className="text-[10px] h-7 px-2.5 border border-border/40 hover:bg-surface-alt" onClick={() => handleDownloadPdf(inv)} disabled={downloadingId === inv.id}>
                    {downloadingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    <span>PDF</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[10px] h-7 px-2.5 border border-border/40 hover:bg-surface-alt" onClick={() => setQrVisibleId(qrVisibleId === inv.id ? null : inv.id)}>
                    <QrCode className="h-3 w-3" />
                    <span>QR</span>
                  </Button>
                  {inv.status === 'draft' && (
                    <Button size="sm" variant="secondary" className="text-[10px] h-7 px-3 text-brand" onClick={() => onMarkAsSent(inv.id)}>
                      <Send className="mr-1 h-3 w-3" />
                      Invia
                    </Button>
                  )}
                  {(inv.status === 'draft' || inv.status === 'sent') && (
                    <Button size="sm" className="text-[10px] h-7 px-3" onClick={() => onMarkAsPaid(inv.id)}>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Paga
                    </Button>
                  )}
                </div>

                {qrVisibleId === inv.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/90 backdrop-blur-sm rounded-card">
                    <div className="scale-75 origin-center">
                      <InvoiceQRCode
                        invoiceNumber={inv.invoice_number}
                        grossAmount={inv.gross_amount}
                        iban={user?.goal_data && typeof user.goal_data === 'object' ? (user.goal_data as { iban?: string }).iban : undefined}
                        creditorName={user?.business_name ?? user?.full_name ?? undefined}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 p-1 h-7 w-7"
                      onClick={() => setQrVisibleId(null)}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </GlassCard>
              </motion.div>
            )
          })}
          </motion.div>
        </AnimatePresence>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

import { useState } from 'react'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Toast } from '../../../shared/ui/Toast'
import { InvoiceQRCode } from '../../../shared/ui/InvoiceQRCode'
import { formatCurrency } from '../../../lib/calculations'
import { cn } from '../../../lib/utils'
import { useAuth } from '../../../app/providers/AuthProvider'
import { generateInvoicePdf } from '../../../lib/pdfInvoice'
import { CheckCircle, Send, FileText, Download, QrCode, Loader2 } from 'lucide-react'
import type { Invoice, Job } from '../../../types/database'

interface InvoiceListProps {
  invoices: Invoice[]
  onMarkAsPaid: (id: string) => void
  onMarkAsSent: (id: string) => void
  relatedJobs: (invoiceId: string) => Job[]
}

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null

const statusConfig = {
  draft: { label: 'Bozza', color: 'bg-pending/20 text-pending' },
  sent: { label: 'Inviata', color: 'bg-brand/20 text-brand' },
  paid: { label: 'Pagata', color: 'bg-success/20 text-success' },
}

export function InvoiceList({ invoices, onMarkAsPaid, onMarkAsSent, relatedJobs }: InvoiceListProps) {
  const { user } = useAuth()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [qrVisibleId, setQrVisibleId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  async function handleDownloadPdf(inv: Invoice) {
    setDownloadingId(inv.id)
    try {
      const jobs = relatedJobs(inv.id)
      const blob = await generateInvoicePdf({
        type: inv.type as 'invoice' | 'parcella',
        invoiceNumber: inv.invoice_number,
        issuedDate: new Date(inv.issued_date).toLocaleDateString('it-IT'),
        dueDate: inv.due_date ? new Date(inv.due_date).toLocaleDateString('it-IT') : null,
        jobs: jobs.map((j) => ({ title: j.title, amount_card: j.amount_card, amount_cash: j.amount_cash })),
        client: null,
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
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${inv.invoice_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setToast({ message: 'PDF scaricato con successo', type: 'success' })
    } catch {
      setToast({ message: 'Errore generazione PDF', type: 'error' })
    } finally {
      setDownloadingId(null)
    }
  }

  if (invoices.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Documenti generati</h3>
      <div className="grid grid-cols-1 gap-2 md:gap-3 md:grid-cols-2">
        {invoices.map((inv) => {
          const status = statusConfig[inv.status]
          const linkedJobs = relatedJobs(inv.id)
          return (
            <GlassCard key={inv.id} className="p-4 md:p-5 space-y-2 md:space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <FileText className="h-3.5 md:h-4 w-3.5 md:w-4 text-brand shrink-0" />
                    <span className="font-semibold text-sm md:text-base truncate">{inv.invoice_number}</span>
                  </div>
                  <span className={cn('inline-block mt-1 rounded-full px-2 md:px-3 py-0.5 text-[10px] md:text-xs font-medium', status.color)}>
                    {status.label}
                  </span>
                </div>
                <p className="text-base md:text-lg font-bold font-mono tabular-nums shrink-0">{formatCurrency(inv.net_amount)}</p>
              </div>
              <div className="text-[10px] md:text-xs text-text-secondary space-y-0.5 md:space-y-1">
                <p>Emissione: {new Date(inv.issued_date).toLocaleDateString('it-IT')}</p>
                {inv.due_date && <p className="hidden sm:block">Scadenza: {new Date(inv.due_date).toLocaleDateString('it-IT')}</p>}
                {inv.type === 'parcella' && <p className="capitalize">Parcella</p>}
              </div>
              {linkedJobs.length > 0 && (
                <div className="border-t border-border pt-2">
                  <p className="text-xs text-text-secondary mb-1">Lavori:</p>
                  {linkedJobs.map((j) => (
                    <p key={j.id} className="text-xs truncate">{j.title}</p>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 md:gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => handleDownloadPdf(inv)} disabled={downloadingId === inv.id}>
                  {downloadingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  PDF
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setQrVisibleId(qrVisibleId === inv.id ? null : inv.id)}>
                  <QrCode className="h-3 w-3" />
                  QR
                </Button>
                {inv.status === 'draft' && (
                  <Button size="sm" variant="secondary" onClick={() => onMarkAsSent(inv.id)}>
                    <Send className="mr-1 h-3 w-3" />
                    Invia
                  </Button>
                )}
                {(inv.status === 'draft' || inv.status === 'sent') && (
                  <Button size="sm" onClick={() => onMarkAsPaid(inv.id)}>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Paga
                  </Button>
                )}
              </div>
              {qrVisibleId === inv.id && (
                <div className="border-t border-border pt-3 flex justify-center">
                  <InvoiceQRCode invoiceNumber={inv.invoice_number} grossAmount={inv.gross_amount} />
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

import type { LedgerEntry } from './hooks/useLedgerData'

function totalGross(j: LedgerEntry): number {
  return j.amount_card + (j.include_cash_in_invoice ? j.amount_cash : 0)
}

export function exportToCSV(entries: LedgerEntry[]): void {
  const headers = ['Data', 'Cliente', 'Lavoro', 'Metodo Pagamento', 'Carta', 'Contanti', 'Includi Contanti', 'Totale', 'Stato']
  const rows = entries.map((j) => [
    j.start_date,
    j.client_name ?? '',
    j.title,
    j.payment_method,
    j.amount_card,
    j.amount_cash,
    j.include_cash_in_invoice ? 'Sì' : 'No',
    totalGross(j),
    j.status,
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `registro-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToJSON(entries: LedgerEntry[]): void {
  const data = entries.map((j) => ({
    date: j.start_date,
    client: j.client_name ?? null,
    title: j.title,
    payment_method: j.payment_method,
    amount_card: j.amount_card,
    amount_cash: j.amount_cash,
    net_amount: j.net_amount ?? 0,
    include_cash_in_invoice: j.include_cash_in_invoice,
    total: totalGross(j),
    status: j.status,
  }))

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `registro-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

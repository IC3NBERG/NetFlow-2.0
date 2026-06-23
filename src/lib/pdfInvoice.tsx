import { pdf, Document } from '@react-pdf/renderer'
import { InvoiceDocument } from '../shared/ui/InvoiceDocument'
import type { Job, Client, Profile } from '../types/database'

interface InvoiceDocumentProps {
  type: 'invoice' | 'parcella'
  invoiceNumber: string
  issuedDate: string
  dueDate: string | null
  jobs: Pick<Job, 'title' | 'amount_card' | 'amount_cash'>[]
  client: Pick<Client, 'name' | 'address' | 'vat_number' | 'fiscal_code'> | null
  profile: Pick<Profile, 'business_name' | 'full_name' | 'address' | 'vat_number' | 'fiscal_code' | 'logo_url'> | null
  grossAmount: number
  taxAmount: number
  netAmount: number
  header?: string
  footer?: string
}

export async function generateInvoicePdf(data: InvoiceDocumentProps): Promise<Blob> {
  const doc = <Document><InvoiceDocument {...data} /></Document>
  const instance = pdf(doc)
  const blob = await instance.toBlob()
  return blob
}

import { pdf, Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import type { Job, Client, Profile } from '../types/database'

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Inter', fontSize: 10, color: '#1A1A2E' },
  header: { marginBottom: 32 },
  logo: { width: 80, height: 80, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#636E72', marginBottom: 2 },
  divider: { borderBottom: '1px solid #E0E0E0', marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  label: { fontSize: 8, color: '#636E72', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 11, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #E0E0E0', paddingVertical: 8, fontSize: 8, color: '#636E72', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #F0F0F0', paddingVertical: 8, fontSize: 10 },
  colDesc: { flex: 3 },
  colAmount: { flex: 1, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 6 },
  totalLabel: { fontSize: 10, marginRight: 40 },
  totalValue: { fontSize: 10, fontFamily: 'Inter', fontWeight: 700 },
  grandTotal: { fontSize: 14, fontWeight: 700, marginRight: 40 },
  grandTotalValue: { fontSize: 14, fontWeight: 700 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, fontSize: 8, color: '#A0A0B8', textAlign: 'center' },
})

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

function InvoiceDocument({ type, invoiceNumber, issuedDate, dueDate, jobs, client, profile, grossAmount, taxAmount, netAmount, header, footer }: InvoiceDocumentProps) {
  const fmt = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const typeLabel = type === 'invoice' ? 'FATTURA' : 'PARCELLA'
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.row}>
          <View style={styles.col}>
            {profile?.logo_url && <Image src={profile.logo_url} style={styles.logo} />}
            <Text style={styles.title}>{typeLabel}</Text>
            <Text style={styles.subtitle}>N. {invoiceNumber}</Text>
            <Text style={styles.subtitle}>Data: {issuedDate}</Text>
            {dueDate && <Text style={styles.subtitle}>Scadenza: {dueDate}</Text>}
          </View>
          <View style={[styles.col, { alignItems: 'flex-end' }]}>
            <Text style={styles.label}>Mittente</Text>
            <Text style={styles.value}>{profile?.business_name || profile?.full_name || ''}</Text>
            <Text style={styles.value}>{profile?.address}</Text>
            {profile?.vat_number && <Text style={styles.value}>P.IVA: {profile.vat_number}</Text>}
            {profile?.fiscal_code && <Text style={styles.value}>CF: {profile.fiscal_code}</Text>}
          </View>
        </View>
      </View>

      {header && <Text style={{ fontSize: 9, marginBottom: 12, color: '#636E72' }}>{header}</Text>}

      {client && (
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{client.name}</Text>
          {client.address && <Text style={styles.value}>{client.address}</Text>}
          {client.vat_number && <Text style={styles.value}>P.IVA: {client.vat_number}</Text>}
          {client.fiscal_code && <Text style={styles.value}>CF: {client.fiscal_code}</Text>}
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.tableHeader}>
        <Text style={styles.colDesc}>Descrizione</Text>
        <Text style={styles.colAmount}>Importo</Text>
      </View>

      {jobs.map((job, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.colDesc}>{job.title}</Text>
          <Text style={styles.colAmount}>€ {fmt(job.amount_card)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Imponibile</Text>
        <Text style={styles.totalValue}>€ {fmt(netAmount)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>IVA ({type === 'invoice' ? '22' : '0'}%)</Text>
        <Text style={styles.totalValue}>€ {fmt(taxAmount)}</Text>
      </View>
      <View style={[styles.totalRow, { marginTop: 8 }]}>
        <Text style={styles.grandTotal}>Totale {typeLabel}</Text>
        <Text style={styles.grandTotalValue}>€ {fmt(grossAmount)}</Text>
      </View>

      {footer && (
        <Text style={{ position: 'absolute', bottom: 80, left: 40, right: 40, fontSize: 8, color: '#A0A0B8', textAlign: 'center' }}>
          {footer}
        </Text>
      )}

      <Text style={styles.footer}>Documento generato da NetFlow - Contabilità per professionisti</Text>
    </Page>
  )
}

export async function generateInvoicePdf(data: InvoiceDocumentProps): Promise<Blob> {
  const doc = <Document><InvoiceDocument {...data} /></Document>
  const instance = pdf(doc)
  const blob = await instance.toBlob()
  return blob
}

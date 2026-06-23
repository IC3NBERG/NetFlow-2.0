import { useEffect, useState } from 'react'
import QRCodeLib from 'qrcode'
import { Download } from 'lucide-react'
import { Button } from './Button'

interface InvoiceQRCodeProps {
  invoiceNumber: string
  grossAmount: number
  iban?: string
}

export function InvoiceQRCode({ invoiceNumber, grossAmount, iban }: InvoiceQRCodeProps) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    const paymentData = iban
      ? `RMT\n${iban}\n${grossAmount.toFixed(2).replace('.', ',')}\n${invoiceNumber}\n`
      : `Fattura: ${invoiceNumber}\nTotale: € ${grossAmount.toFixed(2)}`

    QRCodeLib.toDataURL(paymentData, {
      width: 180,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    }, (error, url) => {
      if (error) {
        console.error('QR Code generation error:', error)
        return
      }
      setDataUrl(url)
    })
  }, [invoiceNumber, grossAmount, iban])

  function handleDownload() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.download = `QR-${invoiceNumber}.png`
    a.href = dataUrl
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {dataUrl ? (
        <img src={dataUrl} alt={`QR Code ${invoiceNumber}`} className="rounded-xl bg-white p-2 w-[180px] h-[180px]" />
      ) : (
        <div className="w-[180px] h-[180px] rounded-xl bg-white/10 animate-pulse flex items-center justify-center text-xs text-text-secondary">
          Generazione QR...
        </div>
      )}
      {dataUrl && (
        <Button size="sm" variant="ghost" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" /> Scarica QR
        </Button>
      )}
    </div>
  )
}

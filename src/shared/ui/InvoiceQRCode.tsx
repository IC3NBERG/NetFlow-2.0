import { useEffect, useState } from 'react'
import QRCodeLib from 'qrcode'
import { Download } from 'lucide-react'
import { Button } from './Button'

interface InvoiceQRCodeProps {
  invoiceNumber: string
  grossAmount: number
  iban?: string
  creditorName?: string
}

export function InvoiceQRCode({ invoiceNumber, grossAmount, iban, creditorName }: InvoiceQRCodeProps) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
    const fmt = (n: number) => n.toFixed(2).replace('.', ',')
    const paymentData = iban
      ? `BCD\n001\n1\nSCT\n${iban}\n${creditorName ?? ''}\nEUR${fmt(grossAmount)}\n\n${invoiceNumber}\n`
      : `FATTURA: ${invoiceNumber}\nTOTALE: € ${fmt(grossAmount)}\nINTESTATARIO: ${creditorName ?? ''}\n`

    QRCodeLib.toString(paymentData, {
      type: 'svg',
      width: 180,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    }).then((svgStr: string) => {
      setSvg(svgStr)
    }).catch((err: Error) => {
      console.error('QR Code generation error:', err)
      setError(true)
    })
  }, [invoiceNumber, grossAmount, iban, creditorName])

  function handleDownload() {
    if (!svg) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.download = `QR-${invoiceNumber}.png`
      a.href = url
      a.click()
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {svg ? (
        <div
          className="rounded-xl bg-white p-2 w-[180px] h-[180px] flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : error ? (
        <div className="w-[180px] h-[180px] rounded-xl bg-white/10 flex items-center justify-center text-xs text-red-400 text-center px-2">
          Errore generazione QR
        </div>
      ) : (
        <div className="w-[180px] h-[180px] rounded-xl bg-white/10 animate-pulse flex items-center justify-center text-xs text-text-secondary">
          Generazione QR...
        </div>
      )}
      {svg && (
        <Button size="sm" variant="ghost" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" /> Scarica QR
        </Button>
      )}
    </div>
  )
}

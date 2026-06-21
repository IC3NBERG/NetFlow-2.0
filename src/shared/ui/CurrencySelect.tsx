import { SUPPORTED_CURRENCIES } from '../../lib/exchangeRate'

interface CurrencySelectProps {
  value: string
  onChange: (currency: string) => void
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>
      ))}
    </select>
  )
}

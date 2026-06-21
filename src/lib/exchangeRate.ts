const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/EUR'

const rateCache = new Map<string, { rate: number; timestamp: number }>()
const CACHE_TTL = 12 * 60 * 60 * 1000

export async function getExchangeRate(targetCurrency: string): Promise<number> {
  if (targetCurrency === 'EUR') return 1

  const cached = rateCache.get(targetCurrency)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rate
  }

  try {
    const res = await fetch(EXCHANGE_RATE_API)
    const data = await res.json()
    const rate = data.rates[targetCurrency]
    if (rate) {
      rateCache.set(targetCurrency, { rate, timestamp: Date.now() })
      return rate
    }
    return 1
  } catch {
    const stale = rateCache.get(targetCurrency)
    return stale?.rate ?? 1
  }
}

export function formatCurrencyWithSymbol(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string, rate: number): number {
  if (fromCurrency === toCurrency) return amount
  const inEur = fromCurrency === 'EUR' ? amount : amount / rate
  return toCurrency === 'EUR' ? inEur : inEur * rate
}

export const SUPPORTED_CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollaro USA' },
  { code: 'GBP', symbol: '£', label: 'Sterlina' },
  { code: 'CHF', symbol: 'CHF', label: 'Franco Svizzero' },
]

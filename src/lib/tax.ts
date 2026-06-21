import type { PaymentMethod, TaxRegime } from '../types/database'

/** DB/UI stores IRPEF as percentage (e.g. 30); tax math expects decimal (0.30). */
export function normalizeIrpefRate(rate?: number | null): number {
  if (rate == null) return 0.30
  return rate > 1 ? rate / 100 : rate
}

export function getTaxDeductionRate(regime: TaxRegime, customIrpefRate?: number | null): number {
  switch (regime) {
    case 'occasional':
      return 1 - (1 - 0.20) * (1 - 0.2572)
    case 'vat_flat': {
      const coefficient = 0.78
      const substituteTax = 0.15
      const inps = 0.2607
      return coefficient * (substituteTax + inps)
    }
    case 'vat_standard': {
      const irpef = normalizeIrpefRate(customIrpefRate)
      const inps = 0.2607
      return inps + (1 - inps) * irpef
    }
  }
}

export function computeJobNetAmount(
  card: number,
  cash: number,
  method: PaymentMethod,
  includeCashInInvoice: boolean,
  regime: TaxRegime,
  customIrpefRate?: number | null,
): number {
  if (method === 'card') return grossToNet(card, regime, customIrpefRate)
  if (method === 'cash') {
    return includeCashInInvoice ? grossToNet(cash, regime, customIrpefRate) : cash
  }
  const cardNet = card > 0 ? grossToNet(card, regime, customIrpefRate) : 0
  const cashNet = includeCashInInvoice && cash > 0
    ? grossToNet(cash, regime, customIrpefRate)
    : cash
  return Math.round((cardNet + cashNet) * 100) / 100
}

export function netToGross(net: number, regime: TaxRegime, customIrpefRate?: number | null): number {
  const rate = getTaxDeductionRate(regime, customIrpefRate)
  if (rate >= 1) return net
  return Math.round((net / (1 - rate)) * 100) / 100
}

export function grossToNet(gross: number, regime: TaxRegime, customIrpefRate?: number | null): number {
  const rate = getTaxDeductionRate(regime, customIrpefRate)
  return Math.round(gross * (1 - rate) * 100) / 100
}

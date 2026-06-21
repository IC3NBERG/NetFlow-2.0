import { useFiscalYearStore } from './stores/fiscalYear'

export function useFiscalYearRange(): { gte: string; lte: string; year: number } {
  const year = useFiscalYearStore((s) => s.year)
  return {
    year,
    gte: `${year}-01-01`,
    lte: `${year}-12-31`,
  }
}

export function getYearRange(year: number): { gte: string; lte: string } {
  return {
    gte: `${year}-01-01`,
    lte: `${year}-12-31`,
  }
}

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useFiscalYearStore } from '../../lib/stores/fiscalYear'

export function FiscalYearSelector() {
  const { year, setYear } = useFiscalYearStore()
  const currentYear = new Date().getFullYear()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setYear(year - 1)}
        className="rounded-full p-1 text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold tabular-nums min-w-[4rem] text-center">
        {year}
      </span>
      <button
        onClick={() => setYear(year + 1)}
        className="rounded-full p-1 text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all"
        disabled={year >= currentYear}
      >
        <ChevronRight className={`h-4 w-4 ${year >= currentYear ? 'opacity-30' : ''}`} />
      </button>
    </div>
  )
}

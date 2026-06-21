import { create } from 'zustand'

interface FiscalYearStore {
  year: number
  setYear: (year: number) => void
}

export const useFiscalYearStore = create<FiscalYearStore>((set) => ({
  year: new Date().getFullYear(),
  setYear: (year) => set({ year }),
}))

import { create } from 'zustand'

export interface CustomizationStore {
  sidebarOrder: string[]
  brandColor: string
  successColor: string
  expenseColor: string
  setSidebarOrder: (order: string[]) => void
  setColors: (colors: { brandColor?: string; successColor?: string; expenseColor?: string }) => void
  resetColors: () => void
}

const DEFAULT_SIDEBAR_ORDER = [
  '/dashboard',
  '/jobs',
  '/clients',
  '/quotes',
  '/invoicing',
  '/expenses',
  '/calendar',
  '/ledger',
]

export const useCustomizationStore = create<CustomizationStore>((set) => {
  const storedSidebar = localStorage.getItem('fintrack-sidebar-order')
  let sidebarOrder = DEFAULT_SIDEBAR_ORDER

  if (storedSidebar) {
    try {
      sidebarOrder = JSON.parse(storedSidebar)
    } catch {
      // Fallback to default
    }
  }

  const brandColor = localStorage.getItem('fintrack-color-brand') || '#6c5ce7'
  const successColor = localStorage.getItem('fintrack-color-success') || '#00b894'
  const expenseColor = localStorage.getItem('fintrack-color-expense') || '#ff6b6b'

  return {
    sidebarOrder,
    brandColor,
    successColor,
    expenseColor,
    setSidebarOrder: (order) => {
      localStorage.setItem('fintrack-sidebar-order', JSON.stringify(order))
      set({ sidebarOrder: order })
    },
    setColors: (colors) => {
      if (colors.brandColor !== undefined) {
        localStorage.setItem('fintrack-color-brand', colors.brandColor)
        set({ brandColor: colors.brandColor })
      }
      if (colors.successColor !== undefined) {
        localStorage.setItem('fintrack-color-success', colors.successColor)
        set({ successColor: colors.successColor })
      }
      if (colors.expenseColor !== undefined) {
        localStorage.setItem('fintrack-color-expense', colors.expenseColor)
        set({ expenseColor: colors.expenseColor })
      }
    },
    resetColors: () => {
      localStorage.removeItem('fintrack-color-brand')
      localStorage.removeItem('fintrack-color-success')
      localStorage.removeItem('fintrack-color-expense')
      set({
        brandColor: '#6c5ce7',
        successColor: '#00b894',
        expenseColor: '#ff6b6b',
      })
    },
  }
})

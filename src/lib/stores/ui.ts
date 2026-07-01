import { create } from 'zustand'

export type SidebarMode = 'full' | 'icons' | 'hidden'

interface UIStore {
  sidebarMode: SidebarMode
  sidebarDragWidth: number | null
  setSidebarMode: (mode: SidebarMode) => void
  setSidebarDragWidth: (width: number | null) => void
}

export const useUIStore = create<UIStore>((set) => {
  const stored = localStorage.getItem('fintrack-sidebar-mode') as SidebarMode | null
  const initialMode: SidebarMode =
    stored === 'full' || stored === 'icons' || stored === 'hidden' ? stored : 'full'

  return {
    sidebarMode: initialMode,
    sidebarDragWidth: null,
    setSidebarMode: (mode) => {
      localStorage.setItem('fintrack-sidebar-mode', mode)
      set({ sidebarMode: mode })
    },
    setSidebarDragWidth: (width) => set({ sidebarDragWidth: width }),
  }
})

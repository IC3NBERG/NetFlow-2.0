import { create } from 'zustand'

export type SidebarMode = 'full' | 'icons' | 'hidden'

interface UIStore {
  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void
  cycleSidebarMode: () => void
}

export const useUIStore = create<UIStore>((set) => {
  const stored = localStorage.getItem('fintrack-sidebar-mode') as SidebarMode | null
  const initialMode: SidebarMode =
    stored === 'full' || stored === 'icons' || stored === 'hidden' ? stored : 'full'

  return {
    sidebarMode: initialMode,
    setSidebarMode: (mode) => {
      localStorage.setItem('fintrack-sidebar-mode', mode)
      set({ sidebarMode: mode })
    },
    cycleSidebarMode: () => {
      set((state) => {
        const next = state.sidebarMode === 'full' ? 'icons' : state.sidebarMode === 'icons' ? 'hidden' : 'full'
        localStorage.setItem('fintrack-sidebar-mode', next)
        return { sidebarMode: next }
      })
    },
  }
})

import { create } from 'zustand'

export type JobTab = 'general' | 'card' | 'cash' | 'mixed'
export type JobFilter = 'all' | 'active' | 'completed_pending' | 'completed_settled'

interface JobsUIStore {
  activeTab: JobTab
  activeFilter: JobFilter
  isFormOpen: boolean
  editingJobId: string | null
  setActiveTab: (tab: JobTab) => void
  setActiveFilter: (filter: JobFilter) => void
  openForm: (jobId?: string) => void
  closeForm: () => void
}

export const useJobsUIStore = create<JobsUIStore>((set) => ({
  activeTab: 'general',
  activeFilter: 'all',
  isFormOpen: false,
  editingJobId: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  openForm: (jobId) => set({ isFormOpen: true, editingJobId: jobId ?? null }),
  closeForm: () => set({ isFormOpen: false, editingJobId: null }),
}))

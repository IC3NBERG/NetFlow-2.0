import type { DashboardModule, DashboardModuleId } from '../types/database'

export const DEFAULT_DASHBOARD_LAYOUT: DashboardModule[] = [
  { id: 'kpi-group', order: 0, visible: true },
  { id: 'charts', order: 1, visible: true },
  { id: 'progress-rings', order: 2, visible: true },
  { id: 'bar-chart', order: 3, visible: true },
]

const MODULE_PRIORITY: Record<DashboardModuleId, number> = {
  'kpi-group': 0,
  charts: 1,
  'progress-rings': 2,
  'bar-chart': 3,
  'quick-register': 4,
}

export function resolveDashboardLayout(layout: DashboardModule[] | null | undefined): DashboardModule[] {
  const source = layout?.length ? layout : DEFAULT_DASHBOARD_LAYOUT
  const seen = new Set<DashboardModuleId>()
  const normalized = [...source]
    .map((m) => ({
      ...m,
      id: normalizeModuleId(m.id),
    }))
    .filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })

  if (normalized.some((m) => m.id === 'charts') && !normalized.some((m) => m.id === 'bar-chart')) {
    normalized.push({ id: 'bar-chart', order: 99, visible: true })
  }

  return normalized.sort((a, b) => MODULE_PRIORITY[a.id] - MODULE_PRIORITY[b.id])
}

function normalizeModuleId(id: DashboardModuleId | 'goal-tracker'): DashboardModuleId {
  if (id === 'goal-tracker') return 'progress-rings'
  return id
}

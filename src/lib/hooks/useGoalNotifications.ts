import { useEffect } from 'react'
import { useDashboardData } from '../../features/dashboard/hooks/useDashboardData'
import { useUserSettings } from './useUserSettings'
import { useNotifications } from './useNotifications'
import { createNotification } from '../notificationService'

const MILESTONES = [50, 80, 100]

export function useGoalNotifications() {
  const { data: settings } = useUserSettings()
  const { data: dashboard } = useDashboardData()
  const { data: existingNotifs = [] } = useNotifications(200)

  useEffect(() => {
    if (!settings || settings.notifications_enabled === false) return
    const prefs = (settings.notification_preferences ?? {}) as Record<string, boolean>
    if (!prefs.goal) return
    if (!dashboard) return

    const fiscalGoal = dashboard.financialGoal
    if (fiscalGoal <= 0) return

    const progress = dashboard.goalProgress
    if (progress <= 0) return

    const existingMilestones = new Set(
      existingNotifs
        .filter((n) => n.metadata?.source === 'goal_milestone')
        .map((n) => n.metadata?.milestone as number),
    )

    for (const milestone of MILESTONES) {
      if (progress >= milestone && !existingMilestones.has(milestone)) {
        createNotification({
          category: 'goal',
          title: `Obiettivo al ${milestone}%`,
          message: `Hai raggiunto il ${milestone}% del tuo obiettivo finanziario annuale!`,
          link: '/dashboard',
          icon: 'Goal',
          metadata: { source: 'goal_milestone', milestone, progress },
        }).catch(() => {})
      }
    }
  }, [settings, dashboard, existingNotifs])
}

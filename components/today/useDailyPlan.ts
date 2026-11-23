'use client';

import { useMemo } from 'react';
import { useActivities, useDayLog } from '@/hooks/useData';
import { buildDailyTasks, taskProgress } from '@/lib/tasks';
import { dayKey, inRange, periodRange, todayStats, totals } from '@/lib/stats';
import { dailyTargets } from '@/lib/wellness';
import { useSettingsStore } from '@/store/settingsStore';

/** Today's targets and checklist, shared by the Today page and the dashboard card. */
export function useDailyPlan() {
  const settings = useSettingsStore();
  const activities = useActivities();
  const date = dayKey(new Date());
  const log = useDayLog(date);

  const plan = useMemo(() => {
    if (!activities || !log) return null;
    const now = new Date();
    const today = inRange(activities, periodRange('day', now));
    const weekKm = totals(inRange(activities, periodRange('week', now))).distanceM / 1000;
    const targets = dailyTargets(settings, weekKm, today);
    const tasks = buildDailyTasks({
      log,
      todaySteps: todayStats(activities, now).steps,
      todayActivities: today.length,
      targets,
      customTasks: settings.customTasks,
      units: settings.units,
      heightCm: settings.heightCm,
    });
    return { targets, tasks, progress: taskProgress(tasks) };
  }, [activities, log, settings]);

  return { date, log, plan, settings };
}

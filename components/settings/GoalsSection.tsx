'use client';

import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberStepper } from '@/components/common/NumberStepper';
import { useSettingsStore } from '@/store/settingsStore';
import { distanceValue, toMeters } from '@/lib/format';
import { LIMITS } from './fields';

export function GoalsSection() {
  const { dailyGoalSteps, weeklyGoalActivities, weeklyGoalKm, units, update } = useSettingsStore();
  // Stored in km; shown and edited in the user's units.
  const weeklyGoal = Math.round(distanceValue(weeklyGoalKm * 1000, units));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4 text-run-ink" aria-hidden />
          Goals
        </CardTitle>
        <CardDescription>Shown as rings and progress bars on your dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <NumberStepper
          id="settings-steps"
          label="Daily steps"
          unit="steps"
          hint="Steps are estimated from the distance you track."
          value={dailyGoalSteps}
          onChange={(v) => update({ dailyGoalSteps: v })}
          {...LIMITS.dailyGoalSteps}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberStepper
            id="settings-weekly-activities"
            label="Activities per week"
            value={weeklyGoalActivities}
            onChange={(v) => update({ weeklyGoalActivities: v })}
            {...LIMITS.weeklyGoalActivities}
          />
          <NumberStepper
            id="settings-weekly-km"
            label="Distance per week"
            unit={units}
            value={weeklyGoal}
            onChange={(v) => update({ weeklyGoalKm: +(toMeters(v, units) / 1000).toFixed(2) })}
            {...LIMITS.weeklyGoalKm}
          />
        </div>
      </CardContent>
    </Card>
  );
}

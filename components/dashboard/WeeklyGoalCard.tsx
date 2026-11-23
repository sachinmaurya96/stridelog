import { Target } from 'lucide-react';

function GoalBar({ label, value, goal, display }: { label: string; value: number; goal: number; display: string }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const done = value >= goal;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {display}
          {done && ' ✓'}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(value, goal)}
        aria-valuetext={display}
        className="h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-run-gradient transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function WeeklyGoalCard({
  activities,
  activitiesGoal,
  distance,
  distanceGoal,
  unit,
}: {
  activities: number;
  activitiesGoal: number;
  distance: number;
  distanceGoal: number;
  unit: string;
}) {
  return (
    <section aria-labelledby="weekly-goal-title" className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 id="weekly-goal-title" className="font-semibold">
          Weekly goals
        </h2>
        <Target className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <GoalBar label="Activities" value={activities} goal={activitiesGoal} display={`${activities} / ${activitiesGoal}`} />
      <GoalBar
        label="Distance"
        value={distance}
        goal={distanceGoal}
        display={`${distance.toFixed(1)} / ${distanceGoal} ${unit}`}
      />
    </section>
  );
}

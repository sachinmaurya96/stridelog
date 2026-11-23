'use client';

import type { Units } from '@/data/types';
import type { LiveStats as Stats } from '@/hooks/useTracker';
import { distanceValue, formatDuration, formatNumber, formatPaceValue, formatSpeed } from '@/lib/format';
import { cn } from '@/lib/utils';

function Big({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-3xl font-bold tabular-nums sm:text-4xl">
        {value}
        {unit && <span className="ml-0.5 text-base font-semibold text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function LiveStats({
  stats,
  units,
  expanded,
  paused,
  className,
}: {
  stats: Stats;
  units: Units;
  expanded: boolean;
  paused: boolean;
  className?: string;
}) {
  const pace = stats.currentPace || stats.avgPace;
  const minutes = Math.floor(stats.movingSec / 60);
  const dist = distanceValue(stats.distanceM, units);
  // Announce a summary once a minute instead of on every tick.
  const announcement = `${minutes} minutes, ${dist.toFixed(1)} ${units === 'mi' ? 'miles' : 'kilometres'}, pace ${formatPaceValue(stats.avgPace, units)} per ${units}`;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="grid grid-cols-3 gap-2">
        <Big label="Time" value={formatDuration(stats.movingSec)} />
        <Big label="Distance" value={dist.toFixed(2)} unit={units} />
        <Big label={stats.currentPace ? 'Pace' : 'Avg pace'} value={formatPaceValue(pace, units)} />
      </div>
      {paused && (
        <p className="mx-auto rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
          Paused
        </p>
      )}
      {expanded && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Small label="Avg pace" value={`${formatPaceValue(stats.avgPace, units)}/${units}`} />
          <Small label="Speed" value={formatSpeed(stats.speedMps, units)} />
          <Small label="Max speed" value={formatSpeed(stats.maxSpeedMps, units)} />
          <Small label="Calories" value={`${formatNumber(stats.calories)} kcal`} />
          <Small label="Est. steps" value={formatNumber(stats.steps)} />
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {minutes > 0 ? announcement : ''}
      </p>
    </div>
  );
}

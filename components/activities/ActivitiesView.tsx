'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { endOfWeek, format, isSameYear, startOfWeek } from 'date-fns';
import { History, Play } from 'lucide-react';
import type { Activity, ActivityType } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { MapAttribution } from '@/components/map/MapAttribution';
import { SpeedCard } from '@/components/dashboard/SpeedCard';
import { Segmented } from '@/components/common/Segmented';
import { useActivities } from '@/hooks/useData';
import { formatDistance } from '@/lib/format';
import { WEEK_STARTS_ON, totals } from '@/lib/stats';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { ActivityCard } from './ActivityCard';

type Filter = 'all' | ActivityType;
type Sort = 'date' | 'distance';

function weekLabel(weekStart: Date, now: Date) {
  const thisWeek = startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON }).getTime();
  const diffWeeks = Math.round((thisWeek - weekStart.getTime()) / (7 * 86_400_000));
  if (diffWeeks === 0) return 'This week';
  if (diffWeeks === 1) return 'Last week';
  const end = endOfWeek(weekStart, { weekStartsOn: WEEK_STARTS_ON });
  const yearFmt = isSameYear(weekStart, now) ? '' : ' yyyy';
  return `${format(weekStart, 'd MMM')} – ${format(end, `d MMM${yearFmt}`)}`;
}

function groupByWeek(activities: Activity[]) {
  const groups = new Map<number, Activity[]>();
  for (const a of activities) {
    const key = startOfWeek(a.startedAt, { weekStartsOn: WEEK_STARTS_ON }).getTime();
    const list = groups.get(key);
    if (list) list.push(a);
    else groups.set(key, [a]);
  }
  return [...groups.entries()].sort((x, y) => y[0] - x[0]);
}

export function ActivitiesView() {
  const activities = useActivities();
  const units = useSettingsStore((s) => s.units);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('date');

  const list = useMemo(() => {
    const filtered = (activities ?? []).filter((a) => filter === 'all' || a.type === filter);
    return sort === 'distance' ? [...filtered].sort((a, b) => b.distanceM - a.distanceM) : filtered;
  }, [activities, filter, sort]);

  if (activities === undefined) {
    return (
      <div className="flex flex-col gap-3 py-2" aria-busy="true" aria-label="Loading activities">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        className="mt-2"
        icon={History}
        title="No activities yet"
        description="Your runs and walks will show up here with their routes and splits."
        action={
          <Button asChild size="lg" className="bg-run-gradient text-ink-on-accent hover:opacity-90">
            <Link href="/track">
              <Play className="fill-current" aria-hidden /> Start your first walk
            </Link>
          </Button>
        }
      />
    );
  }

  const now = new Date();

  return (
    <div className="flex flex-col gap-5 py-2">
      <SpeedCard activities={activities} units={units} title="Running vs walking speed" />
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter by type" className="flex gap-2">
          {(['all', 'run', 'walk'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'h-10 rounded-full border border-border px-4 text-sm font-medium transition-colors',
                filter === f ? 'border-transparent bg-foreground text-background' : 'hover:bg-muted',
              )}
            >
              {f === 'all' ? 'All' : f === 'run' ? 'Runs' : 'Walks'}
            </button>
          ))}
        </div>
        <Segmented
          label="Sort by"
          value={sort}
          onChange={setSort}
          className="w-auto min-w-56 sm:ml-auto"
          options={[
            { value: 'date', label: 'Newest' },
            { value: 'distance', label: 'Longest' },
          ]}
        />
      </div>

      {list.length === 0 && <p className="text-sm text-muted-foreground">No {filter === 'run' ? 'runs' : 'walks'} yet.</p>}

      {sort === 'distance' ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
          {list.map((a) => (
            <ActivityCard key={a.id} activity={a} units={units} />
          ))}
        </div>
      ) : (
        groupByWeek(list).map(([weekStart, acts]) => {
          const t = totals(acts);
          return (
            <section key={weekStart} aria-labelledby={`week-${weekStart}`} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id={`week-${weekStart}`} className="font-semibold">
                  {weekLabel(new Date(weekStart), now)}
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t.count} {t.count === 1 ? 'activity' : 'activities'} · {formatDistance(t.distanceM, units, 1)}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
                {acts.map((a) => (
                  <ActivityCard key={a.id} activity={a} units={units} />
                ))}
              </div>
            </section>
          );
        })
      )}
      <MapAttribution />
    </div>
  );
}

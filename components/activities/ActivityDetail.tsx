'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Check, Pause, Pencil, Play, SearchX, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Activity, Units } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ActivityIcon, ACTIVITY_META } from '@/components/common/activity';
import { PaceChart, type PaceMetric } from '@/components/charts/PaceChart';
import { Segmented } from '@/components/common/Segmented';
import { RecoveryCard } from './RecoveryCard';
import { SplitsChart } from '@/components/charts/SplitsChart';
import { RouteMap } from '@/components/map/MapClient';
import { SplitsList } from '@/components/tracking/SplitsList';
import { activityRepo } from '@/data/repositories';
import { useActivity } from '@/hooks/useData';
import { computeSplits, paceSeries } from '@/lib/geo';
import {
  activityTitle,
  formatDistance,
  formatDuration,
  formatNumber,
  formatPace,
  formatSpeed,
  M_PER_MI,
} from '@/lib/format';
import { useSettingsStore } from '@/store/settingsStore';

function EditableTitle({ activity }: { activity: Activity }) {
  const current = activity.title || activityTitle(activity.type, activity.startedAt);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(current);

  async function save() {
    const title = draft.trim();
    setEditing(false);
    if (title && title !== current) {
      await activityRepo.update(activity.id, { title });
      toast.success('Title updated');
    } else {
      setDraft(current);
    }
  }

  if (editing) {
    return (
      <form
        className="flex min-w-0 flex-1 items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label htmlFor="title-input" className="sr-only">
          Activity title
        </label>
        <Input
          id="title-input"
          autoFocus
          value={draft}
          maxLength={60}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void save()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(current);
              setEditing(false);
            }
          }}
          className="text-lg font-bold"
        />
        <Button type="submit" size="icon" aria-label="Save title">
          <Check aria-hidden />
        </Button>
      </form>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-1">
      <h2 className="truncate text-2xl font-bold tracking-tight">{current}</h2>
      <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit title">
        <Pencil aria-hidden />
      </Button>
    </div>
  );
}

/** Animates a marker along the route over a few seconds. */
function useReplay(length: number) {
  const [progress, setProgress] = useState<number | null>(null);
  const raf = useRef<number | null>(null);

  const stop = () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setProgress(null);
  };
  const start = () => {
    stop();
    const duration = Math.min(12_000, Math.max(4_000, length * 15));
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setProgress(p);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else raf.current = null;
    };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
  }, []);
  return { progress, playing: progress != null && progress < 1, start, stop };
}

function Stats({ a, units }: { a: Activity; units: Units }) {
  const items = [
    ['Distance', formatDistance(a.distanceM, units)],
    ['Moving time', formatDuration(a.durationSec)],
    ['Avg pace', formatPace(a.avgPaceSecPerKm, units)],
    ['Avg speed', formatSpeed(a.durationSec ? a.distanceM / a.durationSec : 0, units)],
    ['Max speed', formatSpeed(a.maxSpeedMps, units)],
    ['Calories', `${formatNumber(a.calories)} kcal`],
    ['Est. steps', formatNumber(a.steps)],
    ['Elapsed', formatDuration((a.endedAt - a.startedAt) / 1000)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="glass rounded-2xl px-4 py-3">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-xl font-bold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const activity = useActivity(id);
  const units = useSettingsStore((s) => s.units);
  const weightKg = useSettingsStore((s) => s.weightKg);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [metric, setMetric] = useState<PaceMetric>('pace');
  const replay = useReplay(activity?.route.length ?? 0);

  const splits = useMemo(
    () => (activity ? (units === 'mi' ? computeSplits(activity.route, M_PER_MI) : activity.splits) : []),
    [activity, units],
  );
  const pace = useMemo(() => {
    if (!activity) return [];
    const bucket = Math.max(30, Math.round(activity.durationSec / 60));
    return paceSeries(activity.route, bucket);
  }, [activity]);

  if (activity === undefined) {
    return (
      <div className="flex flex-col gap-4 py-2" aria-busy="true" aria-label="Loading activity">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (activity === null) {
    return (
      <EmptyState
        className="mt-2"
        icon={SearchX}
        title="Activity not found"
        description="It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link href="/activities">Back to activities</Link>
          </Button>
        }
      />
    );
  }

  const meta = ACTIVITY_META[activity.type];
  const marker =
    replay.progress != null && activity.route.length > 1
      ? activity.route[Math.round(replay.progress * (activity.route.length - 1))]
      : null;

  return (
    <div className="flex flex-col gap-5 py-2">
      <Link href="/activities" className="flex w-fit items-center gap-1 rounded-lg text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Activities
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ActivityIcon type={activity.type} className="size-12 rounded-2xl" />
          <div className="flex min-w-0 flex-1 flex-col">
            <EditableTitle key={activity.title} activity={activity} />
            <p className="text-sm text-muted-foreground">{format(activity.startedAt, "EEE d MMM yyyy 'at' HH:mm")}</p>
          </div>
        </div>
        <div className="flex gap-2 *:flex-1 sm:*:flex-none">
          {activity.route.length > 1 && (
            <Button variant="outline" onClick={replay.playing ? replay.stop : replay.start}>
              {replay.playing ? <Pause aria-hidden /> : <Play aria-hidden />} {replay.playing ? 'Stop' : 'Replay'}
            </Button>
          )}
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden /> Delete
          </Button>
        </div>
      </header>

      {activity.route.length > 1 ? (
        <RouteMap route={activity.route} type={activity.type} marker={marker} className="h-72 rounded-2xl border border-border md:h-[26rem]" />
      ) : (
        <div className="grid h-32 place-items-center rounded-2xl bg-muted text-sm text-muted-foreground">No GPS route was recorded</div>
      )}

      <Stats a={activity} units={units} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Splits</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {splits.length > 0 ? (
              <>
                <SplitsChart splits={splits} units={units} type={activity.type} />
                <SplitsList splits={splits} units={units} />
              </>
            ) : (
              <SplitsList splits={splits} units={units} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{metric === 'pace' ? 'Pace' : 'Speed'} over time</CardTitle>
            <Segmented
              label="Chart"
              value={metric}
              onChange={setMetric}
              className="w-auto min-w-40"
              options={[
                { value: 'pace', label: 'Pace' },
                { value: 'speed', label: 'Speed' },
              ]}
            />
          </CardHeader>
          <CardContent>
            {pace.length > 1 ? (
              <PaceChart series={pace} units={units} type={activity.type} metric={metric} />
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data for a pace chart.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <RecoveryCard activity={activity} weightKg={weightKg} />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete this ${meta.label.toLowerCase()}?`}
        description="It will be removed from your history, dashboard and calendar. Badges you've earned stay unlocked."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await activityRepo.remove(activity.id);
          toast.success(`${meta.label} deleted`);
          router.replace('/activities');
        }}
      />
    </div>
  );
}

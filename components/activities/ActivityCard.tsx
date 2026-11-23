import Link from 'next/link';
import { format } from 'date-fns';
import type { Activity, Units } from '@/data/types';
import { ACTIVITY_META, ActivityIcon } from '@/components/common/activity';
import { activityTitle, formatDistance, formatDuration, formatPace } from '@/lib/format';
import { LazyRouteThumb } from './LazyRouteThumb';

export function ActivityCard({ activity: a, units, thumbnail = true }: { activity: Activity; units: Units; thumbnail?: boolean }) {
  const title = a.title || activityTitle(a.type, a.startedAt);
  return (
    <Link
      href={`/activities/${a.id}`}
      className="glass group flex items-center gap-3 rounded-2xl p-3 transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
    >
      {thumbnail && <LazyRouteThumb route={a.route} type={a.type} className="size-20 shrink-0 sm:size-24" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <ActivityIcon type={a.type} className="size-7 rounded-lg [&_svg]:size-4" />
          <h3 className="truncate font-semibold">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {format(a.startedAt, 'EEE d MMM · HH:mm')} · {ACTIVITY_META[a.type].label}
        </p>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div>
            <dt className="sr-only">Distance</dt>
            <dd className="font-semibold tabular-nums">{formatDistance(a.distanceM, units)}</dd>
          </div>
          <div>
            <dt className="sr-only">Time</dt>
            <dd className="tabular-nums text-muted-foreground">{formatDuration(a.durationSec)}</dd>
          </div>
          <div>
            <dt className="sr-only">Pace</dt>
            <dd className="tabular-nums text-muted-foreground">{formatPace(a.avgPaceSecPerKm, units)}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}

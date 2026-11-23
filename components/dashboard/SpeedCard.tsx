import { Gauge } from 'lucide-react';
import type { Activity, Units } from '@/data/types';
import { ACTIVITY_META } from '@/components/common/activity';
import { formatPace, formatSpeed } from '@/lib/format';
import { speedByType } from '@/lib/stats';
import { cn } from '@/lib/utils';

/** Average and best speed for running vs walking. */
export function SpeedCard({ activities, units, title = 'Your speed', className }: { activities: Activity[]; units: Units; title?: string; className?: string }) {
  const s = speedByType(activities);

  return (
    <section aria-labelledby="speed-title" className={cn('glass flex flex-col gap-4 rounded-2xl p-5', className)}>
      <div className="flex items-center justify-between">
        <h2 id="speed-title" className="font-semibold">
          {title}
        </h2>
        <Gauge className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(['run', 'walk'] as const).map((t) => {
          const m = ACTIVITY_META[t];
          const v = s[t];
          return (
            <div key={t} className="flex flex-col gap-1 rounded-xl bg-muted/60 p-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className={cn('size-2 rounded-full', m.dot)} aria-hidden /> {t === 'run' ? 'Running' : 'Walking'}
              </span>
              {v.count ? (
                <>
                  <span className="text-2xl font-bold">{formatSpeed(v.avgMps, units)}</span>
                  <span className="text-xs text-muted-foreground">
                    avg · {formatPace(v.avgMps > 0 ? 1000 / v.avgMps : 0, units)}
                  </span>
                  {v.bestMps > 0 && <span className="text-xs text-muted-foreground">Best: {formatSpeed(v.bestMps, units)}</span>}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No {t === 'run' ? 'runs' : 'walks'} yet</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

import type { Split, Units } from '@/data/types';
import { formatPaceValue } from '@/lib/format';
import { cn } from '@/lib/utils';

/** One row per full km/mile with a bar: the faster the split, the longer the bar. */
export function SplitsList({ splits, units, className }: { splits: Split[]; units: Units; className?: string }) {
  if (!splits.length) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        Splits appear after your first {units === 'mi' ? 'mile' : 'kilometre'}.
      </p>
    );
  }
  const fastest = Math.min(...splits.map((s) => s.paceSecPerKm));
  const slowest = Math.max(...splits.map((s) => s.paceSecPerKm));
  return (
    <ol className={cn('flex flex-col gap-1.5', className)} aria-label="Splits">
      {splits.map((s) => {
        const width = slowest === fastest ? 100 : 55 + (45 * (slowest - s.paceSecPerKm)) / (slowest - fastest);
        return (
          <li key={s.km} className="grid grid-cols-[3.5rem_1fr_4.5rem] items-center gap-3 text-sm">
            <span className="text-muted-foreground tabular-nums">
              {units === 'mi' ? 'Mi' : 'Km'} {s.km}
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
              <span
                className={cn('block h-full rounded-full', s.paceSecPerKm === fastest ? 'bg-run-gradient' : 'bg-foreground/30')}
                style={{ width: `${width}%` }}
              />
            </span>
            <span className="text-right font-semibold tabular-nums">{formatPaceValue(s.paceSecPerKm, units)}</span>
          </li>
        );
      })}
    </ol>
  );
}

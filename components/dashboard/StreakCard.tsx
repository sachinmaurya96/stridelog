import { Flame } from 'lucide-react';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { cn } from '@/lib/utils';

export function StreakCard({ current, longest, activeToday }: { current: number; longest: number; activeToday: boolean }) {
  const message =
    current === 0
      ? 'Move today to start a new streak.'
      : activeToday
        ? 'Streak extended today. Nice work!'
        : "Don't break it! Move today to keep your streak.";

  return (
    <section aria-labelledby="streak-title" className="glass flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 id="streak-title" className="font-semibold">
          Streak
        </h2>
        <span
          className={cn(
            'grid size-10 place-items-center rounded-xl',
            current > 0 ? 'bg-run-gradient text-ink-on-accent' : 'bg-muted text-muted-foreground',
          )}
        >
          <Flame className={cn('size-5', current > 0 && 'fill-current')} aria-hidden />
        </span>
      </div>
      <p className="text-4xl font-bold">
        <AnimatedNumber value={current} /> <span className="text-lg font-semibold text-muted-foreground">{current === 1 ? 'day' : 'days'}</span>
      </p>
      <p className={cn('text-sm', current > 0 && !activeToday ? 'font-medium text-run-ink' : 'text-muted-foreground')}>{message}</p>
      <p className="text-xs text-muted-foreground">
        Longest streak: <span className="font-semibold text-foreground">{longest} {longest === 1 ? 'day' : 'days'}</span>
      </p>
    </section>
  );
}

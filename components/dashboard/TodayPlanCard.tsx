'use client';

import Link from 'next/link';
import { ChevronRight, GlassWater, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addWater } from '@/data/dayLog';
import { useDailyPlan } from '@/components/today/useDailyPlan';

/** Dashboard shortcut to the daily checklist, with a one-tap water log. */
export function TodayPlanCard() {
  const { date, plan } = useDailyPlan();
  if (!plan) return null;
  const { done, total } = plan.progress;
  const water = plan.tasks.find((t) => t.id === 'water');
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section aria-labelledby="plan-title" className="glass flex h-full flex-col gap-4 rounded-2xl p-5">
      <Link href="/today" className="flex items-center justify-between gap-2 rounded-lg">
        <span>
          <h2 id="plan-title" className="font-semibold">
            Today&apos;s plan
          </h2>
          <span className="text-sm text-muted-foreground">
            {done} of {total} tasks done
          </span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
      </Link>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Daily tasks done"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div className="h-full rounded-full bg-walk-gradient transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      {water && (
        <div className="flex items-center gap-3">
          <GlassWater className="size-5 text-walk-ink" aria-hidden />
          <span className="flex-1 text-sm">
            Water <span className="font-semibold tabular-nums">{(water.current / 1000).toFixed(2).replace(/0$/, '')}</span> /{' '}
            {(water.target / 1000).toFixed(1)} L
          </span>
          <Button size="sm" variant="outline" onClick={() => void addWater(date, 250)}>
            <Plus aria-hidden /> 250 ml
          </Button>
        </div>
      )}
    </section>
  );
}

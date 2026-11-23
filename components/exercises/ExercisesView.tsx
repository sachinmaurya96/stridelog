'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Play } from 'lucide-react';
import { CATEGORY_LABEL, EXERCISES, ROUTINES, routineMinutes, type Exercise, type ExerciseCategory } from '@/data/exercises';
import { Button } from '@/components/ui/button';
import { useDayLog } from '@/hooks/useData';
import { dayKey } from '@/lib/stats';
import { cn } from '@/lib/utils';
import { ExerciseDialog } from './ExerciseDialog';
import { CATEGORY_ICON, CATEGORY_TINT } from './meta';
import { WorkoutPlayer, type WorkoutPlan } from './WorkoutPlayer';

type Filter = 'all' | ExerciseCategory;

export function ExercisesView() {
  const today = dayKey(new Date());
  const log = useDayLog(today);
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Exercise | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const doneIds = useMemo(() => new Set(log?.exercises.map((e) => e.id) ?? []), [log]);
  const list = EXERCISES.filter((e) => filter === 'all' || e.category === filter);

  return (
    <div className="flex flex-col gap-6 py-2">
      <section className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5" aria-live="polite">
        <div>
          <h2 className="text-lg font-bold">No equipment needed</h2>
          <p className="text-sm text-muted-foreground">Bodyweight exercises that make you a stronger, injury-proof runner.</p>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-semibold">
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
          {doneIds.size} done today
        </p>
      </section>

      <section aria-labelledby="routines-title" className="flex flex-col gap-3">
        <h2 id="routines-title" className="font-semibold">
          Guided routines
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ROUTINES.map((r) => (
            <div key={r.id} className="glass flex flex-col gap-3 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden /> {routineMinutes(r)} min
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {r.exercises.length} exercises · {r.workSec}s on / {r.restSec}s rest
              </p>
              <Button
                className="mt-auto bg-run-gradient text-ink-on-accent hover:opacity-90"
                onClick={() => setPlan({ name: r.name, exercises: r.exercises, workSec: r.workSec, restSec: r.restSec })}
              >
                <Play className="fill-current" aria-hidden /> Start
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="library-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="library-title" className="font-semibold">
            Exercise library
          </h2>
          <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
            {(['all', 'strength', 'core', 'cardio', 'mobility'] as const).map((f) => (
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
                {f === 'all' ? 'All' : CATEGORY_LABEL[f]}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => {
            const Icon = CATEGORY_ICON[e.category];
            const done = doneIds.has(e.id);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setOpen(e)}
                  className="glass flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5"
                >
                  <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl text-ink-on-accent', CATEGORY_TINT[e.category])}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {e.name}
                      {done && (
                        <CheckCircle2 className="size-4 text-emerald-500" aria-label="done today" />
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">{e.dose}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {CATEGORY_LABEL[e.category]} · {e.muscles.join(', ')}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <ExerciseDialog
        exercise={open}
        doneToday={!!open && doneIds.has(open.id)}
        onClose={() => setOpen(null)}
        onStartTimer={(e) => {
          setOpen(null);
          setPlan({ name: e.name, exercises: [e.id], workSec: 40, restSec: 0 });
        }}
      />
      <WorkoutPlayer plan={plan} onClose={() => setPlan(null)} />
    </div>
  );
}

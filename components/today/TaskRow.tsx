'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BedDouble, Check, Dumbbell, Footprints, GlassWater, Minus, Plus, Salad, Sparkles, Trash2 } from 'lucide-react';
import type { DailyTask, TaskKind } from '@/lib/tasks';
import { Button } from '@/components/ui/button';
import { addWater, setCheck, setSleep } from '@/data/dayLog';
import { vibrate } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const ICON: Record<TaskKind, typeof Footprints> = {
  move: Footprints,
  exercise: Dumbbell,
  water: GlassWater,
  diet: Salad,
  sleep: BedDouble,
  custom: Sparkles,
};

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <div className="h-full rounded-full bg-walk-gradient transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function SleepInput({ date, hours }: { date: string; hours: number | null }) {
  const [value, setValue] = useState(hours ?? 7.5);
  const step = (d: number) => setValue((v) => Math.min(16, Math.max(0, +(v + d).toFixed(1))));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => step(-0.5)} aria-label="Less sleep">
        <Minus aria-hidden />
      </Button>
      <span className="min-w-16 text-center text-lg font-semibold tabular-nums" aria-live="polite">
        {value} h
      </span>
      <Button variant="outline" size="icon" onClick={() => step(0.5)} aria-label="More sleep">
        <Plus aria-hidden />
      </Button>
      <Button onClick={() => void setSleep(date, value)} disabled={hours === value}>
        {hours == null ? 'Log sleep' : 'Update'}
      </Button>
    </div>
  );
}

/** One checklist item. Manual tasks get a tick box; tracked ones show progress and quick controls. */
export function TaskRow({
  task,
  date,
  sleepHours,
  onRemove,
}: {
  task: DailyTask;
  date: string;
  sleepHours: number | null;
  onRemove?: () => void;
}) {
  const Icon = ICON[task.kind];

  return (
    <li className="glass flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        {task.manual ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={task.done}
            aria-label={task.title}
            onClick={() => {
              vibrate(15);
              void setCheck(date, task.id, !task.done);
            }}
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-full border-2 transition-colors',
              task.done ? 'border-transparent bg-walk-gradient text-ink-on-accent' : 'border-border hover:border-walk',
            )}
          >
            {task.done && <Check className="size-5" aria-hidden />}
          </button>
        ) : (
          <span
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-full',
              task.done ? 'bg-walk-gradient text-ink-on-accent' : 'bg-muted text-muted-foreground',
            )}
          >
            {task.done ? <Check className="size-5" aria-label="Done" /> : <Icon className="size-5" aria-hidden />}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('font-semibold', task.done && 'line-through decoration-2')}>{task.title}</span>
          {task.detail && <span className="text-sm text-muted-foreground">{task.detail}</span>}
        </div>
        {onRemove && (
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove task: ${task.title}`}>
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>

      {task.kind === 'move' && (
        <div className="flex flex-col gap-2 pl-14">
          <Bar value={task.current} max={task.target} label="Steps" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {task.current.toLocaleString()} / {task.target.toLocaleString()} est. steps
            </span>
            {!task.done && (
              <Link href="/track" className="inline-flex min-h-6 items-center font-semibold text-run-ink underline-offset-2 hover:underline">
                Start a walk
              </Link>
            )}
          </div>
        </div>
      )}

      {task.kind === 'exercise' && (
        <div className="flex flex-col gap-2 pl-14">
          <Bar value={task.current} max={task.target} label="Exercises" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {task.current} / {task.target} done
            </span>
            {!task.done && (
              <Link href="/exercises" className="inline-flex min-h-6 items-center font-semibold text-run-ink underline-offset-2 hover:underline">
                Open exercises
              </Link>
            )}
          </div>
        </div>
      )}

      {task.kind === 'water' && (
        <div className="flex flex-col gap-2 pl-14">
          <Bar value={task.current} max={task.target} label="Water" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto text-sm font-semibold tabular-nums" aria-live="polite">
              {(task.current / 1000).toFixed(2).replace(/0$/, '')} / {(task.target / 1000).toFixed(1)} L
            </span>
            <Button variant="outline" size="sm" onClick={() => void addWater(date, -250)} disabled={task.current <= 0} aria-label="Remove 250 ml">
              <Minus aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                vibrate(10);
                void addWater(date, 250);
              }}
            >
              <Plus aria-hidden /> 250 ml
            </Button>
            <Button
              size="sm"
              className="bg-walk-gradient text-ink-on-accent hover:opacity-90"
              onClick={() => {
                vibrate(10);
                void addWater(date, 500);
              }}
            >
              <Plus aria-hidden /> 500 ml
            </Button>
          </div>
        </div>
      )}

      {task.kind === 'sleep' && (
        <div className="pl-14">
          <SleepInput key={sleepHours ?? 'none'} date={date} hours={sleepHours} />
        </div>
      )}
    </li>
  );
}

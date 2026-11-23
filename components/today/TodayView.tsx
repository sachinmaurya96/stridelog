'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalRing } from '@/components/dashboard/GoalRing';
import { useSettingsStore } from '@/store/settingsStore';
import { useUiStore } from '@/store/uiStore';
import { vibrate } from '@/lib/haptics';
import { TargetsCard } from './TargetsCard';
import { TaskRow } from './TaskRow';
import { useDailyPlan } from './useDailyPlan';

function AddTask() {
  const [title, setTitle] = useState('');
  const customTasks = useSettingsStore((s) => s.customTasks);
  const update = useSettingsStore((s) => s.update);
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const t = title.trim();
        if (!t) return;
        update({ customTasks: [...customTasks, { id: nanoid(8), title: t }] });
        setTitle('');
      }}
    >
      <Label htmlFor="new-task" className="sr-only">
        New daily task
      </Label>
      <Input id="new-task" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Add your own daily task, e.g. Stretch 10 min" />
      <Button type="submit" disabled={!title.trim()}>
        <Plus aria-hidden /> Add
      </Button>
    </form>
  );
}

export function TodayView() {
  const { date, log, plan, settings } = useDailyPlan();
  const celebratedDay = useUiStore((s) => s.celebratedDay);
  const markCelebrated = useUiStore((s) => s.markCelebrated);
  const reduceMotion = useReducedMotion();
  const allDone = !!plan && plan.progress.total > 0 && plan.progress.done === plan.progress.total;

  // Celebrate the first time every task is ticked off today.
  useEffect(() => {
    if (!allDone || celebratedDay === date) return;
    markCelebrated(date);
    vibrate([60, 40, 60]);
    toast.success('Perfect day! Every task is done 🎉');
    if (!reduceMotion) void confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#ff6b35', '#ff3d71', '#00d4aa', '#ffc94d'] });
  }, [allDone, celebratedDay, date, markCelebrated, reduceMotion]);

  if (!plan || !log) {
    return (
      <div className="grid gap-4 py-2 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" aria-busy="true" aria-label="Loading today's plan">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const { done, total } = plan.progress;
  const message =
    done === total ? 'Everything done. Brilliant day!' : done === 0 ? "Let's get started. Small steps add up." : `${total - done} to go. Keep it up!`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 py-2 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-4">
        <section aria-labelledby="today-progress" className="glass flex items-center gap-5 rounded-2xl p-5">
          <GoalRing value={done} goal={total} label="tasks" size={120} stroke={12} />
          <div>
            <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE d MMMM')}</p>
            <h2 id="today-progress" className="text-xl font-bold">
              {done} of {total} tasks done
            </h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </section>

        <ul className="flex flex-col gap-3" aria-label="Today's tasks">
          {plan.tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              date={date}
              sleepHours={log.sleepHours}
              onRemove={
                t.kind === 'custom'
                  ? () => {
                      const removed = settings.customTasks.find((c) => `custom:${c.id}` === t.id);
                      settings.update({ customTasks: settings.customTasks.filter((c) => c !== removed) });
                      if (removed) {
                        toast(`Removed “${removed.title}”`, {
                          duration: 8000,
                          action: {
                            label: 'Undo',
                            onClick: () => settings.update({ customTasks: [...useSettingsStore.getState().customTasks, removed] }),
                          },
                        });
                      }
                    }
                  : undefined
              }
            />
          ))}
        </ul>
        <AddTask />
        <p className="text-xs text-muted-foreground">The checklist starts fresh every day. Your own tasks repeat daily until you remove them.</p>
      </div>

      <TargetsCard targets={plan.targets} profile={settings} units={settings.units} />
    </div>
  );
}

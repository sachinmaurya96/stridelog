'use client';

import { CheckCircle2, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORY_LABEL, type Exercise } from '@/data/exercises';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { logExercise } from '@/data/dayLog';
import { dayKey } from '@/lib/stats';
import { cn } from '@/lib/utils';
import { CATEGORY_ICON, CATEGORY_TINT } from './meta';

export function ExerciseDialog({
  exercise,
  doneToday,
  onClose,
  onStartTimer,
}: {
  exercise: Exercise | null;
  doneToday: boolean;
  onClose: () => void;
  onStartTimer: (e: Exercise) => void;
}) {
  const Icon = exercise ? CATEGORY_ICON[exercise.category] : null;
  return (
    <Dialog open={!!exercise} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {exercise && Icon && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl text-ink-on-accent', CATEGORY_TINT[exercise.category])}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <div className="text-left">
                  <DialogTitle className="text-xl">{exercise.name}</DialogTitle>
                  <DialogDescription>
                    {CATEGORY_LABEL[exercise.category]} · {exercise.level} · {exercise.dose}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-4 text-sm">
              <p className="text-muted-foreground">Works: {exercise.muscles.join(', ')}</p>
              <ol className="flex list-decimal flex-col gap-2 pl-5">
                {exercise.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="rounded-xl bg-muted/60 p-3">
                <span className="font-semibold">For runners: </span>
                {exercise.tip}
              </p>
              {exercise.easier && (
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Easier version: </span>
                  {exercise.easier}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="outline" onClick={() => onStartTimer(exercise)}>
                <Timer aria-hidden /> 40 s timer
              </Button>
              <Button
                className="bg-run-gradient text-ink-on-accent hover:opacity-90"
                onClick={async () => {
                  await logExercise(dayKey(new Date()), exercise.id);
                  toast.success(`${exercise.name} logged for today`);
                  onClose();
                }}
              >
                <CheckCircle2 aria-hidden /> {doneToday ? 'Log another set' : 'Mark done today'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

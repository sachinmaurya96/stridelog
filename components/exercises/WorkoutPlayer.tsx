'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipForward, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { exerciseById } from '@/data/exercises';
import { logExercise } from '@/data/dayLog';
import { vibrate } from '@/lib/haptics';
import { dayKey } from '@/lib/stats';
import { ExerciseReference } from './ExerciseReference';

export interface WorkoutPlan {
  name: string;
  exercises: string[];
  workSec: number;
  restSec: number;
}

type Phase = 'ready' | 'work' | 'rest' | 'done';

/** Guided interval timer: get ready → (work → rest) per exercise. Each finished exercise is logged for today. */
export function WorkoutPlayer({ plan, onClose }: { plan: WorkoutPlan | null; onClose: () => void }) {
  return (
    <Dialog open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">{plan && <Player key={plan.name + plan.exercises.join()} plan={plan} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function Player({ plan, onClose }: { plan: WorkoutPlan; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [left, setLeft] = useState(5);
  const [paused, setPaused] = useState(false);
  const [loggedCount, setLoggedCount] = useState(0);
  const logged = useRef(new Set<number>());

  const exercise = exerciseById(plan.exercises[index]);
  const total = phase === 'ready' ? 5 : phase === 'work' ? plan.workSec : plan.restSec;

  const advance = () => {
    if (phase === 'ready') {
      setPhase('work');
      setLeft(plan.workSec);
      return;
    }
    if (phase === 'work') {
      if (!logged.current.has(index)) {
        logged.current.add(index);
        setLoggedCount(logged.current.size);
        void logExercise(dayKey(new Date()), plan.exercises[index]);
      }
      if (index === plan.exercises.length - 1) {
        setPhase('done');
        vibrate([100, 60, 100, 60, 200]);
        return;
      }
      setPhase('rest');
      setLeft(plan.restSec);
      return;
    }
    if (phase === 'rest') {
      setIndex((i) => i + 1);
      setPhase('work');
      setLeft(plan.workSec);
    }
  };
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  });

  useEffect(() => {
    if (paused || phase === 'done') return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [paused, phase]);

  // When the countdown reaches zero, move to the next phase.
  useEffect(() => {
    if (left > 0 || phase === 'done') return;
    vibrate(150);
    const id = setTimeout(() => advanceRef.current(), 0);
    return () => clearTimeout(id);
  }, [left, phase]);

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-gold-gradient text-[#1b1206]">
          <Trophy className="size-10" aria-hidden />
        </span>
        <DialogTitle className="text-2xl">Workout complete!</DialogTitle>
        <DialogDescription>
          {plan.name}: {loggedCount} {loggedCount === 1 ? 'exercise' : 'exercises'} logged for today.
        </DialogDescription>
        <Button size="lg" className="w-full bg-run-gradient text-ink-on-accent hover:opacity-90" onClick={onClose} autoFocus>
          Done
        </Button>
      </div>
    );
  }

  const r = 70;
  const c = 2 * Math.PI * r;
  const next = phase === 'rest' ? exerciseById(plan.exercises[index + 1]) : undefined;
  const displayedExercise = phase === 'rest' ? next : exercise;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div>
        <DialogTitle>{plan.name}</DialogTitle>
        <DialogDescription>
          Exercise {index + 1} of {plan.exercises.length}
        </DialogDescription>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {plan.exercises.map((id, i) => (
          <span key={`${id}-${i}`} className={`h-1.5 w-6 rounded-full ${i < index || (i === index && phase === 'rest') ? 'bg-run' : i === index ? 'bg-foreground/50' : 'bg-muted'}`} />
        ))}
      </div>
      <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        {phase === 'ready' ? 'Get ready' : phase === 'work' ? 'Go!' : 'Rest'}
      </p>
      <div className="relative grid size-44 place-items-center">
        <svg viewBox="0 0 160 160" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <circle cx="80" cy="80" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={phase === 'work' ? 'var(--run)' : 'var(--walk)'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - left / total)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="text-5xl font-bold tabular-nums" aria-live="polite">
          {left}
        </span>
      </div>
      <div>
        <p className="text-xl font-bold">{phase === 'rest' ? `Next: ${next?.name}` : exercise?.name}</p>
        <p className="text-sm text-muted-foreground">{phase === 'rest' ? next?.steps[0] : exercise?.steps[0]}</p>
      </div>
      {displayedExercise && <ExerciseReference exercise={displayedExercise} />}
      <div className="flex w-full gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={() => setPaused((p) => !p)}>
          {paused ? <Play aria-hidden /> : <Pause aria-hidden />} {paused ? 'Resume' : 'Pause'}
        </Button>
        <Button variant="outline" size="lg" className="flex-1" onClick={advance}>
          <SkipForward aria-hidden /> Skip
        </Button>
      </div>
    </div>
  );
}

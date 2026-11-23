import type { CustomTask, DayLog, Units } from '@/data/types';
import type { DailyTargets } from './wellness';
import { distanceValue } from './format';

export type TaskKind = 'move' | 'exercise' | 'water' | 'diet' | 'sleep' | 'custom';

export interface DailyTask {
  id: string;
  kind: TaskKind;
  title: string;
  detail?: string;
  current: number;
  target: number;
  done: boolean;
  /** Ticked by hand (the others complete from tracked data). */
  manual: boolean;
}

interface Input {
  log: DayLog;
  todaySteps: number;
  todayActivities: number;
  targets: DailyTargets;
  customTasks: CustomTask[];
  units: Units;
  heightCm: number;
}

/** Today's checklist: movement, exercise, water, diet and sleep, plus the user's own tasks. */
export function buildDailyTasks({ log, todaySteps, todayActivities, targets, customTasks, units, heightCm }: Input): DailyTask[] {
  const walkKm = distanceValue(targets.steps * ((heightCm * 0.415) / 100), units);
  const exercisesDone = new Set(log.exercises.map((e) => e.id)).size;
  const check = (id: string) => !!log.checks[id];
  const tasks: DailyTask[] = [
    {
      id: 'move',
      kind: 'move',
      title: `Walk or run ${targets.steps.toLocaleString()} steps`,
      detail: `About ${walkKm.toFixed(1)} ${units} of walking. Tracked automatically.`,
      current: todaySteps,
      target: targets.steps,
      done: todaySteps >= targets.steps,
      manual: false,
    },
    {
      id: 'exercise',
      kind: 'exercise',
      title: `Do ${targets.exercises} bodyweight exercises`,
      detail: 'Squats, push-ups, planks… no equipment needed.',
      current: exercisesDone,
      target: targets.exercises,
      done: exercisesDone >= targets.exercises,
      manual: false,
    },
    {
      id: 'water',
      kind: 'water',
      title: `Drink ${(targets.waterMl / 1000).toFixed(1)} L of water`,
      detail: 'Spread it through the day; more on hot days.',
      current: log.waterMl,
      target: targets.waterMl,
      done: log.waterMl >= targets.waterMl,
      manual: false,
    },
    {
      id: 'protein',
      kind: 'diet',
      title: `Eat about ${targets.proteinG.min} g of protein`,
      detail: 'Dal, eggs, paneer, curd, chicken, sprouts or tofu at each meal.',
      current: check('protein') ? 1 : 0,
      target: 1,
      done: check('protein'),
      manual: true,
    },
    {
      id: 'veg',
      kind: 'diet',
      title: 'Eat 5 servings of fruit & vegetables',
      current: check('veg') ? 1 : 0,
      target: 1,
      done: check('veg'),
      manual: true,
    },
  ];
  if (todayActivities > 0) {
    tasks.push({
      id: 'recovery',
      kind: 'diet',
      title: 'Have a recovery meal after your workout',
      detail: 'Carbs plus about 20 g of protein. See the activity page for amounts.',
      current: check('recovery') ? 1 : 0,
      target: 1,
      done: check('recovery'),
      manual: true,
    });
  }
  const slept = log.sleepHours ?? 0;
  tasks.push({
    id: 'sleep',
    kind: 'sleep',
    title: `Sleep ${targets.sleepH.min}–${targets.sleepH.max} hours`,
    detail: log.sleepHours == null ? 'Log how long you slept last night.' : `You slept ${slept} h last night.`,
    current: slept,
    target: targets.sleepH.min,
    done: log.sleepHours != null && slept >= targets.sleepH.min,
    manual: false,
  });
  for (const t of customTasks) {
    tasks.push({
      id: `custom:${t.id}`,
      kind: 'custom',
      title: t.title,
      current: check(`custom:${t.id}`) ? 1 : 0,
      target: 1,
      done: check(`custom:${t.id}`),
      manual: true,
    });
  }
  return tasks;
}

export function taskProgress(tasks: DailyTask[]) {
  const done = tasks.filter((t) => t.done).length;
  return { done, total: tasks.length };
}

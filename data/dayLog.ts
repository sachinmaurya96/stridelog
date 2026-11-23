import { dayLogRepo } from './repositories';

// Small, atomic updates to one day's log. Components call these instead of touching the repo shape.

export const logExercise = (date: string, id: string) =>
  dayLogRepo.update(date, (log) => ({ ...log, exercises: [...log.exercises, { id, at: Date.now() }] }));

export const addWater = (date: string, ml: number) =>
  dayLogRepo.update(date, (log) => ({ ...log, waterMl: Math.max(0, Math.min(10_000, log.waterMl + ml)) }));

export const setSleep = (date: string, hours: number | null) =>
  dayLogRepo.update(date, (log) => ({ ...log, sleepHours: hours == null ? null : Math.max(0, Math.min(16, hours)) }));

export const setCheck = (date: string, id: string, done: boolean) =>
  dayLogRepo.update(date, (log) => ({ ...log, checks: { ...log.checks, [id]: done } }));

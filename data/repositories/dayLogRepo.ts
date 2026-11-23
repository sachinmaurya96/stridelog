import { db } from '../db';
import type { DayLog } from '../types';

export const emptyDayLog = (date: string): DayLog => ({
  date,
  waterMl: 0,
  sleepHours: null,
  exercises: [],
  checks: {},
  updatedAt: 0,
});

export interface DayLogRepo {
  get(date: string): Promise<DayLog | undefined>;
  /** Newest first. */
  list(): Promise<DayLog[]>;
  /** Reads the day (or an empty one), applies `change` and saves it, atomically. */
  update(date: string, change: (log: DayLog) => DayLog): Promise<DayLog>;
  replaceAll(items: DayLog[]): Promise<void>;
  clear(): Promise<void>;
}

export const localDayLogRepo: DayLogRepo = {
  get: (date) => db.days.get(date),
  list: () => db.days.orderBy('date').reverse().toArray(),
  update: (date, change) =>
    db.transaction('rw', db.days, async () => {
      const next = { ...change((await db.days.get(date)) ?? emptyDayLog(date)), date, updatedAt: Date.now() };
      await db.days.put(next);
      return next;
    }),
  replaceAll: (items) =>
    db.transaction('rw', db.days, async () => {
      await db.days.clear();
      await db.days.bulkPut(items);
    }),
  clear: () => db.days.clear(),
};

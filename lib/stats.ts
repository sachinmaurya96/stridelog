import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import type { Activity } from '@/data/types';

export const WEEK_STARTS_ON = 1 as const; // Monday

/** Local calendar date key, e.g. '2026-11-23'. Always use this for grouping by day. */
export const dayKey = (d: Date | number) => format(d, 'yyyy-MM-dd');

/** Parses a 'yyyy-MM-dd' key as a local date (midnight). */
export function fromDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export interface Totals {
  count: number;
  runs: number;
  walks: number;
  distanceM: number;
  durationSec: number;
  calories: number;
  steps: number;
}

export function totals(activities: Activity[]): Totals {
  const t: Totals = { count: 0, runs: 0, walks: 0, distanceM: 0, durationSec: 0, calories: 0, steps: 0 };
  for (const a of activities) {
    t.count++;
    if (a.type === 'run') t.runs++;
    else t.walks++;
    t.distanceM += a.distanceM;
    t.durationSec += a.durationSec;
    t.calories += a.calories;
    t.steps += a.steps;
  }
  return t;
}

export type Period = 'day' | 'week' | 'month';

/** Start/end of the period containing `now`, shifted by `offset` periods (e.g. -1 = previous). */
export function periodRange(period: Period, now: Date, offset = 0) {
  if (period === 'day') {
    const d = addDays(now, offset);
    return { from: startOfDay(d), to: endOfDay(d) };
  }
  if (period === 'week') {
    const d = addWeeks(now, offset);
    return {
      from: startOfWeek(d, { weekStartsOn: WEEK_STARTS_ON }),
      to: endOfWeek(d, { weekStartsOn: WEEK_STARTS_ON }),
    };
  }
  const d = addMonths(now, offset);
  return { from: startOfMonth(d), to: endOfMonth(d) };
}

export function inRange(activities: Activity[], range: { from: Date; to: Date }) {
  const from = range.from.getTime(), to = range.to.getTime();
  return activities.filter((a) => a.startedAt >= from && a.startedAt <= to);
}

export const todayStats = (activities: Activity[], now = new Date()) => totals(inRange(activities, periodRange('day', now)));
export const weekStats = (activities: Activity[], now = new Date()) => totals(inRange(activities, periodRange('week', now)));
export const monthStats = (activities: Activity[], now = new Date()) => totals(inRange(activities, periodRange('month', now)));

/** Totals for the current and the previous period, for ▲/▼ comparisons. */
export function periodComparison(activities: Activity[], period: Period, now = new Date()) {
  return {
    current: totals(inRange(activities, periodRange(period, now))),
    previous: totals(inRange(activities, periodRange(period, now, -1))),
  };
}

/** % change from `prev` to `curr`, or null when there's nothing to compare with. */
export function percentChange(curr: number, prev: number) {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

export interface DayPoint {
  date: string;
  label: string;
  runM: number;
  walkM: number;
  totalM: number;
  count: number;
  calories: number;
}

/** One entry per local day between `from` and `to` (inclusive), for charts. */
export function dailySeries(activities: Activity[], from: Date, to: Date, labelFormat = 'EEE'): DayPoint[] {
  const byDay = groupByDay(activities);
  return eachDayOfInterval({ start: from, end: to }).map((d) => {
    const key = dayKey(d);
    const acts = byDay.get(key) ?? [];
    const runM = acts.filter((a) => a.type === 'run').reduce((s, a) => s + a.distanceM, 0);
    const walkM = acts.filter((a) => a.type === 'walk').reduce((s, a) => s + a.distanceM, 0);
    return {
      date: key,
      label: format(d, labelFormat),
      runM,
      walkM,
      totalM: runM + walkM,
      count: acts.length,
      calories: acts.reduce((s, a) => s + a.calories, 0),
    };
  });
}

export function groupByDay(activities: Activity[]) {
  const map = new Map<string, Activity[]>();
  for (const a of activities) {
    const key = dayKey(a.startedAt);
    const list = map.get(key);
    if (list) list.push(a);
    else map.set(key, [a]);
  }
  return map;
}

export function activeDayKeys(activities: Activity[]) {
  return new Set(activities.map((a) => dayKey(a.startedAt)));
}

/**
 * Days in a row with ≥1 activity, ending today. If today has no activity yet,
 * the streak is still alive when yesterday was active.
 */
export function currentStreak(activities: Activity[], now = new Date()) {
  const days = activeDayKeys(activities);
  let d = startOfDay(now);
  if (!days.has(dayKey(d))) d = subDays(d, 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d = subDays(d, 1);
  }
  return n;
}

export function longestStreak(activities: Activity[]) {
  const keys = [...activeDayKeys(activities)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const d = fromDayKey(k);
    run = prev && differenceInCalendarDays(d, prev) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export interface TypeSpeed {
  count: number;
  /** Total distance / total moving time, in m/s (0 when there is nothing to measure). */
  avgMps: number;
  /** Fastest average speed of a single activity of at least 1 km, in m/s. */
  bestMps: number;
}

/** Average and best speed, separately for runs and walks. */
export function speedByType(activities: Activity[]): Record<'run' | 'walk', TypeSpeed> {
  const calc = (list: Activity[]): TypeSpeed => {
    const dist = list.reduce((s, a) => s + a.distanceM, 0);
    const time = list.reduce((s, a) => s + a.durationSec, 0);
    const best = list.filter((a) => a.distanceM >= 1000 && a.durationSec > 0).map((a) => a.distanceM / a.durationSec);
    return { count: list.length, avgMps: time > 0 ? dist / time : 0, bestMps: best.length ? Math.max(...best) : 0 };
  };
  return {
    run: calc(activities.filter((a) => a.type === 'run')),
    walk: calc(activities.filter((a) => a.type === 'walk')),
  };
}

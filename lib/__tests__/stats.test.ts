import { describe, expect, it } from 'vitest';
import {
  currentStreak,
  dailySeries,
  dayKey,
  longestStreak,
  monthStats,
  percentChange,
  periodRange,
  speedByType,
  todayStats,
  weekStats,
} from '@/lib/stats';
import { act } from './helpers';

// All dates are built with local constructors, so these pass in any timezone.
const at = (y: number, m: number, d: number, h = 8) => new Date(y, m - 1, d, h);

describe('streaks', () => {
  const days = [at(2026, 1, 30), at(2026, 1, 31), at(2026, 2, 1), at(2026, 2, 1, 19)];
  const acts = days.map((d) => act(d));

  it('counts days in a row across a month boundary', () => {
    expect(currentStreak(acts, at(2026, 2, 1, 22))).toBe(3);
  });

  it('keeps the streak alive until the end of the next day', () => {
    expect(currentStreak(acts, at(2026, 2, 2, 23))).toBe(3);
    expect(currentStreak(acts, at(2026, 2, 3, 9))).toBe(0);
  });

  it('finds the longest streak across month and year boundaries', () => {
    const list = [
      at(2025, 12, 30), at(2025, 12, 31), at(2026, 1, 1), at(2026, 1, 2), // 4 over new year
      at(2026, 2, 27), at(2026, 2, 28), at(2026, 3, 1), // 3 over end of February
      at(2026, 3, 10),
    ].map((d) => act(d));
    expect(longestStreak(list)).toBe(4);
    expect(longestStreak([])).toBe(0);
  });

  it('uses the local date, not UTC', () => {
    expect(dayKey(at(2026, 3, 5, 23))).toBe('2026-03-05');
    expect(dayKey(at(2026, 3, 6, 0))).toBe('2026-03-06');
  });
});

describe('period stats', () => {
  const now = at(2026, 11, 25, 12); // Wednesday
  const acts = [
    act(at(2026, 11, 25, 7), 'run', 5000),
    act(at(2026, 11, 23, 7), 'walk', 2000), // Monday, same week
    act(at(2026, 11, 22, 7), 'run', 8000), // Sunday, previous week
    act(at(2026, 10, 31, 7), 'run', 3000), // previous month
  ];

  it('weeks start on Monday', () => {
    expect(periodRange('week', now).from).toEqual(at(2026, 11, 23, 0));
    expect(weekStats(acts, now)).toMatchObject({ count: 2, runs: 1, walks: 1, distanceM: 7000 });
  });

  it('computes today and this month', () => {
    expect(todayStats(acts, now).count).toBe(1);
    expect(monthStats(acts, now)).toMatchObject({ count: 3, distanceM: 15000 });
  });

  it('builds a daily series with run/walk split', () => {
    const r = periodRange('week', now);
    const s = dailySeries(acts, r.from, r.to);
    expect(s).toHaveLength(7);
    expect(s[0]).toMatchObject({ date: '2026-11-23', walkM: 2000, runM: 0 });
    expect(s[2]).toMatchObject({ date: '2026-11-25', runM: 5000, label: 'Wed' });
  });

  it('computes % change', () => {
    expect(percentChange(15, 10)).toBe(50);
    expect(percentChange(5, 10)).toBe(-50);
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe('speedByType', () => {
  it('averages runs and walks separately and finds the best effort', () => {
    const runA = { ...act(at(2026, 3, 1), 'run', 5000), durationSec: 1500 }; // 3.33 m/s
    const runB = { ...act(at(2026, 3, 2), 'run', 10_000), durationSec: 3600 }; // 2.78 m/s
    const walk = { ...act(at(2026, 3, 3), 'walk', 3000), durationSec: 2160 }; // 1.39 m/s
    const s = speedByType([runA, runB, walk]);
    expect(s.run.count).toBe(2);
    expect(s.run.avgMps).toBeCloseTo(15_000 / 5100);
    expect(s.run.bestMps).toBeCloseTo(5000 / 1500);
    expect(s.walk.avgMps).toBeCloseTo(3000 / 2160);
    expect(speedByType([]).run).toEqual({ count: 0, avgMps: 0, bestMps: 0 });
  });
});

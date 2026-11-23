import { describe, expect, it } from 'vitest';
import { dailyTargets, dailyWaterMl, recoveryPlan, restingKcal, sleepRange, suggestMeals, sweatLossMl } from '@/lib/wellness';
import { buildDailyTasks, taskProgress } from '@/lib/tasks';
import { bearingDeg, directionMarkers } from '@/lib/geo';
import { line } from './helpers';

const profile = { weightKg: 70, heightCm: 175, age: 30, sex: 'male' as const };

describe('wellness targets', () => {
  it('computes resting energy with Mifflin–St Jeor', () => {
    expect(restingKcal(profile)).toBe(1649); // 700 + 1093.75 - 150 + 5
    expect(restingKcal({ ...profile, sex: 'female' })).toBe(1483);
  });

  it('estimates ~1 L/h of sweat for a 70 kg runner at 10 km/h', () => {
    expect(sweatLossMl('run', 3600, 10_000, 70)).toBe(980);
    expect(sweatLossMl('walk', 3600, 5000, 70)).toBeLessThan(400);
  });

  it('sets daily water from body weight plus sweat', () => {
    expect(dailyWaterMl(70)).toBe(2500);
    expect(dailyWaterMl(70, 800)).toBe(3500);
  });

  it('recommends sleep by age', () => {
    expect(sleepRange(16)).toEqual({ min: 8, max: 10 });
    expect(sleepRange(30)).toEqual({ min: 7, max: 9 });
    expect(sleepRange(70)).toEqual({ min: 7, max: 8 });
  });

  it('builds a recovery plan that scales with duration', () => {
    const short = recoveryPlan({ type: 'run', durationSec: 1800, distanceM: 5000 }, 70);
    const long = recoveryPlan({ type: 'run', durationSec: 6000, distanceM: 18_000 }, 70);
    expect(short.carbsG).toBe(35);
    expect(long.carbsG).toBe(85);
    expect(short.proteinG).toBe(20);
    expect(long.electrolytes).toBe(true);
    expect(short.waterMl).toBeGreaterThanOrEqual(250);
    expect(suggestMeals(long.carbsG, long.proteinG)).toHaveLength(3);
  });

  it('adds workouts to the day targets', () => {
    const rest = dailyTargets({ ...profile, dailyGoalSteps: 8000 }, 10);
    const runDay = dailyTargets({ ...profile, dailyGoalSteps: 8000 }, 10, [{ type: 'run', durationSec: 3600, distanceM: 10_000, calories: 686 }]);
    expect(runDay.waterMl).toBeGreaterThan(rest.waterMl);
    expect(runDay.kcal - rest.kcal).toBeGreaterThanOrEqual(650);
    expect(rest.proteinG).toEqual({ min: 85, max: 110 });
  });
});

describe('daily tasks', () => {
  const targets = dailyTargets({ ...profile, dailyGoalSteps: 8000 }, 10);
  const log = { date: '2026-11-23', waterMl: 2600, sleepHours: 7.5, exercises: [{ id: 'squat', at: 1 }], checks: { protein: true }, updatedAt: 1 };

  it('completes tasks from logged data and manual checks', () => {
    const tasks = buildDailyTasks({ log, todaySteps: 9000, todayActivities: 1, targets, customTasks: [{ id: 'a', title: 'Stretch' }], units: 'km', heightCm: 175 });
    const byId = Object.fromEntries(tasks.map((t) => [t.id, t.done]));
    expect(byId).toMatchObject({ move: true, exercise: false, water: true, protein: true, veg: false, recovery: false, sleep: true, 'custom:a': false });
    expect(taskProgress(tasks)).toEqual({ done: 4, total: 8 });
  });

  it('only asks for a recovery meal on workout days', () => {
    const tasks = buildDailyTasks({ log, todaySteps: 0, todayActivities: 0, targets, customTasks: [], units: 'km', heightCm: 175 });
    expect(tasks.some((t) => t.id === 'recovery')).toBe(false);
  });
});

describe('direction markers', () => {
  it('places evenly spaced arrows pointing along the route', () => {
    const pts = line({ lat: 51.5, lng: -0.12, t: 0, acc: 5 }, 100, 5); // 500 m due north
    const marks = directionMarkers(pts, 4);
    expect(marks).toHaveLength(4);
    for (const m of marks) expect(Math.round(m.bearing)).toBe(0);
    expect(Math.round(bearingDeg({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }))).toBe(90);
  });
});

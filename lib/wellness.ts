import type { Activity, ActivityType, Sex } from '@/data/types';
import { metFor } from './fitness';

// General guidance from public sports-nutrition and health guidelines (WHO activity guidelines,
// Mifflin–St Jeor energy equation, common sports-dietitian recovery advice). Not medical advice.

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export interface BodyProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
}

/** Resting energy (kcal/day), Mifflin–St Jeor. 'unspecified' uses the midpoint of the two formulas. */
export function restingKcal({ weightKg, heightCm, age, sex }: BodyProfile) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === 'male' ? 5 : sex === 'female' ? -161 : -78));
}

/** Rough sweat loss in ml: ~1 L per hour for a 70 kg runner at 10 km/h, scaled by intensity (MET) and weight. */
export function sweatLossMl(type: ActivityType, durationSec: number, distanceM: number, weightKg: number) {
  if (durationSec <= 0) return 0;
  const speed = distanceM > 0 ? (distanceM / durationSec) * 3.6 : undefined;
  return Math.round(0.1 * metFor(type, speed) * (weightKg / 70) * (durationSec / 3600) * 1000);
}

/** Daily drinking target: ~35 ml per kg of body weight, plus 125% of what was sweated out in workouts. */
export function dailyWaterMl(weightKg: number, sweatMl = 0) {
  return roundTo(35 * weightKg + sweatMl * 1.25, 100);
}

/** Hours of sleep recommended for an age (US National Sleep Foundation / AASM ranges). */
export function sleepRange(age: number) {
  if (age < 13) return { min: 9, max: 12 };
  if (age < 18) return { min: 8, max: 10 };
  if (age < 65) return { min: 7, max: 9 };
  return { min: 7, max: 8 };
}

/** Daily carbohydrate range (g/kg) scaled by how much you train each week. */
function carbsPerKg(weeklyKm: number): [number, number] {
  if (weeklyKm < 20) return [3, 5];
  if (weeklyKm < 50) return [5, 7];
  return [6, 8];
}

export interface DailyTargets {
  steps: number;
  activeMinutes: number;
  exercises: number;
  waterMl: number;
  kcal: number;
  proteinG: { min: number; max: number };
  carbsG: { min: number; max: number };
  sleepH: { min: number; max: number };
}

/**
 * How much to move, exercise, drink, eat and sleep today.
 * `todayActivities` add their sweat to the water target and their calories to the energy target.
 */
export function dailyTargets(
  profile: BodyProfile & { dailyGoalSteps: number },
  weeklyKm: number,
  todayActivities: Pick<Activity, 'type' | 'durationSec' | 'distanceM' | 'calories'>[] = [],
): DailyTargets {
  const w = profile.weightKg;
  const sweat = todayActivities.reduce((s, a) => s + sweatLossMl(a.type, a.durationSec, a.distanceM, w), 0);
  const activeKcal = todayActivities.reduce((s, a) => s + a.calories, 0);
  const [cMin, cMax] = carbsPerKg(weeklyKm);
  return {
    steps: profile.dailyGoalSteps,
    activeMinutes: 30, // WHO: 150–300 min of moderate activity a week
    exercises: 3, // a short bodyweight strength routine; WHO: strength work 2+ days a week
    waterMl: dailyWaterMl(w, sweat),
    kcal: roundTo(restingKcal(profile) * 1.2 + activeKcal, 50),
    proteinG: { min: roundTo(1.2 * w, 5), max: roundTo(1.6 * w, 5) },
    carbsG: { min: roundTo(cMin * w, 10), max: roundTo(cMax * w, 10) },
    sleepH: sleepRange(profile.age),
  };
}

export interface RecoveryPlan {
  sweatMl: number;
  waterMl: number;
  carbsG: number;
  proteinG: number;
  electrolytes: boolean;
  when: string;
}

/** What to drink and eat after one activity. */
export function recoveryPlan(a: Pick<Activity, 'type' | 'durationSec' | 'distanceM'>, weightKg: number): RecoveryPlan {
  const sweatMl = sweatLossMl(a.type, a.durationSec, a.distanceM, weightKg);
  const minutes = a.durationSec / 60;
  const perKg = minutes < 45 ? 0.5 : minutes < 90 ? 1.0 : 1.2;
  return {
    sweatMl,
    waterMl: Math.max(250, roundTo(sweatMl * 1.25, 50)),
    carbsG: roundTo(perKg * weightKg, 5),
    proteinG: Math.min(40, roundTo(0.3 * weightKg, 5)),
    electrolytes: minutes >= 60 || sweatMl >= 1000,
    when: minutes < 45 ? 'with your next meal' : 'within an hour',
  };
}

export interface Meal {
  name: string;
  carbsG: number;
  proteinG: number;
}

/** Simple, easy-to-find recovery meals with approximate macros. */
export const RECOVERY_MEALS: Meal[] = [
  { name: 'Banana + a glass of milk', carbsG: 40, proteinG: 9 },
  { name: 'Curd rice (1 bowl)', carbsG: 45, proteinG: 8 },
  { name: 'Poha with peanuts', carbsG: 50, proteinG: 8 },
  { name: '2 eggs + 2 slices of toast', carbsG: 30, proteinG: 18 },
  { name: 'Dal, rice & salad', carbsG: 70, proteinG: 15 },
  { name: 'Sprouts chaat', carbsG: 30, proteinG: 12 },
  { name: 'Paneer roti roll', carbsG: 45, proteinG: 20 },
  { name: 'Oats with milk & fruit', carbsG: 60, proteinG: 15 },
  { name: 'Yogurt with honey & berries', carbsG: 35, proteinG: 15 },
  { name: 'Chicken & rice bowl', carbsG: 60, proteinG: 30 },
];

/** The `n` meals whose carbs and protein are closest to the target. */
export function suggestMeals(carbsG: number, proteinG: number, n = 3) {
  return [...RECOVERY_MEALS]
    .sort((a, b) => Math.abs(a.carbsG - carbsG) + Math.abs(a.proteinG - proteinG) - (Math.abs(b.carbsG - carbsG) + Math.abs(b.proteinG - proteinG)))
    .slice(0, n);
}

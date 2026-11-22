import type { ActivityType } from '@/data/types';

/** Default MET when the speed is unknown. */
export const DEFAULT_MET: Record<ActivityType, number> = { walk: 3.5, run: 9.8 };

// [speed km/h, MET] — from the Compendium of Physical Activities, interpolated linearly in between.
const MET_TABLE: Record<ActivityType, [number, number][]> = {
  walk: [[2, 2.0], [3, 3.0], [5, 3.8], [5.6, 4.3], [6.4, 5.0], [7.2, 7.0]],
  run: [[6.4, 6.0], [8, 8.3], [10, 9.8], [12, 11.8], [14.5, 12.8], [16.1, 14.5]],
};

/** MET for an activity at a given speed. Clamped to the ends of the table. */
export function metFor(type: ActivityType, speedKmh?: number) {
  if (!speedKmh || !Number.isFinite(speedKmh) || speedKmh <= 0) return DEFAULT_MET[type];
  const table = MET_TABLE[type];
  if (speedKmh <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [s1, m1] = table[i];
    if (speedKmh <= s1) {
      const [s0, m0] = table[i - 1];
      return m0 + ((speedKmh - s0) / (s1 - s0)) * (m1 - m0);
    }
  }
  return table[table.length - 1][1];
}

/** kcal = MET × weightKg × hours, with MET picked from the average speed. */
export function caloriesKcal(opts: { type: ActivityType; weightKg: number; durationSec: number; distanceM: number }) {
  const { type, weightKg, durationSec, distanceM } = opts;
  if (durationSec <= 0 || weightKg <= 0) return 0;
  const speed = distanceM > 0 ? (distanceM / durationSec) * 3.6 : undefined;
  return Math.round(metFor(type, speed) * weightKg * (durationSec / 3600));
}

/** Stride length estimate in meters. */
export function strideM(type: ActivityType, heightCm: number) {
  return (heightCm * (type === 'walk' ? 0.415 : 0.65)) / 100;
}

/** Steps estimated from distance and stride (label it "est. steps" in the UI). */
export function estimateSteps(type: ActivityType, distanceM: number, heightCm: number) {
  const stride = strideM(type, heightCm);
  return stride > 0 ? Math.round(distanceM / stride) : 0;
}

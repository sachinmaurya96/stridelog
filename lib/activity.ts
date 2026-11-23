import type { Activity, ActivityType, GeoPoint } from '@/data/types';
import { computeSplits, paceSecPerKm, totalDistance } from './geo';
import { caloriesKcal, estimateSteps } from './fitness';
import { activityTitle } from './format';

interface FinishedSession {
  type: ActivityType;
  route: GeoPoint[];
  startedAt: number;
  endedAt: number;
  movingMs: number;
  maxSpeedMps: number;
}

/** Turns a finished tracking session into the Activity record that gets saved. */
export function buildActivity(
  s: FinishedSession,
  profile: { weightKg: number; heightCm: number },
  id: string,
  title?: string,
): Activity {
  const durationSec = Math.round(s.movingMs / 1000);
  const distanceM = totalDistance(s.route);
  return {
    id,
    type: s.type,
    title: title?.trim() || activityTitle(s.type, s.startedAt),
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationSec,
    distanceM,
    avgPaceSecPerKm: paceSecPerKm(distanceM, durationSec),
    maxSpeedMps: s.maxSpeedMps,
    calories: caloriesKcal({ type: s.type, weightKg: profile.weightKg, durationSec, distanceM }),
    steps: estimateSteps(s.type, distanceM, profile.heightCm),
    route: s.route,
    splits: computeSplits(s.route),
    createdAt: Date.now(),
  };
}

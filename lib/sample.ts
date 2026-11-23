import { nanoid } from 'nanoid';
import type { Activity, ActivityType, GeoPoint } from '@/data/types';
import { computeSplits, movingTimeSec, paceSecPerKm, totalDistance } from './geo';
import { caloriesKcal, estimateSteps } from './fitness';
import { DEFAULT_SIM_CENTER } from './simulate';

/** A believable fake activity (a loop in a park) for testing storage without going outside. */
export function createSampleActivity(
  type: ActivityType = 'run',
  startedAt = Date.now() - 45 * 60_000,
  profile = { weightKg: 70, heightCm: 170 },
  /** Scales the loop size and nudges the pace, so generated history isn't identical. */
  variety = 1,
): Activity {
  const center = DEFAULT_SIM_CENTER;
  const radiusM = (type === 'run' ? 650 : 400) * variety;
  const targetPace = (type === 'run' ? 330 : 690) * (0.92 + 0.16 * ((variety * 7) % 1));
  const n = 240;
  const lengthM = 2 * Math.PI * radiusM;
  const stepSec = ((lengthM / 1000) * targetPace) / n;
  let t = startedAt;
  const route: GeoPoint[] = Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    const wobble = 1 + 0.08 * Math.sin(a * 5);
    if (i > 0) t += Math.round(stepSec * (1 + 0.15 * Math.sin(i / 9)) * 1000);
    return {
      lat: center.lat + ((radiusM * wobble) / 111_320) * Math.sin(a),
      lng: center.lng + ((radiusM * wobble) / (111_320 * Math.cos((center.lat * Math.PI) / 180))) * (1 - Math.cos(a)),
      t,
      acc: 5,
      seg: 0,
    };
  });
  const distanceM = totalDistance(route);
  const durationSec = Math.round(movingTimeSec(route));
  return {
    id: nanoid(),
    type,
    title: type === 'run' ? 'Sample Run' : 'Sample Walk',
    startedAt,
    endedAt: route[route.length - 1].t,
    durationSec,
    distanceM,
    avgPaceSecPerKm: paceSecPerKm(distanceM, durationSec),
    maxSpeedMps: (1000 / targetPace) * 1.2,
    calories: caloriesKcal({ type, weightKg: profile.weightKg, durationSec, distanceM }),
    steps: estimateSteps(type, distanceM, profile.heightCm),
    route,
    splits: computeSplits(route),
    createdAt: Date.now(),
  };
}

/** About six weeks of realistic history (dev only), ending yesterday, for exploring the dashboard. */
export function createDemoHistory(now = new Date(), profile = { weightKg: 70, heightCm: 170 }, days = 42): Activity[] {
  const out: Activity[] = [];
  for (let d = days; d >= 1; d--) {
    if (Math.random() < 0.35) continue; // rest day
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const sessions = Math.random() < 0.15 ? 2 : 1;
    for (let s = 0; s < sessions; s++) {
      const type: ActivityType = Math.random() < 0.55 ? 'run' : 'walk';
      const hour = s === 0 ? (Math.random() < 0.2 ? 6 : 7 + Math.floor(Math.random() * 3)) : 18 + Math.floor(Math.random() * 3);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(Math.random() * 60));
      const a = createSampleActivity(type, start.getTime(), profile, 0.6 + Math.random() * 1.1);
      out.push({ ...a, title: undefined });
    }
  }
  return out;
}

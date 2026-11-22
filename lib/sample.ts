import { nanoid } from 'nanoid';
import type { Activity, ActivityType, GeoPoint } from '@/data/types';

/** A believable fake activity (a loop in a park) for testing storage without going outside. */
export function createSampleActivity(type: ActivityType = 'run', startedAt = Date.now() - 45 * 60_000): Activity {
  const center = { lat: 51.5074, lng: -0.1657 };
  const radiusM = type === 'run' ? 600 : 400;
  const paceSecPerKm = type === 'run' ? 330 : 690;
  const laps = 1;
  const distanceM = 2 * Math.PI * radiusM * laps;
  const durationSec = Math.round((distanceM / 1000) * paceSecPerKm);
  const n = 120;
  const route: GeoPoint[] = Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * 2 * Math.PI * laps;
    return {
      lat: center.lat + (radiusM / 111_320) * Math.sin(a),
      lng: center.lng + (radiusM / (111_320 * Math.cos((center.lat * Math.PI) / 180))) * (1 - Math.cos(a)),
      t: startedAt + Math.round((i / n) * durationSec * 1000),
      acc: 5,
      seg: 0,
    };
  });
  return {
    id: nanoid(),
    type,
    title: type === 'run' ? 'Sample Run' : 'Sample Walk',
    startedAt,
    endedAt: startedAt + durationSec * 1000,
    durationSec,
    distanceM,
    avgPaceSecPerKm: paceSecPerKm,
    maxSpeedMps: 1000 / paceSecPerKm + 0.6,
    calories: Math.round((type === 'run' ? 9.8 : 3.5) * 70 * (durationSec / 3600)),
    steps: Math.round(distanceM / (type === 'run' ? 1.1 : 0.7)),
    route,
    splits: [],
    createdAt: Date.now(),
  };
}

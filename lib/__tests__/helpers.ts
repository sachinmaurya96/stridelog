import type { Activity, ActivityType, GeoPoint } from '@/data/types';

const M_PER_DEG_LAT = 111_194.93;

/** A point `meters` north of `p`, `dtSec` seconds later. */
export function north(p: GeoPoint, meters: number, dtSec = 1, extra: Partial<GeoPoint> = {}): GeoPoint {
  return { ...p, lat: p.lat + meters / M_PER_DEG_LAT, t: p.t + dtSec * 1000, ...extra };
}

/** A straight line going north at `speedMps`, one point per second. */
export function line(start: GeoPoint, seconds: number, speedMps: number, seg = 0): GeoPoint[] {
  const pts: GeoPoint[] = [{ ...start, seg }];
  for (let i = 0; i < seconds; i++) pts.push(north(pts[pts.length - 1], speedMps, 1, { seg }));
  return pts;
}

export function act(startedAt: Date, type: ActivityType = 'run', distanceM = 5000): Activity {
  return {
    id: `${type}-${startedAt.getTime()}`,
    type,
    startedAt: startedAt.getTime(),
    endedAt: startedAt.getTime() + 1_800_000,
    durationSec: 1800,
    distanceM,
    avgPaceSecPerKm: 360,
    maxSpeedMps: 4,
    calories: 300,
    steps: 5000,
    route: [],
    splits: [],
    createdAt: startedAt.getTime(),
  };
}

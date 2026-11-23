import type { ActivityType, GeoPoint, Split } from '@/data/types';

type LatLng = { lat: number; lng: number };

// Haversine distance in meters
export function distanceM(a: LatLng, b: LatLng) {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Two consecutive points are only joined when no pause happened between them. */
export const sameSegment = (a: GeoPoint, b: GeoPoint) => (a.seg ?? 0) === (b.seg ?? 0);

/** Total distance in meters, ignoring the gaps between pause segments. */
export function totalDistance(points: GeoPoint[]) {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    if (sameSegment(points[i - 1], points[i])) d += distanceM(points[i - 1], points[i]);
  }
  return d;
}

/** Seconds per km. Returns 0 when there isn't enough distance to say. */
export function paceSecPerKm(distanceM: number, durationSec: number) {
  if (distanceM < 1 || durationSec <= 0) return 0;
  return durationSec / (distanceM / 1000);
}

export function speedKmh(distanceM: number, durationSec: number) {
  return durationSec > 0 ? (distanceM / durationSec) * 3.6 : 0;
}

/**
 * Time taken for each full kilometre (or `unitM`, e.g. a mile), interpolated at the exact mark.
 * Pause gaps are excluded. `paceSecPerKm` is always seconds per km, so it formats with any units.
 */
export function computeSplits(points: GeoPoint[], unitM = 1000): Split[] {
  const splits: Split[] = [];
  let dist = 0;
  let time = 0;
  let splitStart = 0;
  let km = 1;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (!sameSegment(a, b)) continue;
    let d = distanceM(a, b);
    let dt = Math.max(0, (b.t - a.t) / 1000);
    while (d > 0 && dist + d >= km * unitM) {
      const need = km * unitM - dist;
      const frac = need / d;
      const tAt = time + dt * frac;
      splits.push({ km, paceSecPerKm: Math.round(((tAt - splitStart) * 1000) / unitM) });
      splitStart = tAt;
      dist += need;
      time = tAt;
      d -= need;
      dt -= dt * frac;
      km++;
    }
    dist += d;
    time += dt;
  }
  return splits;
}

export const MAX_ACCURACY_M = 30;
export const MIN_MOVE_M = 3;
export const MAX_SPEED_MPS: Record<ActivityType, number> = { run: 12, walk: 4 };

/**
 * GPS noise filter. `prev` is the last accepted point of the current segment (or null for a new segment).
 * - reject if accuracy is worse than 30 m
 * - reject if moved < 3 m (jitter while standing still)
 * - reject if the implied speed is impossible (> 12 m/s run, > 4 m/s walk)
 */
export function shouldAcceptPoint(prev: GeoPoint | null | undefined, next: GeoPoint, type: ActivityType) {
  if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return false;
  if (next.acc > MAX_ACCURACY_M) return false;
  if (!prev) return true;
  const d = distanceM(prev, next);
  if (d < MIN_MOVE_M) return false;
  const dt = (next.t - prev.t) / 1000;
  if (dt <= 0) return false;
  return d / dt <= MAX_SPEED_MPS[type];
}

/** Pace over the last `windowSec` seconds of the current segment (0 if not enough data). */
export function rollingPaceSecPerKm(points: GeoPoint[], windowSec = 30) {
  if (points.length < 2) return 0;
  const last = points[points.length - 1];
  let d = 0;
  let first = last;
  for (let i = points.length - 1; i > 0; i--) {
    const a = points[i - 1], b = points[i];
    if (!sameSegment(a, b) || (last.t - a.t) / 1000 > windowSec) break;
    d += distanceM(a, b);
    first = a;
  }
  const dt = (last.t - first.t) / 1000;
  if (d < 10 || dt < 5) return 0;
  return paceSecPerKm(d, dt);
}

/**
 * Average speed over at least the last `minWindowSec` seconds of the current segment
 * (0 until there is that much data). Used for max speed, so one noisy fix can't fake a sprint.
 */
export function recentSpeedMps(points: GeoPoint[], minWindowSec = 5) {
  const last = points[points.length - 1];
  let d = 0;
  for (let i = points.length - 1; i > 0; i--) {
    const a = points[i - 1], b = points[i];
    if (!sameSegment(a, b)) break;
    d += distanceM(a, b);
    const span = (last.t - a.t) / 1000;
    if (span >= minWindowSec) return d / span;
  }
  return 0;
}

/** Groups a flat route into pause-separated segments for drawing polylines. */
export function toSegments(points: GeoPoint[]): GeoPoint[][] {
  const segs: GeoPoint[][] = [];
  for (const p of points) {
    const cur = segs[segs.length - 1];
    if (cur && sameSegment(cur[cur.length - 1], p)) cur.push(p);
    else segs.push([p]);
  }
  return segs;
}

export function boundsOf(points: LatLng[]): [[number, number], [number, number]] | null {
  if (!points.length) return null;
  let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  return [[minLat, minLng], [maxLat, maxLng]];
}

/** Moving time in seconds from point timestamps, excluding pause gaps. */
export function movingTimeSec(points: GeoPoint[]) {
  let t = 0;
  for (let i = 1; i < points.length; i++) {
    if (sameSegment(points[i - 1], points[i])) t += Math.max(0, points[i].t - points[i - 1].t) / 1000;
  }
  return t;
}

export interface PacePoint {
  /** Moving time at the end of the bucket, in seconds. */
  t: number;
  paceSecPerKm: number;
}

/**
 * Pace over moving time, in buckets of `bucketSec` (pauses excluded). Buckets where you were
 * basically standing still (slower than 30 min/km) are skipped so they don't flatten the chart.
 */
export function paceSeries(points: GeoPoint[], bucketSec = 30): PacePoint[] {
  const out: PacePoint[] = [];
  let t = 0;
  let bucketD = 0;
  let bucketT = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (!sameSegment(a, b)) continue;
    const dt = Math.max(0, (b.t - a.t) / 1000);
    t += dt;
    bucketT += dt;
    bucketD += distanceM(a, b);
    if (bucketT >= bucketSec) {
      const pace = paceSecPerKm(bucketD, bucketT);
      if (pace > 0 && pace < 1800) out.push({ t: Math.round(t), paceSecPerKm: Math.round(pace) });
      bucketD = 0;
      bucketT = 0;
    }
  }
  return out;
}

/** Compass bearing in degrees (0 = north) from `a` to `b`. */
export function bearingDeg(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** `count` evenly spaced points along the route, each with the direction of travel (for arrows on the map). */
export function directionMarkers(points: GeoPoint[], count = 6): (LatLng & { bearing: number })[] {
  const total = totalDistance(points);
  if (total < 50 || count < 1) return [];
  const step = total / (count + 1);
  const out: (LatLng & { bearing: number })[] = [];
  let walked = 0;
  let next = step;
  for (let i = 1; i < points.length && out.length < count; i++) {
    const a = points[i - 1], b = points[i];
    if (!sameSegment(a, b)) continue;
    const d = distanceM(a, b);
    while (d > 0 && walked + d >= next && out.length < count) {
      const f = (next - walked) / d;
      out.push({ lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f, bearing: bearingDeg(a, b) });
      next += step;
    }
    walked += d;
  }
  return out;
}

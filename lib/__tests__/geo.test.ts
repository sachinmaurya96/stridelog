import { describe, expect, it } from 'vitest';
import {
  computeSplits,
  distanceM,
  paceSecPerKm,
  recentSpeedMps,
  rollingPaceSecPerKm,
  shouldAcceptPoint,
  toSegments,
  totalDistance,
} from '@/lib/geo';
import type { GeoPoint } from '@/data/types';
import { line, north } from './helpers';

const origin: GeoPoint = { lat: 51.5, lng: -0.12, t: 1_700_000_000_000, acc: 5 };

describe('distanceM (haversine)', () => {
  it('is 0 for the same point', () => {
    expect(distanceM(origin, origin)).toBe(0);
  });

  it('measures one degree of latitude as ~111.195 km', () => {
    expect(Math.abs(distanceM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) - 111_194.93)).toBeLessThan(1);
  });

  it('measures London → Paris as ~343.5 km', () => {
    const d = distanceM({ lat: 51.5074, lng: -0.1278 }, { lat: 48.8566, lng: 2.3522 });
    expect(Math.abs(d - 343_500) / 343_500).toBeLessThan(0.005);
  });
});

describe('shouldAcceptPoint (GPS noise filter)', () => {
  it('accepts the first point of a segment when accuracy is good', () => {
    expect(shouldAcceptPoint(null, origin, 'run')).toBe(true);
  });

  it('rejects points with accuracy worse than 30 m', () => {
    expect(shouldAcceptPoint(null, { ...origin, acc: 31 }, 'walk')).toBe(false);
    expect(shouldAcceptPoint(origin, north(origin, 10, 5, { acc: 45 }), 'walk')).toBe(false);
    expect(shouldAcceptPoint(origin, north(origin, 10, 5, { acc: 30 }), 'walk')).toBe(true);
  });

  it('rejects jitter of less than 3 m', () => {
    expect(shouldAcceptPoint(origin, north(origin, 2, 1), 'walk')).toBe(false);
    expect(shouldAcceptPoint(origin, north(origin, 3.5, 2), 'walk')).toBe(true);
  });

  it('rejects impossible speeds for the activity type', () => {
    const fast = north(origin, 50, 10); // 5 m/s
    expect(shouldAcceptPoint(origin, fast, 'walk')).toBe(false);
    expect(shouldAcceptPoint(origin, fast, 'run')).toBe(true);
    expect(shouldAcceptPoint(origin, north(origin, 130, 10), 'run')).toBe(false); // 13 m/s
  });

  it('rejects points that do not move forward in time', () => {
    expect(shouldAcceptPoint(origin, north(origin, 10, 0), 'run')).toBe(false);
  });
});

describe('distance, pace and splits', () => {
  it('sums a straight line', () => {
    const pts = line(origin, 100, 3); // 300 m
    expect(totalDistance(pts)).toBeCloseTo(300, 0);
  });

  it('does not join segments across a pause', () => {
    const a = line(origin, 100, 3, 0);
    const b = line(north(a[a.length - 1], 500, 600), 100, 3, 1); // moved 500 m while paused
    const pts = [...a, ...b];
    expect(totalDistance(pts)).toBeCloseTo(600, 0);
    expect(toSegments(pts)).toHaveLength(2);
  });

  it('computes pace in seconds per km', () => {
    expect(paceSecPerKm(1000, 342)).toBe(342);
    expect(paceSecPerKm(5000, 1500)).toBe(300);
    expect(paceSecPerKm(0, 100)).toBe(0);
  });

  it('computes a split for every full km', () => {
    const pts = line(origin, 500, 5); // 2.5 km at 5 m/s → 200 s per km
    const splits = computeSplits(pts);
    expect(splits.map((s) => s.km)).toEqual([1, 2]);
    for (const s of splits) expect(Math.abs(s.paceSecPerKm - 200)).toBeLessThanOrEqual(1);
  });

  it('excludes paused time from splits', () => {
    const a = line(origin, 101, 5, 0); // 505 m in 101 s
    const b = line(north(a[a.length - 1], 0.1, 900), 101, 5, 1); // 15 min pause, then 505 m in 101 s
    const [split] = computeSplits([...a, ...b]);
    expect(Math.abs(split.paceSecPerKm - 200)).toBeLessThanOrEqual(1);
  });

  it('computes a rolling pace over the last 30 s', () => {
    const slow = line(origin, 60, 2); // 500 s/km
    const fast = line(slow[slow.length - 1], 40, 4).slice(1); // 250 s/km
    expect(rollingPaceSecPerKm([...slow, ...fast], 30)).toBeCloseTo(250, 0);
  });
});

describe('mile splits', () => {
  it('reports pace per km equivalent for each full mile', () => {
    const pts = line(origin, 700, 5); // 3.5 km at 5 m/s
    const splits = computeSplits(pts, 1609.344);
    expect(splits).toHaveLength(2);
    expect(Math.abs(splits[0].paceSecPerKm - 200)).toBeLessThanOrEqual(1);
  });
});

describe('recentSpeedMps', () => {
  it('averages over a window so a single short gap does not create a spike', () => {
    const pts = line(origin, 20, 3);
    pts.push(north(pts[pts.length - 1], 4, 0.3)); // 13 m/s for one 0.3 s gap
    expect(recentSpeedMps(pts, 5)).toBeLessThan(4);
    expect(recentSpeedMps(pts.slice(0, 3), 5)).toBe(0);
  });
});

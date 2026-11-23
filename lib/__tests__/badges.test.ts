import { describe, expect, it } from 'vitest';
import { BADGES, buildBadgeContext, evaluateBadges, formatProgress, progressFraction } from '@/lib/badges';
import { act } from './helpers';

const at = (y: number, m: number, d: number, h = 8) => new Date(y, m - 1, d, h);
const ids = (list: { id: string }[]) => list.map((b) => b.id).sort();

describe('badges', () => {
  it('a 5 km run unlocks First Run and 5K Finisher', () => {
    const ctx = buildBadgeContext([act(at(2026, 11, 23), 'run', 5000)], 0, 0, at(2026, 11, 23, 12));
    expect(ids(evaluateBadges(ctx, []))).toEqual(['5k', 'first-run']);
  });

  it('does not unlock a badge twice', () => {
    const ctx = buildBadgeContext([act(at(2026, 11, 23), 'run', 5000)], 0, 0);
    expect(evaluateBadges(ctx, [{ id: '5k', unlockedAt: 1 }, { id: 'first-run', unlockedAt: 1 }])).toEqual([]);
  });

  it('a walk unlocks First Steps but not run badges', () => {
    const ctx = buildBadgeContext([act(at(2026, 11, 23), 'walk', 12_000)], 0, 0);
    expect(ids(evaluateBadges(ctx, []))).toEqual(['first-steps']);
  });

  it('streak badges use the longest streak ever', () => {
    const list = [1, 2, 3, 4, 5, 6, 7].map((d) => act(at(2026, 3, d), 'walk', 1000));
    const got = ids(evaluateBadges(buildBadgeContext(list, 0, 0, at(2026, 6, 1)), []));
    expect(got).toContain('streak-3');
    expect(got).toContain('streak-7');
    expect(got).toContain('busy-week');
    expect(got).not.toContain('streak-30');
  });

  it('early bird and night owl use the local start hour', () => {
    const got = ids(evaluateBadges(buildBadgeContext([act(at(2026, 3, 1, 6)), act(at(2026, 3, 2, 21))], 0, 0), []));
    expect(got).toContain('early-bird');
    expect(got).toContain('night-owl');
  });

  it('speedster needs ≥ 3 km under 5:00/km', () => {
    const fastShort = { ...act(at(2026, 3, 1), 'run', 2000), avgPaceSecPerKm: 250 };
    const fastLong = { ...act(at(2026, 3, 2), 'run', 3200), avgPaceSecPerKm: 295 };
    expect(ids(evaluateBadges(buildBadgeContext([fastShort], 0, 0), []))).not.toContain('speedster');
    expect(ids(evaluateBadges(buildBadgeContext([fastLong], 0, 0), []))).toContain('speedster');
  });

  it('notes and photos badges', () => {
    const got = ids(evaluateBadges(buildBadgeContext([], 7, 30), []));
    expect(got).toEqual(['journaler', 'progress-pics']);
  });

  it('formats progress hints', () => {
    const ctx = buildBadgeContext([act(at(2026, 3, 1), 'run', 7400)], 2, 0);
    const tenK = BADGES.find((b) => b.id === '10k')!.progress!(ctx);
    expect(formatProgress(tenK)).toBe('7.4 / 10 km');
    expect(progressFraction(tenK)).toBeCloseTo(0.74);
    expect(formatProgress(BADGES.find((b) => b.id === 'streak-7')!.progress!(ctx))).toBe('Streak 1 / 7');
    expect(formatProgress(BADGES.find((b) => b.id === 'journaler')!.progress!(ctx))).toBe('2 / 7');
  });
});

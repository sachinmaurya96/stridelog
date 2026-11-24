import { describe, expect, it } from 'vitest';
import { EXERCISE_VISUALS, type Point } from '@/data/exerciseVisuals';
import { blendPoses, buildTimeline, positionAt, resolvePose } from '@/lib/exerciseMotion';

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const jacks = EXERCISE_VISUALS['jumping-jacks'];

describe('exercise motion', () => {
  it('starts and ends a blend exactly on the key poses', () => {
    const [a, b] = jacks.positions.map((p) => resolvePose(p.pose));
    for (const [t, pose] of [[0, a], [1, b]] as const) {
      const blended = blendPoses(a, b, t);
      expect(blended.head[0]).toBeCloseTo(pose.head[0]);
      expect(blended.arms[1][1][1]).toBeCloseTo(pose.arms[1][1][1]);
      expect(blended.toes[0][0]).toBeCloseTo(pose.toes[0][0]);
    }
  });

  it('swings arms around the shoulder instead of shortening them', () => {
    const [a, b] = jacks.positions.map((p) => resolvePose(p.pose));
    const halfway = blendPoses(a, b, 0.5);
    const upper = dist(halfway.shoulder, halfway.arms[0][0]);
    expect(upper).toBeCloseTo((dist(a.shoulder, a.arms[0][0]) + dist(b.shoulder, b.arms[0][0])) / 2);
    // Halfway through raising the arms, the elbow is out to the side, level with the shoulder.
    expect(halfway.arms[0][0][0]).toBeLessThan(halfway.shoulder[0] - 30);
  });

  it('builds a closed loop with ordered key times for every exercise', () => {
    for (const visual of Object.values(EXERCISE_VISUALS)) {
      const timeline = buildTimeline(visual);
      expect(timeline.frames).toHaveLength(timeline.keyTimes.length);
      expect(timeline.keyTimes[0]).toBe(0);
      expect(timeline.keyTimes.at(-1)).toBe(1);
      timeline.keyTimes.slice(1).forEach((t, i) => expect(t).toBeGreaterThan(timeline.keyTimes[i]));
      expect(timeline.frames.at(-1)).toEqual(timeline.frames[0]);
    }
  });

  it('repeats alternating moves on the other leg', () => {
    const timeline = buildTimeline(EXERCISE_VISUALS['reverse-lunge']);
    const lunge = resolvePose(EXERCISE_VISUALS['reverse-lunge'].positions[1].pose);
    expect(timeline.frames.some((f) => f.legs[0] === lunge.legs[0])).toBe(true);
    expect(timeline.frames.some((f) => f.legs[1] === lunge.legs[0] && f.legs[0] === lunge.legs[1])).toBe(true);
    expect(timeline.marks.map((m) => m.position)).toEqual([0, 1, 0, 1, 0]);
  });

  it('holds the final position longest for static holds', () => {
    const timeline = buildTimeline(EXERCISE_VISUALS.plank);
    expect(positionAt(timeline, 0)).toBe(0);
    expect(positionAt(timeline, 0.6)).toBe(1);
    expect(positionAt(timeline, 0.99)).toBe(0);
  });
});

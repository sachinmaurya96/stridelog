// Turns an exercise's key positions into one smooth, looping movement.
import type { ExercisePose, ExerciseVisual, Point, Tempo } from '@/data/exerciseVisuals';

/** A pose with every optional point filled in, so any two poses can be blended. */
export interface ResolvedPose extends ExercisePose {
  toes: readonly [Point, Point];
  bend: Point;
}

export interface MotionTimeline {
  frames: ResolvedPose[];
  /** Fraction of the loop (0–1) at which each frame is reached. */
  keyTimes: number[];
  durationMs: number;
  /** The position to label as current from each fraction of the loop onwards. */
  marks: { at: number; position: number }[];
}

const TEMPO: Record<Tempo, { moveMs: number; holdMs: number; finalHoldMs?: number }> = {
  quick: { moveMs: 380, holdMs: 120 },
  steady: { moveMs: 850, holdMs: 450 },
  slow: { moveMs: 1400, holdMs: 800 },
  swing: { moveMs: 700, holdMs: 60 },
  hold: { moveMs: 1100, holdMs: 500, finalHoldMs: 2600 },
};

const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

export function resolvePose(pose: ExercisePose): ResolvedPose {
  const toe = (i: 0 | 1): Point =>
    pose.toes?.[i] ?? [pose.legs[i][1][0] + 11, Math.min(217, pose.legs[i][1][1] + 5)];
  return { ...pose, toes: [toe(0), toe(1)], bend: pose.bend ?? mid(pose.shoulder, pose.hip) };
}

/** Blends a chain of joints bone by bone: each turns about its parent joint along the shorter arc. */
function chain(root: Point, a: readonly Point[], b: readonly Point[], t: number): Point[] {
  const joints: Point[] = [];
  let at = root;
  for (let i = 1; i < a.length; i++) {
    const angleA = Math.atan2(a[i][1] - a[i - 1][1], a[i][0] - a[i - 1][0]);
    const angleB = Math.atan2(b[i][1] - b[i - 1][1], b[i][0] - b[i - 1][0]);
    const turn = Math.atan2(Math.sin(angleB - angleA), Math.cos(angleB - angleA));
    const angle = angleA + turn * t;
    const length = lerp(Math.hypot(a[i][0] - a[i - 1][0], a[i][1] - a[i - 1][1]), Math.hypot(b[i][0] - b[i - 1][0], b[i][1] - b[i - 1][1]), t);
    at = [at[0] + Math.cos(angle) * length, at[1] + Math.sin(angle) * length];
    joints.push(at);
  }
  return joints;
}

/** Limbs swing in arcs around their joints instead of sliding in straight lines. */
export function blendPoses(a: ResolvedPose, b: ResolvedPose, t: number): ResolvedPose {
  const hip: Point = [lerp(a.hip[0], b.hip[0], t), lerp(a.hip[1], b.hip[1], t)];
  const [shoulder, head] = chain(hip, [a.hip, a.shoulder, a.head], [b.hip, b.shoulder, b.head], t);
  const arm = (i: 0 | 1) => {
    const [elbow, hand] = chain(shoulder, [a.shoulder, ...a.arms[i]], [b.shoulder, ...b.arms[i]], t);
    return [elbow, hand] as const;
  };
  const leg = (i: 0 | 1) => chain(hip, [a.hip, ...a.legs[i], a.toes[i]], [b.hip, ...b.legs[i], b.toes[i]], t);
  const [legA, legB] = [leg(0), leg(1)];
  // The spine curve keeps its offset from the middle of the torso.
  const [midA, midB, center] = [mid(a.shoulder, a.hip), mid(b.shoulder, b.hip), mid(shoulder, hip)];
  return {
    head, shoulder, hip,
    arms: [arm(0), arm(1)],
    legs: [[legA[0], legA[1]], [legB[0], legB[1]]],
    toes: [legA[2], legB[2]],
    bend: [center[0] + lerp(a.bend[0] - midA[0], b.bend[0] - midB[0], t), center[1] + lerp(a.bend[1] - midA[1], b.bend[1] - midB[1], t)],
    wall: a.wall,
  };
}

const swap = <T,>([a, b]: readonly [T, T]): [T, T] => [b, a];
const flip = ([x, y]: Point): Point => [280 - x, y];

function otherSide(pose: ResolvedPose, alternate: NonNullable<ExerciseVisual['alternate']>): ResolvedPose {
  const sides = { ...pose, legs: swap(pose.legs), toes: swap(pose.toes) };
  if (alternate === 'legs') return sides;
  if (alternate === 'limbs') return { ...sides, arms: swap(pose.arms) };
  // Mirror a front view, keeping each limb on the same side of the drawing.
  const limb = ([j, e]: readonly [Point, Point]) => [flip(j), flip(e)] as const;
  return {
    ...pose,
    head: flip(pose.head), shoulder: flip(pose.shoulder), hip: flip(pose.hip), bend: flip(pose.bend),
    arms: swap([limb(pose.arms[0]), limb(pose.arms[1])]),
    legs: swap([limb(pose.legs[0]), limb(pose.legs[1])]),
    toes: swap([flip(pose.toes[0]), flip(pose.toes[1])]),
  };
}

export function buildTimeline(visual: ExerciseVisual): MotionTimeline {
  const { moveMs, holdMs, finalHoldMs = holdMs } = TEMPO[visual.tempo];
  const keys = visual.positions.map((p, position) => ({ pose: resolvePose(p.pose), position }));
  // Alternating moves return to the start, then repeat the remaining positions on the other side.
  if (visual.alternate) {
    const side = visual.alternate;
    keys.push(keys[0], ...keys.slice(1).map((k) => ({ ...k, pose: otherSide(k.pose, side) })));
  }
  const last = visual.positions.length - 1;
  const samples = Math.max(6, Math.round(moveMs / 60));
  const frames: ResolvedPose[] = [];
  const times: number[] = [];
  const marks: MotionTimeline['marks'] = [];
  let ms = 0;
  keys.forEach((key, i) => {
    const next = keys[(i + 1) % keys.length];
    const hold = key.position === last ? finalHoldMs : holdMs;
    marks.push({ at: Math.max(0, ms - moveMs / 2), position: key.position });
    frames.push(key.pose, key.pose);
    times.push(ms, ms + hold);
    ms += hold;
    for (let s = 1; s < samples; s++) {
      frames.push(blendPoses(key.pose, next.pose, ease(s / samples)));
      times.push(ms + (moveMs * s) / samples);
    }
    ms += moveMs;
  });
  frames.push(keys[0].pose);
  times.push(ms);
  marks.push({ at: ms - moveMs / 2, position: keys[0].position });
  return {
    frames,
    keyTimes: times.map((t) => t / ms),
    durationMs: ms,
    marks: marks.map((m) => ({ ...m, at: m.at / ms })),
  };
}

/** The position shown at a fraction (0–1) of the loop. */
export function positionAt(timeline: MotionTimeline, fraction: number) {
  let position = timeline.marks[0].position;
  for (const m of timeline.marks) if (m.at <= fraction) position = m.position;
  return position;
}

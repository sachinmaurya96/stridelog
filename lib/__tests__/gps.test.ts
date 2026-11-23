import { beforeEach, describe, expect, it } from 'vitest';
import type { ActivityType } from '@/data/types';
import type { Fix } from '@/lib/gps';
import { useTrackingStore } from '@/store/trackingStore';

// Realistic GPS replay: the reported position = true position + slowly wandering error (like real
// GPS) + white noise + occasional multipath spikes. Seeded, so every run is identical.

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Leg {
  secs: number;
  speed: number; // m/s, 0 = standing still
}

interface Noise {
  drift: number; // sd (m) of the slowly wandering error
  white: number; // sd (m) of per-fix noise
  acc: [number, number]; // reported accuracy range
  spikes: number; // probability of a 25–40 m spike on a fix
}

interface Replay {
  fixes: Fix[];
  trueDistance: number;
  trueMovingSec: number;
}

const START = { lat: 12.9763, lng: 77.5929 };
const M_PER_DEG = 111_320;

function replay(legs: Leg[], noise: Noise, opts: { seed?: number; speed?: 'moving' | 'never' | 'always'; path?: 'straight' | 'loop' } = {}): Replay {
  const rand = rng(opts.seed ?? 1);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
  const cos = Math.cos((START.lat * Math.PI) / 180);
  // True position along the path, `s` meters from the start.
  const at = (s: number) => {
    if (opts.path !== 'loop') return { x: 0, y: s };
    const side = 150; // square loop with sharp turns
    const k = s % (4 * side);
    if (k < side) return { x: k, y: 0 };
    if (k < 2 * side) return { x: side, y: k - side };
    if (k < 3 * side) return { x: 3 * side - k, y: side };
    return { x: 0, y: 4 * side - k };
  };
  const phi = 0.95; // correlation of the wandering error between seconds
  let ex = 0, ey = 0;
  let s = 0, t = 1_800_000_000_000, moving = 0;
  const fixes: Fix[] = [];
  for (const leg of legs) {
    for (let i = 0; i < leg.secs; i++) {
      s += leg.speed;
      t += 1000;
      if (leg.speed > 0) moving += 1;
      ex = phi * ex + Math.sqrt(1 - phi * phi) * noise.drift * gauss();
      ey = phi * ey + Math.sqrt(1 - phi * phi) * noise.drift * gauss();
      let nx = ex + noise.white * gauss();
      let ny = ey + noise.white * gauss();
      if (rand() < noise.spikes) {
        const a = rand() * 2 * Math.PI, r = 25 + rand() * 15;
        nx += r * Math.cos(a);
        ny += r * Math.sin(a);
      }
      const p = at(s);
      const reportSpeed = opts.speed === 'always' || (opts.speed === 'moving' && leg.speed > 0);
      fixes.push({
        lat: START.lat + (p.y + ny) / M_PER_DEG,
        lng: START.lng + (p.x + nx) / (M_PER_DEG * cos),
        t,
        acc: noise.acc[0] + rand() * (noise.acc[1] - noise.acc[0]),
        speed: reportSpeed ? Math.max(0, leg.speed + 0.15 * gauss()) : null,
      });
    }
  }
  return { fixes, trueDistance: s, trueMovingSec: moving };
}

/** Runs a replay through the real tracking store, one fix and one tick per second. */
function track(r: Replay, type: ActivityType, autoPause = true) {
  const store = useTrackingStore.getState();
  store.reset();
  store.setType(type);
  store.setAutoPause(autoPause, r.fixes[0].t);
  const t0 = r.fixes[0].t - 1000;
  store.begin(t0, { ...START, t: t0, acc: 6 });
  for (const f of r.fixes) {
    useTrackingStore.getState().addPoint(f);
    useTrackingStore.getState().tick(f.t);
  }
  const end = r.fixes[r.fixes.length - 1].t;
  const live = useTrackingStore.getState();
  const autoPausedAtEnd = live.autoPaused;
  live.finish(end);
  const s = useTrackingStore.getState();
  return { distance: s.distanceM, movingSec: s.movingMs / 1000, autoPausedAtEnd, points: s.route.length };
}

const GOOD: Noise = { drift: 3, white: 1.5, acc: [4, 9], spikes: 0.01 };
const URBAN: Noise = { drift: 5, white: 2.5, acc: [8, 16], spikes: 0.03 };

beforeEach(() => useTrackingStore.getState().reset());

describe('standing still', () => {
  for (const [name, noise] of [['good GPS', GOOD], ['poor urban GPS', URBAN]] as const) {
    it(`adds no distance and stops the timer (${name})`, () => {
      for (const seed of [1, 2, 3]) {
        const r = replay([{ secs: 300, speed: 0 }], noise, { seed });
        const res = track(r, 'walk');
        expect(res.distance, `seed ${seed}`).toBeLessThan(5);
        expect(res.movingSec, `seed ${seed}`).toBeLessThan(25);
        expect(res.autoPausedAtEnd).toBe(true);
      }
    });
  }

  it('keeps the timer running but adds no distance when auto-pause is off', () => {
    const r = replay([{ secs: 180, speed: 0 }], URBAN, { seed: 4 });
    const res = track(r, 'run', false);
    expect(res.distance).toBeLessThan(5);
    expect(res.movingSec).toBeGreaterThan(175);
  });
});

describe('moving', () => {
  it('measures a walk within 5%', () => {
    for (const seed of [1, 2, 3]) {
      const r = replay([{ secs: 360, speed: 1.35 }], GOOD, { seed });
      const res = track(r, 'walk');
      expect(Math.abs(res.distance - r.trueDistance) / r.trueDistance, `seed ${seed}`).toBeLessThan(0.05);
      expect(Math.abs(res.movingSec - r.trueMovingSec), `seed ${seed}`).toBeLessThan(15);
    }
  });

  it('measures a run with sharp turns within 5%', () => {
    for (const seed of [1, 2, 3]) {
      const r = replay([{ secs: 600, speed: 3 }], GOOD, { seed, path: 'loop', speed: 'moving' });
      const res = track(r, 'run');
      expect(Math.abs(res.distance - r.trueDistance) / r.trueDistance, `seed ${seed}`).toBeLessThan(0.05);
      expect(Math.abs(res.movingSec - r.trueMovingSec), `seed ${seed}`).toBeLessThan(15);
    }
  });

  it('handles a slow walk in poor GPS without dropping much time', () => {
    const r = replay([{ secs: 300, speed: 0.9 }], URBAN, { seed: 5 });
    const res = track(r, 'walk');
    expect(Math.abs(res.distance - r.trueDistance) / r.trueDistance).toBeLessThan(0.1);
    expect(res.movingSec).toBeGreaterThan(0.85 * r.trueMovingSec);
  });
});

describe('sparse GPS updates (a fix every 3 s)', () => {
  const sparse = (r: Replay): Replay => ({ ...r, fixes: r.fixes.filter((_, i) => i % 3 === 0) });

  it('standing still still adds nothing', () => {
    for (const seed of [1, 2, 3]) {
      const res = track(sparse(replay([{ secs: 300, speed: 0 }], URBAN, { seed })), 'walk');
      expect(res.distance, `seed ${seed}`).toBeLessThan(5);
    }
  });

  it('walking is measured within 5%', () => {
    for (const seed of [1, 2, 3]) {
      const r = sparse(replay([{ secs: 300, speed: 1.35 }], GOOD, { seed }));
      const res = track(r, 'walk');
      expect(Math.abs(res.distance - r.trueDistance) / r.trueDistance, `seed ${seed}`).toBeLessThan(0.05);
    }
  });
});

describe('stop and go', () => {
  it('walk, stand 2 minutes, walk: no distance while standing and the stop is not timed', () => {
    for (const seed of [1, 2, 3]) {
      const r = replay(
        [
          { secs: 180, speed: 1.35 },
          { secs: 120, speed: 0 },
          { secs: 180, speed: 1.35 },
        ],
        GOOD,
        { seed },
      );
      const res = track(r, 'walk');
      expect(Math.abs(res.distance - r.trueDistance) / r.trueDistance, `seed ${seed}`).toBeLessThan(0.06);
      expect(Math.abs(res.movingSec - r.trueMovingSec), `seed ${seed}`).toBeLessThan(25);
    }
  });

  it('run with a 1-minute stop at a crossing, device reports speed', () => {
    const r = replay(
      [
        { secs: 120, speed: 3 },
        { secs: 60, speed: 0 },
        { secs: 120, speed: 3 },
      ],
      URBAN,
      { seed: 7, speed: 'always' },
    );
    const res = track(r, 'run');
    expect(Math.abs(res.distance - r.trueDistance) / r.trueDistance).toBeLessThan(0.06);
    expect(Math.abs(res.movingSec - r.trueMovingSec)).toBeLessThan(15);
  });

  it('phone reports speed: walk, stand 2 minutes, walk in poor GPS', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const r = replay(
        [
          { secs: 180, speed: 1.35 },
          { secs: 120, speed: 0 },
          { secs: 180, speed: 1.35 },
        ],
        URBAN,
        { seed, speed: 'always' },
      );
      const res = track(r, 'walk');
      expect(Math.abs(res.distance - r.trueDistance) / r.trueDistance, `seed ${seed}`).toBeLessThan(0.06);
      expect(Math.abs(res.movingSec - r.trueMovingSec), `seed ${seed}`).toBeLessThan(15);
    }
  });

  it('ignores a big GPS spike while moving', () => {
    const base = replay([{ secs: 200, speed: 3 }], { ...GOOD, spikes: 0 }, { seed: 8 });
    const spiked = { ...base, fixes: base.fixes.map((f, i) => (i === 100 ? { ...f, lat: f.lat + 60 / M_PER_DEG } : f)) };
    const a = track(base, 'run').distance;
    const b = track(spiked, 'run').distance;
    expect(Math.abs(a - b)).toBeLessThan(3);
  });
});

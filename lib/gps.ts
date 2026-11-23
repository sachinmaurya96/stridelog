import type { ActivityType, GeoPoint } from '@/data/types';
import { distanceM } from './geo';

// Turns raw, noisy GPS fixes into a clean route.
//
// A phone that is standing still still reports positions that wander 5–20 m around the true spot.
// Counting those wobbles as distance makes distance, steps and speed creep up while you're stopped.
// So the filter has two states:
//
// - STILL:  nothing is added to the route. Fixes are averaged into a "resting point". Movement only
//           starts once several consecutive fixes are clearly outside the GPS accuracy around that
//           resting point and keep moving away (or the device's own speed says we're moving).
// - MOVING: fixes are smoothed with a Kalman filter and committed every few meters. A stop is
//           detected from the device's speed (when it reports one) or from the position trend over
//           a short window; the filter then reports when the stop really began, so the caller can
//           drop anything recorded after it and pause the timer from that moment.

type LatLng = { lat: number; lng: number };

export interface Fix {
  lat: number;
  lng: number;
  t: number; // ms
  acc: number; // meters (95% radius)
  speed?: number | null; // m/s from the device, if any
  alt?: number | null;
}

export const GPS_CONFIG = {
  /** Fixes less accurate than this are ignored. */
  maxAccuracyM: 30,
  /** Minimum distance from the resting point before we believe movement started. */
  startMinM: 8,
  /**
   * Minimum spacing between route points while moving (grows with poor accuracy). Wider spacing stops
   * sideways jitter from adding up to extra distance; 10–20 m still follows streets and turns.
   */
  moveMinM: 10,
  /** A device speed above this proves the device reports real speeds. */
  trustSpeedMps: 0.8,
  /** With a trusted speed sensor, below this means standing still. */
  stillSpeedMps: 0.45,
  /** How much raw history to keep. */
  bufferMs: 60_000,
} as const;

/** Typical speeds, used to estimate when movement started. */
export const TYPICAL_SPEED: Record<ActivityType, number> = { walk: 1.3, run: 2.8 };
/** Slowest speed we still want to count as moving. */
export const MIN_SPEED: Record<ActivityType, number> = { walk: 0.8, run: 1.6 };
/** Kalman process noise (m/s): how fast the true position may change between fixes. */
const KALMAN_Q: Record<ActivityType, number> = { walk: 1.5, run: 3 };
/** Time window used to decide we've stopped. */
const STOP_WINDOW_MS: Record<ActivityType, number> = { walk: 15_000, run: 8_000 };
/** A stop must keep looking like a stop for this long before we act on it. */
const STOP_CONFIRM_MS: Record<ActivityType, number> = { walk: 5_000, run: 3_000 };
/** A "start" that never really left the resting spot within this time is rolled back. */
const FALSE_START_MS = 45_000;
/** Fixes younger than this don't count towards the resting point. */
const REST_LAG_MS = 8_000;
const MAX_SPEED: Record<ActivityType, number> = { walk: 4, run: 12 };

interface Kalman {
  lat: number;
  lng: number;
  /** Variance of the estimate in m². */
  v: number;
  t: number;
}

export interface GpsFilterState {
  type: ActivityType;
  moving: boolean;
  /** When the current still period began (ms). */
  stillSince: number;
  /** Last point committed to the route (the caller may rewind it after a stop). */
  last: GeoPoint | null;
  kf: Kalman | null;
  /** Consecutive fixes the Kalman gate rejected as outliers. */
  outliers: number;
  /** Good raw fixes from the last minute. */
  buf: Fix[];
  /** Fixes since the still period began: their average is the resting point. */
  stillFixes: Fix[];
  /** Consecutive fixes clearly away from the resting point (movement candidates). */
  cand: Fix[];
  /** The device has reported a real moving speed this session, so its speed can be trusted. */
  speedTrusted: boolean;
  /** Smoothed position for the map dot. */
  display: LatLng | null;
  /** Estimated time the current moving period began. */
  movingSince: number | null;
  /** Resting point and start threshold when the current moving period began (for false-start checks). */
  startRest: LatLng | null;
  startThreshold: number;
  /** Furthest we've been from `startRest` during this moving period. */
  maxAway: number;
  /** First time the stop test started passing, and the stop time it estimated. */
  stopSince: number | null;
  stopAt: number | null;
  /** Route points committed in the current moving period (last two minutes). */
  trail: GeoPoint[];
}

export interface FilterResult {
  state: GpsFilterState;
  /** New route points, oldest first. */
  commits: GeoPoint[];
  /** Movement (re)started; estimated start time. */
  resumedAt?: number;
  /** Movement stopped; estimated stop time. Route points after it are drift and should be dropped. */
  stoppedAt?: number;
  /**
   * On a stop: where we came to rest (append it so the route ends at the right spot).
   * On a restart: the averaged resting point the new stretch starts from.
   */
  restPoint?: GeoPoint;
}

export const validSpeed = (v: number | null | undefined) => (v != null && Number.isFinite(v) && v >= 0 ? v : null);

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Accuracy-weighted average position (more accurate fixes count more). */
export function centroid(fixes: Fix[]): LatLng {
  let w = 0, lat = 0, lng = 0;
  for (const f of fixes) {
    const wi = 1 / Math.max(1, f.acc) ** 2;
    w += wi;
    lat += f.lat * wi;
    lng += f.lng * wi;
  }
  return { lat: lat / w, lng: lng / w };
}

const toPoint = (p: LatLng, fix: Fix): GeoPoint => ({
  lat: p.lat,
  lng: p.lng,
  t: fix.t,
  acc: fix.acc,
  alt: fix.alt ?? null,
  speed: validSpeed(fix.speed),
});

const toFix = (p: GeoPoint): Fix => ({ lat: p.lat, lng: p.lng, t: p.t, acc: Math.max(1, p.acc), speed: p.speed });

const isValid = (f: Fix) => Number.isFinite(f.lat) && Number.isFinite(f.lng) && Number.isFinite(f.t) && Number.isFinite(f.acc);

function kalmanInit(f: Fix): Kalman {
  return { lat: f.lat, lng: f.lng, v: f.acc * f.acc, t: f.t };
}

function kalmanPredictVar(k: Kalman, t: number, q: number) {
  return k.v + (Math.max(0, t - k.t) / 1000) * q * q;
}

function kalmanUpdate(k: Kalman, f: Fix, q: number): Kalman {
  const v = kalmanPredictVar(k, f.t, q);
  const gain = v / (v + f.acc * f.acc);
  return { lat: k.lat + gain * (f.lat - k.lat), lng: k.lng + gain * (f.lng - k.lng), v: (1 - gain) * v, t: f.t };
}

export function stopWindowMs(type: ActivityType, medianAcc: number) {
  return STOP_WINDOW_MS[type] * (medianAcc > 12 ? 1.5 : 1);
}

export function createGpsFilter(type: ActivityType, now: number, start?: GeoPoint | null): GpsFilterState {
  return {
    type,
    moving: false,
    stillSince: now,
    last: start ?? null,
    kf: null,
    outliers: 0,
    buf: [],
    stillFixes: start ? [toFix(start)] : [],
    cand: [],
    speedTrusted: false,
    display: start ? { lat: start.lat, lng: start.lng } : null,
    movingSince: null,
    startRest: null,
    startThreshold: 0,
    maxAway: 0,
    stopSince: null,
    stopAt: null,
    trail: [],
  };
}

/** Route spacing while moving: wider when accuracy is poor. */
const spacing = (acc: number) => Math.max(GPS_CONFIG.moveMinM, Math.min(20, acc));

/** RMS distance of the resting fixes from their centre: how much this GPS is jittering right now. */
function jitter(fixes: Fix[], c: LatLng) {
  if (fixes.length < 5) return 0;
  return Math.sqrt(fixes.reduce((sum, f) => sum + distanceM(c, f) ** 2, 0) / fixes.length);
}

/** Recent device speed (median of the last few fixes), when the device reports trustworthy speeds. */
export function deviceSpeed(s: GpsFilterState, now: number): number | null {
  if (!s.speedTrusted) return null;
  const recent = s.buf.filter((f) => now - f.t <= 5000).map((f) => validSpeed(f.speed)).filter((v): v is number => v != null);
  return recent.length ? median(recent.slice(-5)) : null;
}

/**
 * Has movement stopped? Returns the estimated stop time, or null.
 * Uses the device's speed when it's trustworthy, otherwise the position trend over a window.
 */
function detectStop(s: GpsFilterState, now: number): number | null {
  if (!s.moving || !s.buf.length) return null;
  const restCluster = (medAcc: number) => {
    // Walk back from the newest fix while the fixes still look like one resting spot (80% of them
    // within the radius, so a single wild fix doesn't end the scan): that's when we stopped.
    const radius = Math.max(8, 1.2 * medAcc);
    let start = s.buf.length - 1;
    for (let i = s.buf.length - 2; i >= 0; i--) {
      const group = s.buf.slice(i);
      const c = centroid(group);
      const dists = group.map((f) => distanceM(c, f)).sort((a, b) => a - b);
      if (dists[Math.floor(dists.length * 0.8)] > radius || distanceM(c, s.buf[i]) > 2 * radius) break;
      start = i;
    }
    return s.buf.slice(start).reverse();
  };
  const medAcc = median(s.buf.slice(-10).map((f) => f.acc));

  if (s.speedTrusted) {
    const last3 = s.buf.slice(-3);
    const allSlow =
      last3.length === 3 &&
      now - last3[0].t <= 6000 &&
      last3.every((f) => {
        const v = validSpeed(f.speed);
        return v != null && v < GPS_CONFIG.stillSpeedMps;
      });
    if (allSlow) {
      // The first of the run of slow readings is when we stopped (Doppler speed reacts within a second).
      let i = s.buf.length - 1;
      while (i > 0) {
        const v = validSpeed(s.buf[i - 1].speed);
        if (v == null || v >= GPS_CONFIG.stillSpeedMps) break;
        i--;
      }
      return s.buf[i].t;
    }
    // The device says we're still moving.
    const fast = s.buf.some((f) => now - f.t <= 3000 && (validSpeed(f.speed) ?? 0) >= GPS_CONFIG.trustSpeedMps);
    if (fast) return null;
  }

  const w = stopWindowMs(s.type, medAcc);
  const win = s.buf.filter((f) => now - f.t <= w);
  if (win.length < Math.max(3, Math.floor((w / 1000) * 0.5))) return null; // not enough data to decide
  if (win[win.length - 1].t - win[0].t < w * 0.6) return null;
  const third = Math.max(1, Math.floor(win.length / 3));
  const trend = distanceM(centroid(win.slice(0, third)), centroid(win.slice(-third)));
  const stopBelow = Math.min(15, Math.max(4, 0.4 * (w / 1000) * MIN_SPEED[s.type]));
  if (trend >= stopBelow) return null;
  const restFixes = win.filter((f) => now - f.t <= Math.min(w, 10_000));
  const arrived = arrivalTime(s, centroid(restFixes), Math.max(6, 0.6 * medAcc));
  if (arrived != null) return Math.min(now, Math.max(win[0].t - w, arrived));
  const cluster = restCluster(medAcc);
  return cluster[cluster.length - 1].t;
}

function toStill(s: GpsFilterState, stoppedAt: number): GpsFilterState {
  const rest = s.buf.filter((f) => f.t >= stoppedAt);
  return {
    ...s,
    moving: false,
    stillSince: stoppedAt,
    kf: null,
    outliers: 0,
    cand: [],
    stillFixes: rest,
    display: rest.length ? centroid(rest) : s.display,
    movingSince: null,
    startRest: null,
    maxAway: 0,
    stopSince: null,
    stopAt: null,
    trail: [],
  };
}

const withTrail = (trail: GeoPoint[], add: GeoPoint[], now: number) =>
  [...trail, ...add].filter((p) => now - p.t <= 120_000);

/**
 * When did we come to rest at `rest`? Take the last route point clearly outside the resting spot
 * and add the time needed to cover the remaining distance at the recent pace.
 */
function arrivalTime(s: GpsFilterState, rest: LatLng, radius: number): number | null {
  const trail = s.trail;
  let i = trail.length - 1;
  while (i >= 0 && distanceM(rest, trail[i]) <= radius) i--;
  if (i < 0) return null;
  const p = trail[i];
  let len = 0;
  let j = i;
  while (j > 0 && p.t - trail[j - 1].t <= 30_000) {
    len += distanceM(trail[j - 1], trail[j]);
    j--;
  }
  const span = (p.t - trail[j].t) / 1000;
  const v = span > 0 ? Math.min(MAX_SPEED[s.type], Math.max(MIN_SPEED[s.type], len / span)) : TYPICAL_SPEED[s.type];
  return p.t + (distanceM(rest, p) / v) * 1000;
}

/**
 * Runs the stop test and only acts once it has kept passing for a few seconds. Returns the new
 * state, plus the stop time and the point where we came to rest (to finish the route there).
 */
function checkStop(s: GpsFilterState, now: number): { state: GpsFilterState; stoppedAt?: number; restPoint?: GeoPoint } {
  const at = detectStop(s, now);
  if (at == null) return { state: s.stopSince == null ? s : { ...s, stopSince: null, stopAt: null } };
  const stopSince = s.stopSince ?? now;
  const stopAt = Math.min(s.stopAt ?? at, at);
  const deviceSaysStill = s.speedTrusted && (deviceSpeed(s, now) ?? 1) < GPS_CONFIG.stillSpeedMps;
  if (!deviceSaysStill && now - stopSince < STOP_CONFIRM_MS[s.type]) return { state: { ...s, stopSince, stopAt } };

  let stoppedAt = stopAt;
  const rest = s.buf.filter((f) => f.t >= stoppedAt);
  const restCentre = rest.length ? centroid(rest) : null;
  // A "start" that never really left the resting spot was GPS drift: undo all of it.
  if (
    s.movingSince != null &&
    s.startRest &&
    restCentre &&
    stoppedAt - s.movingSince < FALSE_START_MS &&
    distanceM(s.startRest, restCentre) < 1.5 * s.startThreshold &&
    s.maxAway < 3 * s.startThreshold
  ) {
    stoppedAt = s.movingSince;
    return { state: toStill(s, stoppedAt), stoppedAt };
  }
  const restFix = rest[rest.length - 1];
  const restPoint = restCentre && restFix ? toPoint(restCentre, { ...restFix, t: stoppedAt }) : undefined;
  return { state: toStill(s, stoppedAt), stoppedAt, restPoint };
}

function stillStep(s: GpsFilterState, fix: Fix, speed: number | null): FilterResult {
  // The very first good fix of a session becomes the start of the route.
  if (!s.last) {
    const p = toPoint(fix, fix);
    return { state: { ...s, last: p, stillFixes: [fix], display: { lat: fix.lat, lng: fix.lng } }, commits: [p] };
  }
  // The resting point is judged from fixes at least a few seconds old, so the first steps of someone
  // walking away don't drag it along with them.
  const settled = s.stillFixes.filter((f) => fix.t - f.t >= REST_LAG_MS);
  const restFixes = settled.length ? settled : [toFix(s.last)];
  const rest = centroid(restFixes);
  const d = distanceM(rest, fix);
  // Beyond the reported accuracy AND well beyond the jitter we've actually seen while standing here.
  const threshold = Math.max(GPS_CONFIG.startMinM, fix.acc, Math.min(30, 2.5 * jitter(restFixes, rest)));
  const deviceSaysStill = s.speedTrusted && speed != null && speed < GPS_CONFIG.stillSpeedMps;

  if (d < threshold || deviceSaysStill) {
    // Still here: refine the resting point (newest minute only, so slow drift doesn't stick).
    const stillFixes = [...s.stillFixes, fix].filter((f) => fix.t - f.t <= GPS_CONFIG.bufferMs);
    return { state: { ...s, cand: [], stillFixes, display: centroid(stillFixes) }, commits: [] };
  }

  // A jump no person could make since the previous fix is a multipath spike: ignore it.
  const prev = s.buf[s.buf.length - 2];
  if (prev && distanceM(prev, fix) > MAX_SPEED[s.type] * Math.max(1, (fix.t - prev.t) / 1000) + 1.5 * Math.max(prev.acc, fix.acc)) {
    return { state: s, commits: [] };
  }
  const cand = [...s.cand, fix];
  const movingAway = distanceM(rest, cand[cand.length - 1]) >= distanceM(rest, cand[0]) + 0.3 * ((cand[cand.length - 1].t - cand[0].t) / 1000);
  const deviceSaysMoving = s.speedTrusted && cand.every((f) => (validSpeed(f.speed) ?? 0) >= GPS_CONFIG.trustSpeedMps);
  const confirmed = (cand.length >= 3 && movingAway) || (cand.length >= 2 && deviceSaysMoving);
  if (!confirmed) return { state: { ...s, cand }, commits: [] };

  // Movement started. Estimate when, from how far out the first candidate was and how fast the
  // candidates moved away (device speed when trustworthy).
  const first = cand[0];
  const lastCand = cand[cand.length - 1];
  const speeds = cand.map((f) => validSpeed(f.speed)).filter((v): v is number => v != null && v >= GPS_CONFIG.trustSpeedMps);
  const observed = (distanceM(rest, lastCand) - distanceM(rest, first)) / Math.max(1, (lastCand.t - first.t) / 1000);
  const vEst =
    s.speedTrusted && speeds.length
      ? median(speeds)
      : Math.min(TYPICAL_SPEED[s.type] * 1.5, Math.max(MIN_SPEED[s.type], observed));
  const resumedAt = Math.max(s.stillSince, first.t - (distanceM(rest, first) / vEst) * 1000);

  const q = KALMAN_Q[s.type];
  let kf = kalmanInit(first);
  let last = s.last;
  const commits: GeoPoint[] = [];
  cand.forEach((f, i) => {
    if (i > 0) kf = kalmanUpdate(kf, f, q);
    if (distanceM(last, kf) >= spacing(f.acc)) {
      last = toPoint(kf, f);
      commits.push(last);
    }
  });
  return {
    state: {
      ...s,
      moving: true,
      kf,
      outliers: 0,
      cand: [],
      stillFixes: [],
      last,
      display: { lat: kf.lat, lng: kf.lng },
      trail: withTrail([], commits, lastCand.t),
      movingSince: resumedAt,
      startRest: rest,
      startThreshold: threshold,
      maxAway: distanceM(rest, kf),
      stopSince: null,
      stopAt: null,
    },
    commits,
    resumedAt,
    restPoint: toPoint(rest, { ...first, t: resumedAt }),
  };
}

/**
 * Median of the last three fixes (per coordinate): a single multipath spike can never be the
 * median, so it never reaches the route. Costs about one fix of lag.
 */
function median3(s: GpsFilterState, fix: Fix): Fix {
  const recent = s.buf.slice(-3).filter((f) => fix.t - f.t <= 5000);
  if (recent.length < 3) return fix;
  return {
    ...fix,
    lat: median(recent.map((f) => f.lat)),
    lng: median(recent.map((f) => f.lng)),
    acc: median(recent.map((f) => f.acc)),
  };
}

function movingStep(s: GpsFilterState, raw: Fix): FilterResult {
  const q = KALMAN_Q[s.type];
  const fix = median3(s, raw);
  let kf = s.kf ?? kalmanInit(fix);
  // Reject fixes that jump much further than the filter thinks is possible (multipath spikes).
  const gate = Math.max(25, 3 * Math.sqrt(kalmanPredictVar(kf, fix.t, q) + fix.acc * fix.acc));
  if (s.kf && distanceM(kf, fix) > gate) {
    if (s.outliers < 2) return { state: { ...s, outliers: s.outliers + 1 }, commits: [] };
    kf = kalmanInit(fix); // three in a row: the position really moved (e.g. leaving a tunnel)
  } else {
    kf = s.kf ? kalmanUpdate(kf, fix, q) : kf;
  }
  const away = state0MaxAway(s, kf);
  const stop = checkStop({ ...s, kf, outliers: 0, display: { lat: kf.lat, lng: kf.lng }, maxAway: away }, fix.t);
  if (stop.stoppedAt != null) return { state: stop.state, commits: [], stoppedAt: stop.stoppedAt, restPoint: stop.restPoint };
  const state = stop.state;

  const last = state.last;
  let commit = !last;
  if (last) {
    const d = distanceM(last, kf);
    const dt = (fix.t - last.t) / 1000;
    commit = dt > 0 && d / dt <= MAX_SPEED[s.type] && d >= spacing(fix.acc);
  }
  if (!commit) return { state, commits: [] };
  const p = toPoint(kf, fix);
  return { state: { ...state, last: p, trail: withTrail(state.trail, [p], fix.t) }, commits: [p] };
}

const state0MaxAway = (s: GpsFilterState, p: LatLng) => (s.startRest ? Math.max(s.maxAway, distanceM(s.startRest, p)) : s.maxAway);

/** Feed one raw GPS fix into the filter. */
export function filterFix(s: GpsFilterState, fix: Fix): FilterResult {
  if (!isValid(fix) || fix.acc > GPS_CONFIG.maxAccuracyM) return { state: s, commits: [] };
  const prevT = s.buf.length ? s.buf[s.buf.length - 1].t : -Infinity;
  if (fix.t <= prevT) return { state: s, commits: [] };
  const speed = validSpeed(fix.speed);
  const state: GpsFilterState = {
    ...s,
    buf: [...s.buf.filter((f) => fix.t - f.t <= GPS_CONFIG.bufferMs), fix],
    speedTrusted: s.speedTrusted || (speed != null && speed >= GPS_CONFIG.trustSpeedMps),
  };
  return state.moving ? movingStep(state, fix) : stillStep(state, fix, speed);
}

/** Call about once a second: detects a stop even when the device stops sending fixes. */
export function filterTick(s: GpsFilterState, now: number): FilterResult {
  if (!s.moving) return { state: s, commits: [] };
  const stop = checkStop(s, now);
  return { state: stop.state, commits: [], stoppedAt: stop.stoppedAt, restPoint: stop.restPoint };
}

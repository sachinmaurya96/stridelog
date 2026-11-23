import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import type { ActivityType, GeoPoint } from '@/data/types';
import { distanceM, recentSpeedMps, totalDistance } from '@/lib/geo';
import {
  createGpsFilter,
  filterFix,
  filterTick,
  GPS_CONFIG,
  MIN_SPEED,
  stopWindowMs,
  type FilterResult,
  type GpsFilterState,
} from '@/lib/gps';

// idle → countdown(3,2,1) → tracking ⇄ paused → finished(summary) → saved (reset to idle)
// While tracking, the GPS filter decides whether you're moving; with auto-pause on, the timer
// only runs while you move.
export type TrackStatus = 'idle' | 'countdown' | 'tracking' | 'paused' | 'finished';

interface Session {
  status: TrackStatus;
  type: ActivityType;
  route: GeoPoint[];
  seg: number;                 // current segment; a resume after a pause starts a new one
  startedAt: number | null;
  endedAt: number | null;
  movingMs: number;            // moving time of completed spans
  spanStart: number | null;    // start of the running span (null while paused or auto-paused)
  lastActiveAt: number | null; // last time we know tracking was alive (for crash recovery)
  distanceM: number;
  maxSpeedMps: number;
  recovered: boolean;          // restored after a reload: ask the user to resume
  autoPause: boolean;          // stop the timer while standing still (from settings)
  autoPaused: boolean;         // the timer is stopped because we're standing still
  autoPausedAt: number | null; // when the current auto-pause began (estimated stop time)
  gps: GpsFilterState;         // live filter state (not persisted)
}

interface TrackingState extends Session {
  setType: (type: ActivityType) => void;
  setAutoPause: (on: boolean, now: number) => void;
  startCountdown: () => void;
  cancelCountdown: () => void;
  begin: (now: number, firstPoint?: GeoPoint | null) => void;
  addPoint: (p: GeoPoint) => void;
  /** Call about once a second while recording. */
  tick: (now: number) => void;
  pause: (now: number) => void;
  resume: (now: number, here?: GeoPoint | null) => void;
  finish: (now: number) => void;
  reopen: () => void;
  recover: () => void;
  acknowledgeRecovery: () => void;
  reset: () => void;
}

const IDLE: Omit<Session, 'autoPause'> = {
  status: 'idle',
  type: 'run',
  route: [],
  seg: 0,
  startedAt: null,
  endedAt: null,
  movingMs: 0,
  spanStart: null,
  lastActiveAt: null,
  distanceM: 0,
  maxSpeedMps: 0,
  recovered: false,
  autoPaused: false,
  autoPausedAt: null,
  gps: createGpsFilter('run', 0),
};

/** Moving time in ms at `now` (excludes manual pauses and auto-pauses). */
export function movingMsAt(s: Pick<Session, 'movingMs' | 'spanStart'>, now: number) {
  return s.movingMs + (s.spanStart != null ? Math.max(0, now - s.spanStart) : 0);
}

export const isSessionActive = (status: TrackStatus) =>
  status === 'countdown' || status === 'tracking' || status === 'paused';

const goodStart = (p: GeoPoint | null | undefined) =>
  p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.acc <= GPS_CONFIG.maxAccuracyM ? p : null;

/** Applies what the GPS filter decided to the session: commits, stops (with drift removal) and restarts. */
function applyFilter(s: Session, r: FilterResult): Partial<Session> {
  let { route, distanceM: dist, seg, movingMs, spanStart, autoPaused, autoPausedAt } = s;
  let gps = r.state;

  if (r.stoppedAt != null) {
    // Anything recorded after we really stopped is GPS drift: drop it.
    const kept = route.filter((p) => !(p.seg === seg && p.t > r.stoppedAt!));
    // End the moving stretch where we actually came to rest.
    const tail = kept[kept.length - 1];
    if (r.restPoint && tail && tail.seg === seg && distanceM(tail, r.restPoint) >= 5) kept.push({ ...r.restPoint, seg });
    if (kept.length !== route.length || kept[kept.length - 1] !== route[route.length - 1]) {
      route = kept;
      dist = totalDistance(route);
    }
    gps = { ...gps, last: route[route.length - 1] ?? null };
    if (s.autoPause && spanStart != null) {
      movingMs += Math.max(0, r.stoppedAt - spanStart);
      spanStart = null;
      autoPaused = true;
      autoPausedAt = r.stoppedAt;
    }
  }

  if (r.resumedAt != null && autoPaused) {
    const tail = route[route.length - 1];
    // If the averaged resting point is far from where the stop began, we never really stopped: we
    // were creeping along (a slow walk in poor GPS). Carry on the same stretch so that distance and
    // time count. Otherwise start a new stretch at the resting point from the estimated start time.
    const gap = r.restPoint && tail ? distanceM(tail, r.restPoint) : 0;
    const pausedSec = autoPausedAt != null ? (r.resumedAt - autoPausedAt) / 1000 : Infinity;
    const creptAway =
      gap > Math.max(8, r.restPoint?.acc ?? 0) && pausedSec < 60 && gap >= 0.4 * MIN_SPEED[s.type] * pausedSec;
    if (creptAway) {
      spanStart = autoPausedAt ?? r.resumedAt;
    } else {
      if (tail && tail.seg === seg) seg += 1;
      const from = r.restPoint ?? tail;
      if (from) route = [...route, { ...from, t: r.resumedAt, seg }];
      spanStart = r.resumedAt;
    }
    autoPaused = false;
    autoPausedAt = null;
  }

  if (r.commits.length) {
    route = [...route];
    for (const c of r.commits) {
      const p = { ...c, seg };
      const prev = route[route.length - 1];
      if (prev && prev.seg === seg) dist += distanceM(prev, p);
      route.push(p);
    }
  }

  return {
    route,
    distanceM: dist,
    seg,
    movingMs,
    spanStart,
    autoPaused,
    autoPausedAt,
    gps,
    maxSpeedMps: r.commits.length ? Math.max(s.maxSpeedMps, recentSpeedMps(route, 5)) : s.maxSpeedMps,
  };
}

/**
 * localStorage writes are throttled to one every few seconds (a long route is a few hundred KB),
 * and flushed immediately when the page is hidden or closed.
 */
function throttledStorage<S>(ms: number): PersistStorage<S> {
  let pending: { name: string; value: StorageValue<S> } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!pending) return;
    try {
      localStorage.setItem(pending.name, JSON.stringify(pending.value));
    } catch {
      // storage full or unavailable: keep the in-memory session going
    }
    pending = null;
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  }
  return {
    getItem: (name) => {
      try {
        const raw = localStorage.getItem(name);
        return raw ? (JSON.parse(raw) as StorageValue<S>) : null;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      pending = { name, value };
      timer ??= setTimeout(flush, ms);
    },
    removeItem: (name) => {
      pending = null;
      try {
        localStorage.removeItem(name);
      } catch {
        // ignore
      }
    },
  };
}

export const useTrackingStore = create<TrackingState>()(
  persist(
    (set) => ({
      ...IDLE,
      autoPause: true,

      setType: (type) => set((s) => (s.status === 'idle' ? { type } : s)),

      setAutoPause: (on, now) =>
        set((s) => {
          if (on || !s.autoPaused) return { autoPause: on };
          // Turning auto-pause off while auto-paused: let the timer run again.
          return { autoPause: on, autoPaused: false, spanStart: s.status === 'tracking' ? now : s.spanStart };
        }),

      startCountdown: () => set((s) => (s.status === 'idle' ? { status: 'countdown' } : s)),

      cancelCountdown: () => set((s) => (s.status === 'countdown' ? { status: 'idle' } : s)),

      begin: (now, firstPoint) =>
        set((s) => {
          if (s.status !== 'countdown' && s.status !== 'idle') return s;
          const start = goodStart(firstPoint);
          const first = start ? { ...start, t: now, seg: 0 } : null;
          return {
            ...IDLE,
            type: s.type,
            status: 'tracking',
            startedAt: now,
            spanStart: now,
            lastActiveAt: now,
            route: first ? [first] : [],
            gps: createGpsFilter(s.type, now, first),
          };
        }),

      addPoint: (p) =>
        set((s) => {
          if (s.status !== 'tracking') return s;
          return { ...applyFilter(s, filterFix(s.gps, p)), lastActiveAt: p.t };
        }),

      tick: (now) =>
        set((s) => {
          if (s.status !== 'tracking') return s;
          const next = { ...s, ...applyFilter(s, filterTick(s.gps, now)) };
          // Standing still since the start (or since a resume) without ever moving: pause the timer too.
          const standingTooLong = now - next.gps.stillSince >= stopWindowMs(s.type, 0);
          if (next.autoPause && !next.autoPaused && !next.gps.moving && next.spanStart != null && standingTooLong) {
            next.movingMs += Math.max(0, next.gps.stillSince - next.spanStart);
            next.spanStart = null;
            next.autoPaused = true;
            next.autoPausedAt = next.gps.stillSince;
          }
          return {
            route: next.route,
            distanceM: next.distanceM,
            seg: next.seg,
            movingMs: next.movingMs,
            spanStart: next.spanStart,
            autoPaused: next.autoPaused,
            autoPausedAt: next.autoPausedAt,
            gps: next.gps,
            maxSpeedMps: next.maxSpeedMps,
            lastActiveAt: now,
          };
        }),

      pause: (now) =>
        set((s) =>
          s.status === 'tracking'
            ? { status: 'paused', movingMs: movingMsAt(s, now), spanStart: null, autoPaused: false, autoPausedAt: null, lastActiveAt: now }
            : s,
        ),

      resume: (now, here) =>
        set((s) => {
          if (s.status !== 'paused') return s;
          const segHasPoints = s.route.some((p) => p.seg === s.seg);
          const seg = segHasPoints ? s.seg + 1 : s.seg;
          // Start the new segment where you are now, so nothing walked while paused is counted.
          const start = goodStart(here);
          const first = start ? { ...start, t: now, seg } : null;
          return {
            status: 'tracking',
            spanStart: now,
            lastActiveAt: now,
            seg,
            route: first ? [...s.route, first] : s.route,
            autoPaused: false,
            autoPausedAt: null,
            recovered: false,
            gps: createGpsFilter(s.type, now, first ?? s.route[s.route.length - 1] ?? null),
          };
        }),

      finish: (now) =>
        set((s) =>
          s.status === 'tracking' || s.status === 'paused'
            ? {
                status: 'finished',
                movingMs: movingMsAt(s, now),
                spanStart: null,
                autoPaused: false,
                autoPausedAt: null,
                endedAt: now,
                recovered: false,
              }
            : s,
        ),

      reopen: () => set((s) => (s.status === 'finished' ? { status: 'paused', endedAt: null } : s)),

      recover: () =>
        set((s) => {
          const gps = createGpsFilter(s.type, Date.now(), s.route[s.route.length - 1] ?? null);
          if (s.status === 'countdown') return { status: 'idle' };
          if (s.status === 'tracking') {
            // The page died while recording: count time up to the last sign of life, then pause.
            const lastPointT = s.route[s.route.length - 1]?.t ?? 0;
            const last = Math.max(s.lastActiveAt ?? 0, lastPointT, s.spanStart ?? 0);
            return { status: 'paused', movingMs: movingMsAt(s, last), spanStart: null, autoPaused: false, autoPausedAt: null, recovered: true, gps };
          }
          if (s.status === 'paused' || s.status === 'finished') return { recovered: true, gps };
          return s;
        }),

      acknowledgeRecovery: () => set({ recovered: false }),

      reset: () => set((s) => ({ ...IDLE, type: s.type, autoPause: s.autoPause })),
    }),
    {
      name: 'stridelog-tracking',
      version: 1,
      storage: throttledStorage(3000),
      partialize: (s) => ({
        status: s.status,
        type: s.type,
        route: s.route,
        seg: s.seg,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        movingMs: s.movingMs,
        spanStart: s.spanStart,
        lastActiveAt: s.lastActiveAt,
        distanceM: s.distanceM,
        maxSpeedMps: s.maxSpeedMps,
        recovered: s.recovered,
        autoPaused: s.autoPaused,
        autoPausedAt: s.autoPausedAt,
      }),
    },
  ),
);

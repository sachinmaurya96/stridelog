import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import type { ActivityType, GeoPoint } from '@/data/types';
import { distanceM, recentSpeedMps, shouldAcceptPoint } from '@/lib/geo';

// idle → countdown(3,2,1) → tracking ⇄ paused → finished(summary) → saved (reset to idle)
export type TrackStatus = 'idle' | 'countdown' | 'tracking' | 'paused' | 'finished';

interface Session {
  status: TrackStatus;
  type: ActivityType;
  route: GeoPoint[];
  seg: number;                 // current segment; a resume after a pause starts a new one
  startedAt: number | null;
  endedAt: number | null;
  movingMs: number;            // moving time of completed spans
  spanStart: number | null;    // start of the running span (null while paused)
  lastActiveAt: number | null; // last time we know tracking was alive (for crash recovery)
  distanceM: number;
  maxSpeedMps: number;
  recovered: boolean;          // restored after a reload: ask the user to resume
}

interface TrackingState extends Session {
  setType: (type: ActivityType) => void;
  startCountdown: () => void;
  cancelCountdown: () => void;
  begin: (now: number, firstPoint?: GeoPoint | null) => void;
  addPoint: (p: GeoPoint) => void;
  pause: (now: number) => void;
  resume: (now: number) => void;
  finish: (now: number) => void;
  reopen: () => void;
  heartbeat: (now: number) => void;
  recover: () => void;
  acknowledgeRecovery: () => void;
  reset: () => void;
}

const IDLE: Session = {
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
};

/** Moving time in ms at `now` (excludes pauses). */
export function movingMsAt(s: Pick<Session, 'movingMs' | 'spanStart'>, now: number) {
  return s.movingMs + (s.spanStart != null ? Math.max(0, now - s.spanStart) : 0);
}

export const isSessionActive = (status: TrackStatus) =>
  status === 'countdown' || status === 'tracking' || status === 'paused';

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

      setType: (type) => set((s) => (s.status === 'idle' ? { type } : s)),

      startCountdown: () => set((s) => (s.status === 'idle' ? { status: 'countdown' } : s)),

      cancelCountdown: () => set((s) => (s.status === 'countdown' ? { status: 'idle' } : s)),

      begin: (now, firstPoint) =>
        set((s) => {
          if (s.status !== 'countdown' && s.status !== 'idle') return s;
          const ok = firstPoint && shouldAcceptPoint(null, firstPoint, s.type);
          return {
            ...IDLE,
            type: s.type,
            status: 'tracking',
            startedAt: now,
            spanStart: now,
            lastActiveAt: now,
            route: ok ? [{ ...firstPoint, t: now, seg: 0 }] : [],
          };
        }),

      addPoint: (p) =>
        set((s) => {
          if (s.status !== 'tracking') return s;
          const point = { ...p, seg: s.seg };
          const last = s.route[s.route.length - 1];
          const prev = last && last.seg === s.seg ? last : null;
          if (!shouldAcceptPoint(prev, point, s.type)) return s;
          const route = [...s.route, point];
          return {
            route,
            distanceM: s.distanceM + (prev ? distanceM(prev, point) : 0),
            maxSpeedMps: Math.max(s.maxSpeedMps, recentSpeedMps(route, 5)),
            lastActiveAt: point.t,
          };
        }),

      pause: (now) =>
        set((s) =>
          s.status === 'tracking'
            ? { status: 'paused', movingMs: movingMsAt(s, now), spanStart: null, lastActiveAt: now }
            : s,
        ),

      resume: (now) =>
        set((s) => {
          if (s.status !== 'paused') return s;
          const segHasPoints = s.route.some((p) => p.seg === s.seg);
          return {
            status: 'tracking',
            spanStart: now,
            lastActiveAt: now,
            seg: segHasPoints ? s.seg + 1 : s.seg,
            recovered: false,
          };
        }),

      finish: (now) =>
        set((s) =>
          s.status === 'tracking' || s.status === 'paused'
            ? { status: 'finished', movingMs: movingMsAt(s, now), spanStart: null, endedAt: now, recovered: false }
            : s,
        ),

      reopen: () => set((s) => (s.status === 'finished' ? { status: 'paused', endedAt: null } : s)),

      heartbeat: (now) => set((s) => (s.status === 'tracking' ? { lastActiveAt: now } : s)),

      recover: () =>
        set((s) => {
          if (s.status === 'countdown') return { status: 'idle' };
          if (s.status === 'tracking') {
            // The page died while recording: count time up to the last sign of life, then pause.
            const lastPointT = s.route[s.route.length - 1]?.t ?? 0;
            const last = Math.max(s.lastActiveAt ?? 0, lastPointT, s.spanStart ?? 0);
            return { status: 'paused', movingMs: movingMsAt(s, last), spanStart: null, recovered: true };
          }
          if (s.status === 'paused' || s.status === 'finished') return { recovered: true };
          return s;
        }),

      acknowledgeRecovery: () => set({ recovered: false }),

      reset: () => set((s) => ({ ...IDLE, type: s.type })),
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
      }),
    },
  ),
);

'use client';

import { useContext, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { TrackerContext } from '@/components/tracking/TrackerProvider';
import { activityRepo } from '@/data/repositories';
import { buildActivity } from '@/lib/activity';
import { now } from '@/lib/clock';
import { caloriesKcal, estimateSteps } from '@/lib/fitness';
import { M_PER_MI } from '@/lib/format';
import { computeSplits, paceSecPerKm, rollingPaceSecPerKm } from '@/lib/geo';
import { vibrate } from '@/lib/haptics';
import { getSettings, useSettingsStore } from '@/store/settingsStore';
import { movingMsAt, useTrackingStore } from '@/store/trackingStore';
import { useTicker } from './useTicker';

export interface LiveStats {
  movingSec: number;
  distanceM: number;
  avgPace: number;
  currentPace: number;
  speedMps: number;
  maxSpeedMps: number;
  calories: number;
  steps: number;
}

/** The tracking state machine for the UI: live session, derived stats and actions. */
export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error('useTracker must be used inside <TrackerProvider>');
  const session = useTrackingStore();
  const weightKg = useSettingsStore((s) => s.weightKg);
  const heightCm = useSettingsStore((s) => s.heightCm);
  const units = useSettingsStore((s) => s.units);

  // Re-render every second while recording so the timer moves (faster when simulating).
  useTicker(session.status === 'tracking' ? (ctx.simulating ? 250 : 1000) : null);

  const movingSec = movingMsAt(session, now()) / 1000;
  const stats: LiveStats = {
    movingSec,
    distanceM: session.distanceM,
    avgPace: paceSecPerKm(session.distanceM, movingSec),
    currentPace: session.status === 'tracking' ? rollingPaceSecPerKm(session.route, 30) : 0,
    speedMps: movingSec > 0 ? session.distanceM / movingSec : 0,
    maxSpeedMps: session.maxSpeedMps,
    calories: caloriesKcal({ type: session.type, weightKg, durationSec: movingSec, distanceM: session.distanceM }),
    steps: estimateSteps(session.type, session.distanceM, heightCm),
  };
  const splits = useMemo(() => computeSplits(session.route, units === 'mi' ? M_PER_MI : 1000), [session.route, units]);
  const gpsReady = ctx.simulating || (ctx.fix != null && ctx.fix.point.acc < 50);

  return {
    ...ctx,
    session,
    stats,
    splits,
    units,
    gpsReady,
    start: () => {
      vibrate(50);
      session.startCountdown();
    },
    begin: () => {
      vibrate([100, 60, 100]);
      session.begin(now(), ctx.fix?.point);
    },
    pause: () => session.pause(now()),
    resume: () => session.resume(now()),
    stop: () => {
      vibrate(300);
      session.finish(now());
    },
    discard: () => session.reset(),
    /** Saves the finished session and returns the new activity. */
    save: async (title?: string) => {
      const s = useTrackingStore.getState();
      if (s.status !== 'finished' || s.startedAt == null) throw new Error('Nothing to save');
      const activity = buildActivity(
        { ...s, startedAt: s.startedAt, endedAt: s.endedAt ?? now() },
        getSettings(),
        nanoid(),
        title,
      );
      await activityRepo.save(activity);
      s.reset();
      return activity;
    },
  };
}

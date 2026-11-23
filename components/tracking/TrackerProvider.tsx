'use client';

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import type { GeoPoint } from '@/data/types';
import { useGeolocation, type GeoPermission } from '@/hooks/useGeolocation';
import { useWakeLock } from '@/hooks/useWakeLock';
import { now, setTimeScale } from '@/lib/clock';
import { computeSplits, paceSecPerKm } from '@/lib/geo';
import { formatPace, M_PER_MI } from '@/lib/format';
import { vibrate } from '@/lib/haptics';
import { DEFAULT_SIM_CENTER, startSimulation, type Simulation } from '@/lib/simulate';
import { useSettingsStore } from '@/store/settingsStore';
import { isSessionActive, movingMsAt, useTrackingStore } from '@/store/trackingStore';

export interface Fix {
  point: GeoPoint;
  heading: number | null;
}

export interface TrackerContextValue {
  fix: Fix | null;
  permission: GeoPermission;
  gpsError: string | null;
  retryGps: () => void;
  simulating: boolean;
  /** Dev simulator: standing still (GPS still drifts). */
  simStill: boolean;
  setSimStill: (still: boolean) => void;
  startSimulation: (speedFactor: number) => void;
  stopSimulation: () => void;
}

export const TrackerContext = createContext<TrackerContextValue | null>(null);

const addPoint = (p: GeoPoint) => useTrackingStore.getState().addPoint(p);
let recoveredThisPageLoad = false;

/**
 * Runs the tracking engine for the whole app (GPS or simulator → store, wake lock,
 * stop detection tick, per-km alerts), so a session keeps recording when you browse other pages.
 */
export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = useTrackingStore((s) => s.status);
  const units = useSettingsStore((s) => s.units);
  const active = isSessionActive(status);

  const [simulating, setSimulating] = useState(false);
  const [simStill, setSimStillState] = useState(false);
  const autoPause = useSettingsStore((s) => s.autoPause);
  const display = useTrackingStore((s) => (s.status === 'tracking' ? s.gps.display : null));
  const [simFix, setSimFix] = useState<Fix | null>(null);
  const simRef = useRef<Simulation | null>(null);

  const gps = useGeolocation({ enabled: !simulating && (active || pathname === '/track'), onPosition: addPoint });

  // After a reload, turn an interrupted session into a paused one and ask to resume.
  useEffect(() => {
    if (recoveredThisPageLoad) return;
    recoveredThisPageLoad = true;
    useTrackingStore.getState().recover();
  }, []);

  const stopSimulation = useCallback(() => {
    simRef.current?.stop();
    simRef.current = null;
    setTimeScale(1);
    setSimulating(false);
    setSimFix(null);
  }, []);

  const lastRealPosition = gps.position;
  const beginSimulation = useCallback(
    (speedFactor: number) => {
      simRef.current?.stop();
      setTimeScale(speedFactor);
      setSimStillState(false);
      simRef.current = startSimulation({
        center: lastRealPosition ?? DEFAULT_SIM_CENTER,
        getType: () => useTrackingStore.getState().type,
        speedFactor,
        onPoint: (point, heading) => {
          setSimFix({ point, heading });
          addPoint(point);
        },
      });
      setSimulating(true);
    },
    [lastRealPosition],
  );

  // The simulator lives for one session: stop it once the session is finished or thrown away.
  const prevStatus = useRef(status);
  useEffect(() => {
    if (status === 'finished' || (status === 'idle' && prevStatus.current !== 'idle')) stopSimulation();
    prevStatus.current = status;
  }, [status, stopSimulation]);
  useEffect(() => () => simRef.current?.stop(), []);

  const setSimStill = useCallback((still: boolean) => {
    simRef.current?.setStill(still);
    setSimStillState(still);
  }, []);

  // Auto-pause preference (Settings) → tracker.
  useEffect(() => {
    useTrackingStore.getState().setAutoPause(autoPause, now());
  }, [autoPause]);

  // Every second: detect stops even when the phone sends no new fixes, and record that we're alive
  // (so a crash can be recovered up to this moment).
  useEffect(() => {
    if (status !== 'tracking') return;
    const id = setInterval(() => useTrackingStore.getState().tick(now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  useWakeLock(active);

  // Buzz + toast at every km (or mile).
  useEffect(
    () =>
      useTrackingStore.subscribe((s, prev) => {
        if (s.status !== 'tracking') return;
        const unitM = units === 'mi' ? M_PER_MI : 1000;
        const k = Math.floor(s.distanceM / unitM);
        if (k < 1 || k <= Math.floor(prev.distanceM / unitM)) return;
        const pace =
          computeSplits(s.route, unitM).at(-1)?.paceSecPerKm ??
          paceSecPerKm(s.distanceM, movingMsAt(s, now()) / 1000);
        vibrate(200);
        toast(`${k} ${units} · ${formatPace(pace, units)}`);
      }),
    [units],
  );

  // While recording, show the filtered position so the dot doesn't dance around when you stand still.
  const fix = useMemo<Fix | null>(() => {
    const raw = simulating ? simFix : gps.position ? { point: gps.position, heading: gps.heading } : null;
    if (!raw || !display) return raw;
    return { point: { ...raw.point, lat: display.lat, lng: display.lng }, heading: raw.heading };
  }, [simulating, simFix, gps.position, gps.heading, display]);

  const value = useMemo<TrackerContextValue>(
    () => ({
      fix,
      permission: simulating ? 'granted' : gps.permission,
      gpsError: simulating ? null : gps.error,
      retryGps: gps.retry,
      simulating,
      simStill,
      setSimStill,
      startSimulation: beginSimulation,
      stopSimulation,
    }),
    [fix, simulating, simStill, setSimStill, gps.permission, gps.error, gps.retry, beginSimulation, stopSimulation],
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

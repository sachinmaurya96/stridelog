'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoPoint } from '@/data/types';
import { now } from '@/lib/clock';

export type GeoPermission = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface GeoState {
  position: GeoPoint | null;
  accuracy: number | null;
  heading: number | null;
  error: string | null;
  permission: GeoPermission;
}

interface Options {
  enabled?: boolean;
  /** Called for every fix (not just the ones that cause a re-render). */
  onPosition?: (p: GeoPoint, heading: number | null) => void;
}

/** Wraps navigator.geolocation.watchPosition with high accuracy and permission tracking. */
export function useGeolocation({ enabled = true, onPosition }: Options = {}) {
  const [state, setState] = useState<GeoState>(() => {
    const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    return {
      position: null,
      accuracy: null,
      heading: null,
      error: supported ? null : 'This browser does not support location.',
      permission: supported ? 'unknown' : 'unsupported',
    };
  });
  const [attempt, setAttempt] = useState(0);
  const onPositionRef = useRef(onPosition);
  useEffect(() => {
    onPositionRef.current = onPosition;
  });

  // Track the permission state (and react when the user changes it in browser settings).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
    let status: PermissionStatus | null = null;
    const update = () => status && setState((s) => ({ ...s, permission: status!.state as GeoPermission }));
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((st) => {
        status = st;
        update();
        st.addEventListener('change', update);
      })
      .catch(() => {});
    return () => status?.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        const point: GeoPoint = {
          lat: c.latitude,
          lng: c.longitude,
          t: now(),
          acc: c.accuracy,
          alt: c.altitude,
          speed: c.speed,
        };
        const heading = c.heading != null && Number.isFinite(c.heading) ? c.heading : null;
        setState((s) => ({
          ...s,
          position: point,
          accuracy: c.accuracy,
          heading,
          error: null,
          permission: 'granted',
        }));
        onPositionRef.current?.(point, heading);
      },
      (err) => {
        setState((s) => ({
          ...s,
          permission: err.code === err.PERMISSION_DENIED ? 'denied' : s.permission,
          error:
            err.code === err.PERMISSION_DENIED
              ? 'Location access is blocked.'
              : err.code === err.TIMEOUT
                ? 'Still searching for a GPS signal…'
                : 'Your location is unavailable right now.',
        }));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { ...state, retry };
}

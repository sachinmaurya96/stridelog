'use client';

import { useEffect } from 'react';

/**
 * Keeps the screen on while `active` (browsers stop GPS when the screen locks).
 * The lock is dropped when the tab is hidden, so it is requested again on `visibilitychange`.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const l = await navigator.wakeLock.request('screen');
        if (cancelled) void l.release();
        else lock = l;
      } catch {
        // denied (e.g. low battery mode): tracking still works, the screen may just sleep
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void lock?.release();
    };
  }, [active]);
}

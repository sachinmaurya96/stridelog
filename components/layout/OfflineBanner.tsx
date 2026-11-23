'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

/** Tells people they're offline and that the app keeps working (only maps need a connection). */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  return (
    <div role="status" aria-live="polite">
      {!online && (
        <p className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] text-center text-xs font-semibold text-[#1b1206]">
          <WifiOff className="size-3.5 shrink-0" aria-hidden />
          You&apos;re offline. Tracking and your data still work; maps load when you&apos;re back online.
        </p>
      )}
    </div>
  );
}

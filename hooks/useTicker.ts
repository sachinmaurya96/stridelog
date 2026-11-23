'use client';

import { useEffect, useState } from 'react';

/** Re-renders the component every `intervalMs` (pass null to stop). */
export function useTicker(intervalMs: number | null) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (intervalMs == null) return;
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

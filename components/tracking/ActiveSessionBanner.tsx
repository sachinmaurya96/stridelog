'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ACTIVITY_META } from '@/components/common/activity';
import { useTicker } from '@/hooks/useTicker';
import { now } from '@/lib/clock';
import { distanceValue, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { isSessionActive, movingMsAt, useTrackingStore } from '@/store/trackingStore';

/** Floating "Recording run · 12:34" pill shown on other pages while a session is running. */
export function ActiveSessionBanner() {
  const pathname = usePathname();
  const s = useTrackingStore();
  const units = useSettingsStore((st) => st.units);
  const visible = (isSessionActive(s.status) || s.status === 'finished') && pathname !== '/track' && !s.recovered;
  useTicker(visible && s.status === 'tracking' ? 1000 : null);
  if (!visible) return null;

  const paused = s.status !== 'tracking';
  const label = ACTIVITY_META[s.type].label.toLowerCase();
  return (
    <Link
      href="/track"
      className="glass-strong fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex h-12 max-w-sm items-center gap-3 rounded-full px-4 text-sm font-semibold shadow-xl lg:inset-x-auto lg:right-6 lg:bottom-6"
    >
      <span className={cn('size-2.5 rounded-full', paused ? 'bg-amber-400' : 'animate-pulse bg-destructive')} aria-hidden />
      <span className="flex-1 truncate">
        {s.status === 'finished' ? `Unsaved ${label}` : paused ? `Paused ${label}` : `Recording ${label}`}
      </span>
      <span className="tabular-nums text-muted-foreground">
        {formatDuration(movingMsAt(s, now()) / 1000)} · {distanceValue(s.distanceM, units).toFixed(2)} {units}
      </span>
    </Link>
  );
}

import type { GeoPermission } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import type { Fix } from './TrackerProvider';

export const WEAK_ACCURACY_M = 20;

export function GpsStatus({
  fix,
  permission,
  simulating,
  className,
}: {
  fix: Fix | null;
  permission: GeoPermission;
  simulating: boolean;
  className?: string;
}) {
  let tone: 'good' | 'weak' | 'searching' | 'off' | 'sim';
  let text: string;
  if (simulating) [tone, text] = ['sim', 'Simulated GPS'];
  else if (permission === 'denied' || permission === 'unsupported') [tone, text] = ['off', 'Location off'];
  else if (!fix) [tone, text] = ['searching', 'Searching…'];
  else if (fix.point.acc <= WEAK_ACCURACY_M) [tone, text] = ['good', `GPS Good (±${Math.round(fix.point.acc)} m)`];
  else [tone, text] = ['weak', `Weak signal (±${Math.round(fix.point.acc)} m)`];

  return (
    <div className={cn('glass-strong inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold', className)}>
      <span
        aria-hidden
        className={cn(
          'size-2.5 rounded-full',
          tone === 'good' && 'bg-emerald-400',
          tone === 'weak' && 'bg-amber-400',
          tone === 'searching' && 'animate-pulse bg-amber-400',
          tone === 'off' && 'bg-destructive',
          tone === 'sim' && 'bg-violet-400',
        )}
      />
      {text}
    </div>
  );
}

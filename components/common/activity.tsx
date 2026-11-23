import { Footprints, SportShoe, type LucideIcon } from 'lucide-react';
import type { ActivityType } from '@/data/types';
import { cn } from '@/lib/utils';

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; Icon: LucideIcon; gradient: string; ink: string; soft: string; dot: string }
> = {
  run: { label: 'Run', Icon: SportShoe, gradient: 'bg-run-gradient', ink: 'text-run-ink', soft: 'bg-run/15', dot: 'bg-run' },
  walk: { label: 'Walk', Icon: Footprints, gradient: 'bg-walk-gradient', ink: 'text-walk-ink', soft: 'bg-walk/15', dot: 'bg-walk' },
};

/** Rounded gradient tile with the run/walk icon. */
export function ActivityIcon({ type, className }: { type: ActivityType; className?: string }) {
  const m = ACTIVITY_META[type];
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl text-ink-on-accent', m.gradient, className)}>
      <m.Icon className="size-5" aria-hidden />
      <span className="sr-only">{m.label}</span>
    </span>
  );
}

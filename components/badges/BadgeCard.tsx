import { format } from 'date-fns';
import type { BadgeContext, BadgeDef, UnlockedBadge, Units } from '@/data/types';
import { formatProgress, progressFraction } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { BadgeMedal, TIER_LABEL } from './BadgeMedal';

export function BadgeCard({
  badge,
  unlocked,
  ctx,
  units,
}: {
  badge: BadgeDef;
  unlocked?: UnlockedBadge;
  ctx: BadgeContext;
  units: Units;
}) {
  const progress = !unlocked ? badge.progress?.(ctx) : undefined;
  const pct = progress ? Math.round(progressFraction(progress) * 100) : 0;

  return (
    <li className={cn('glass flex flex-col items-center gap-3 rounded-2xl p-4 text-center', !unlocked && 'bg-transparent')}>
      <BadgeMedal icon={badge.icon} tier={badge.tier} locked={!unlocked} className="size-20" />
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">{badge.name}</h3>
        <p className="text-xs text-muted-foreground">{badge.description}</p>
      </div>
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {TIER_LABEL[badge.tier]}
        <span className="sr-only">{unlocked ? ', unlocked' : ', locked'}</span>
      </span>
      {unlocked ? (
        <p className="text-xs font-medium text-gold-ink">Unlocked {format(unlocked.unlockedAt, 'd MMM yyyy')}</p>
      ) : (
        progress && (
          <div className="flex w-full flex-col gap-1">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={`${badge.name} progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={formatProgress(progress, units)}
            >
              <div className="h-full rounded-full bg-foreground/40" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs tabular-nums text-muted-foreground">{formatProgress(progress, units)}</p>
          </div>
        )
      )}
    </li>
  );
}

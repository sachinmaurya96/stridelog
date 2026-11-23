'use client';

import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivities, useDataCounts } from '@/hooks/useData';
import { BADGES, buildBadgeContext } from '@/lib/badges';
import { useBadgeStore } from '@/store/badgeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BadgeCard } from './BadgeCard';

export function BadgesView() {
  const activities = useActivities();
  const counts = useDataCounts();
  const unlocked = useBadgeStore((s) => s.unlocked);
  const units = useSettingsStore((s) => s.units);

  const ctx = useMemo(
    () => (activities && counts ? buildBadgeContext(activities, counts.notes, counts.photos) : null),
    [activities, counts],
  );

  if (!ctx) {
    return (
      <div className="grid grid-cols-2 gap-3 py-2 md:grid-cols-3 xl:grid-cols-5" aria-busy="true" aria-label="Loading badges">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    );
  }

  const byId = new Map(unlocked.map((u) => [u.id, u]));
  const done = BADGES.filter((b) => byId.has(b.id)).length;
  const pct = Math.round((done / BADGES.length) * 100);

  return (
    <div className="flex flex-col gap-5 py-2">
      <section className="glass flex flex-col gap-3 rounded-2xl p-5" aria-labelledby="badges-summary">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="badges-summary" className="font-semibold">
            {done} of {BADGES.length} badges unlocked
          </h2>
          <span className="text-sm text-muted-foreground">{pct}%</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Badges unlocked"
          aria-valuemin={0}
          aria-valuemax={BADGES.length}
          aria-valuenow={done}
        >
          <div className="h-full rounded-full bg-gold-gradient transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {BADGES.map((b) => (
          <BadgeCard key={b.id} badge={b} unlocked={byId.get(b.id)} ctx={ctx} units={units} />
        ))}
      </ul>
    </div>
  );
}

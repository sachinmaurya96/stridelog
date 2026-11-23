'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { BadgeMedal } from '@/components/badges/BadgeMedal';
import { BADGES, badgeById } from '@/lib/badges';
import { useBadgeStore } from '@/store/badgeStore';

export function LatestBadgeCard() {
  const unlocked = useBadgeStore((s) => s.unlocked);
  const latest = [...unlocked].sort((a, b) => b.unlockedAt - a.unlockedAt)[0];
  const badge = latest ? badgeById(latest.id) : undefined;
  const next = BADGES.find((b) => !unlocked.some((u) => u.id === b.id));

  return (
    <Link
      href="/badges"
      className="glass flex items-center gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
    >
      {badge ? (
        <BadgeMedal icon={badge.icon} tier={badge.tier} />
      ) : (
        next && <BadgeMedal icon={next.icon} tier={next.tier} locked />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span id="latest-badge-title" className="text-sm text-muted-foreground">
          {badge ? 'Latest badge' : 'Your first badge'}
        </span>
        <span className="truncate font-semibold">{badge ? badge.name : (next?.name ?? 'All badges unlocked')}</span>
        <span className="truncate text-xs text-muted-foreground">
          {badge && latest ? `Unlocked ${format(latest.unlockedAt, 'd MMM')} · ${unlocked.length} of ${BADGES.length}` : next?.description}
        </span>
      </div>
      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
    </Link>
  );
}

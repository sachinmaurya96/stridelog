import {
  CalendarCheck,
  Crown,
  Flame,
  Footprints,
  Images,
  Lock,
  Medal,
  MoonStar,
  NotebookPen,
  Route,
  SportShoe,
  Sunrise,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { BadgeTier } from '@/data/types';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  CalendarCheck,
  Crown,
  Flame,
  Footprints,
  Images,
  Medal,
  MoonStar,
  NotebookPen,
  Route,
  SportShoe,
  Sunrise,
  Trophy,
  Zap,
};

export const TIER_RING: Record<BadgeTier, string> = {
  bronze: 'linear-gradient(135deg, #f3b07c 0%, #cd7f32 50%, #8c5a2b 100%)',
  silver: 'linear-gradient(135deg, #f4f6fa 0%, #c4cad6 50%, #8a93a6 100%)',
  gold: 'linear-gradient(135deg, #ffe9a3 0%, #ffc94d 45%, #e59a0b 100%)',
  platinum: 'linear-gradient(135deg, #e0f7ff 0%, #a5b4fc 50%, #c4b5fd 100%)',
};

export const TIER_LABEL: Record<BadgeTier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

/** Round medal: tier-gradient ring around the badge icon. Locked medals are greyscale with a lock. */
export function BadgeMedal({
  icon,
  tier,
  locked,
  className,
}: {
  icon: string;
  tier: BadgeTier;
  locked?: boolean;
  className?: string;
}) {
  const Icon = ICONS[icon] ?? Medal;
  return (
    <span
      className={cn('relative grid size-16 shrink-0 place-items-center rounded-full p-1 shadow-lg', locked && 'opacity-60 grayscale', className)}
      style={{ background: TIER_RING[tier] }}
      aria-hidden
    >
      <span className="grid size-full place-items-center rounded-full bg-card">
        <span className="grid size-[78%] place-items-center rounded-full" style={{ background: TIER_RING[tier] }}>
          <Icon className="size-1/2 text-[#1b1206]" strokeWidth={2.25} />
        </span>
      </span>
      {locked && (
        <span className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full border-2 border-card bg-muted text-muted-foreground">
          <Lock className="size-3" />
        </span>
      )}
    </span>
  );
}

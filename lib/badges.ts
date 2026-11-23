import { startOfWeek } from 'date-fns';
import type { Activity, BadgeContext, BadgeDef, BadgeProgress, UnlockedBadge, Units } from '@/data/types';
import { distanceValue, formatPaceValue } from './format';
import { currentStreak, longestStreak, totals, WEEK_STARTS_ON } from './stats';

const runs = (ctx: BadgeContext) => ctx.activities.filter((a) => a.type === 'run');
const longestRunM = (ctx: BadgeContext) => Math.max(0, ...runs(ctx).map((a) => a.distanceM));
const hour = (a: Activity) => new Date(a.startedAt).getHours();

function maxActivitiesInAWeek(activities: Activity[]) {
  const perWeek = new Map<number, number>();
  for (const a of activities) {
    const k = startOfWeek(a.startedAt, { weekStartsOn: WEEK_STARTS_ON }).getTime();
    perWeek.set(k, (perWeek.get(k) ?? 0) + 1);
  }
  return Math.max(0, ...perWeek.values());
}

/** Fastest average pace among runs of at least 3 km (0 if none). */
function bestLongRunPace(ctx: BadgeContext) {
  const paces = runs(ctx)
    .filter((a) => a.distanceM >= 3000 && a.avgPaceSecPerKm > 0)
    .map((a) => a.avgPaceSecPerKm);
  return paces.length ? Math.min(...paces) : 0;
}

const count = (current: number, target: number): BadgeProgress => ({ current: Math.min(current, target), target, kind: 'count' });
const distance = (current: number, target: number): BadgeProgress => ({ current: Math.min(current, target), target, kind: 'distance' });
const days = (current: number, target: number): BadgeProgress => ({ current: Math.min(current, target), target, kind: 'days' });

function runDistanceBadge(id: string, name: string, km: number, tier: BadgeDef['tier'], icon: string): BadgeDef {
  return {
    id,
    name,
    description: `Complete a single run of ${km} km or more.`,
    icon,
    tier,
    check: (ctx) => longestRunM(ctx) >= km * 1000,
    progress: (ctx) => distance(longestRunM(ctx), km * 1000),
  };
}

function streakBadge(n: number, tier: BadgeDef['tier']): BadgeDef {
  return {
    id: `streak-${n}`,
    name: `Streak ${n}`,
    description: `Be active ${n} days in a row.`,
    icon: 'Flame',
    tier,
    check: (ctx) => ctx.longestStreak >= n,
    progress: (ctx) => days(ctx.longestStreak, n),
  };
}

function clubBadge(km: number, tier: BadgeDef['tier']): BadgeDef {
  return {
    id: `club-${km}`,
    name: `${km} km Club`,
    description: `Cover ${km} km in total, running and walking.`,
    icon: 'Route',
    tier,
    check: (ctx) => ctx.totals.distanceM >= km * 1000,
    progress: (ctx) => distance(ctx.totals.distanceM, km * 1000),
  };
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Save your first walk.',
    icon: 'Footprints',
    tier: 'bronze',
    check: (ctx) => ctx.totals.walks >= 1,
    progress: (ctx) => count(ctx.totals.walks, 1),
  },
  {
    id: 'first-run',
    name: 'First Run',
    description: 'Save your first run.',
    icon: 'SportShoe',
    tier: 'bronze',
    check: (ctx) => ctx.totals.runs >= 1,
    progress: (ctx) => count(ctx.totals.runs, 1),
  },
  runDistanceBadge('5k', '5K Finisher', 5, 'silver', 'Medal'),
  runDistanceBadge('10k', '10K Hero', 10, 'gold', 'Trophy'),
  runDistanceBadge('half-marathon', 'Half Marathon', 21.1, 'platinum', 'Crown'),
  streakBadge(3, 'bronze'),
  streakBadge(7, 'silver'),
  streakBadge(30, 'gold'),
  clubBadge(50, 'silver'),
  clubBadge(100, 'gold'),
  clubBadge(500, 'platinum'),
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Start an activity before 7:00 in the morning.',
    icon: 'Sunrise',
    tier: 'bronze',
    check: (ctx) => ctx.activities.some((a) => hour(a) < 7),
    progress: (ctx) => count(ctx.activities.filter((a) => hour(a) < 7).length, 1),
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Start an activity after 21:00.',
    icon: 'MoonStar',
    tier: 'bronze',
    check: (ctx) => ctx.activities.some((a) => hour(a) >= 21),
    progress: (ctx) => count(ctx.activities.filter((a) => hour(a) >= 21).length, 1),
  },
  {
    id: 'busy-week',
    name: 'Busy Week',
    description: 'Log 5 or more activities in one week.',
    icon: 'CalendarCheck',
    tier: 'silver',
    check: (ctx) => maxActivitiesInAWeek(ctx.activities) >= 5,
    progress: (ctx) => count(maxActivitiesInAWeek(ctx.activities), 5),
  },
  {
    id: 'speedster',
    name: 'Speedster',
    description: 'Run at least 3 km at an average pace under 5:00 per km.',
    icon: 'Zap',
    tier: 'gold',
    check: (ctx) => {
      const p = bestLongRunPace(ctx);
      return p > 0 && p < 300;
    },
    progress: (ctx) => ({ current: bestLongRunPace(ctx), target: 300, kind: 'pace' }),
  },
  {
    id: 'journaler',
    name: 'Journaler',
    description: 'Write 7 daily notes.',
    icon: 'NotebookPen',
    tier: 'bronze',
    check: (ctx) => ctx.notesCount >= 7,
    progress: (ctx) => count(ctx.notesCount, 7),
  },
  {
    id: 'progress-pics',
    name: 'Progress Pics',
    description: 'Save 30 daily photos.',
    icon: 'Images',
    tier: 'silver',
    check: (ctx) => ctx.photosCount >= 30,
    progress: (ctx) => count(ctx.photosCount, 30),
  },
];

export const badgeById = (id: string) => BADGES.find((b) => b.id === id);

export function buildBadgeContext(activities: Activity[], notesCount: number, photosCount: number, now = new Date()): BadgeContext {
  const t = totals(activities);
  return {
    activities,
    totals: { count: t.count, runs: t.runs, walks: t.walks, distanceM: t.distanceM },
    currentStreak: currentStreak(activities, now),
    longestStreak: longestStreak(activities),
    notesCount,
    photosCount,
  };
}

/** Badges whose rule now passes but that aren't unlocked yet. */
export function evaluateBadges(ctx: BadgeContext, unlocked: UnlockedBadge[]) {
  const have = new Set(unlocked.map((u) => u.id));
  return BADGES.filter((b) => !have.has(b.id) && b.check(ctx));
}

/** 0–1 progress toward a badge. */
export function progressFraction(p: BadgeProgress) {
  if (p.kind === 'pace') return p.current > 0 ? Math.min(1, p.target / p.current) : 0;
  return p.target > 0 ? Math.min(1, p.current / p.target) : 0;
}

/** "7.4 / 10 km", "Streak 4 / 7", "3 / 5", "Best 5'40\" / 5'00\"". */
export function formatProgress(p: BadgeProgress, units: Units = 'km') {
  switch (p.kind) {
    case 'distance': {
      const cur = distanceValue(p.current, units);
      const target = distanceValue(p.target, units);
      const fmt = (n: number) => (n >= 100 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, ''));
      return `${fmt(cur)} / ${fmt(target)} ${units}`;
    }
    case 'days':
      return `Streak ${p.current} / ${p.target}`;
    case 'pace':
      return p.current ? `Best ${formatPaceValue(p.current, units)} / ${formatPaceValue(p.target, units)}` : 'No 3 km run yet';
    default:
      return `${p.current} / ${p.target}`;
  }
}

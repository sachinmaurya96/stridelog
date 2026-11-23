'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Activity as ActivityIcon, Clock, Flame, Play, Route } from 'lucide-react';
import type { ActivityType } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ACTIVITY_META } from '@/components/common/activity';
import { useActivities } from '@/hooks/useData';
import { distanceValue, formatDurationShort } from '@/lib/format';
import {
  activeDayKeys,
  currentStreak,
  dailySeries,
  dayKey,
  longestStreak,
  percentChange,
  periodComparison,
  periodRange,
  todayStats,
  totals,
  inRange,
  type Period,
} from '@/lib/stats';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { isSessionActive, useTrackingStore } from '@/store/trackingStore';
import { EmptyIllustration } from './EmptyIllustration';
import { GoalRing } from './GoalRing';
import { MonthlyChart } from './MonthlyChart';
import { RecentActivities } from './RecentActivities';
import { StatCard } from './StatCard';
import { StreakCard } from './StreakCard';
import { TodayShortcuts } from './TodayShortcuts';
import { WeeklyChart } from './WeeklyChart';
import { WeeklyGoalCard } from './WeeklyGoalCard';

const COMPARED_TO: Record<Period, string> = { day: 'yesterday', week: 'last week', month: 'last month' };

function QuickStart({ now }: { now: Date }) {
  const router = useRouter();
  const status = useTrackingStore((s) => s.status);
  const type = useTrackingStore((s) => s.type);
  const setType = useTrackingStore((s) => s.setType);
  const active = isSessionActive(status) || status === 'finished';

  const start = (t: ActivityType) => {
    setType(t);
    router.push('/track');
  };

  return (
    <section aria-labelledby="today-title" className="glass flex h-full flex-col justify-between gap-5 rounded-2xl p-5">
      <div>
        <p className="text-sm text-muted-foreground">{format(now, 'EEEE')}</p>
        <h2 id="today-title" className="text-2xl font-bold tracking-tight">
          {format(now, 'd MMMM yyyy')}
        </h2>
      </div>
      {active ? (
        <Button asChild size="lg" className={cn('h-14 rounded-2xl text-base text-ink-on-accent', ACTIVITY_META[type].gradient)}>
          <Link href="/track">
            <Play className="fill-current" aria-hidden /> Back to your {ACTIVITY_META[type].label.toLowerCase()}
          </Link>
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(['run', 'walk'] as const).map((t) => {
            const m = ACTIVITY_META[t];
            return (
              <Button
                key={t}
                size="lg"
                onClick={() => start(t)}
                className={cn('h-14 rounded-2xl text-base font-semibold text-ink-on-accent shadow-lg hover:opacity-90 active:scale-[0.98]', m.gradient)}
              >
                <m.Icon aria-hidden /> Start {m.label.toLowerCase()}
              </Button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function DashboardView() {
  const activities = useActivities();
  const settings = useSettingsStore();
  const [period, setPeriod] = useState<Period>('week');
  const units = settings.units;

  const data = useMemo(() => {
    if (!activities) return null;
    const now = new Date();
    const week = periodRange('week', now);
    const month = periodRange('month', now);
    const monthActs = inRange(activities, month);
    return {
      now,
      today: todayStats(activities, now),
      todayKey: dayKey(now),
      weekTotals: totals(inRange(activities, week)),
      weekDays: dailySeries(activities, week.from, week.to, 'EEE'),
      monthDays: dailySeries(activities, month.from, month.to, 'd'),
      monthTotals: totals(monthActs),
      monthActiveDays: activeDayKeys(monthActs).size,
      current: currentStreak(activities, now),
      longest: longestStreak(activities),
      activeToday: activeDayKeys(activities).has(dayKey(now)),
      comparisons: {
        day: periodComparison(activities, 'day', now),
        week: periodComparison(activities, 'week', now),
        month: periodComparison(activities, 'month', now),
      },
    };
  }, [activities]);

  if (!activities || !data) {
    return (
      <div className="grid gap-4 py-2 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-48 rounded-2xl md:col-span-2" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl md:col-span-2 xl:col-span-4" />
        <Skeleton className="h-64 rounded-2xl md:col-span-2" />
        <Skeleton className="h-64 rounded-2xl md:col-span-2" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <section className="glass flex flex-col items-center gap-4 rounded-2xl px-6 py-8 text-center">
          <EmptyIllustration className="h-36 w-full max-w-xs" />
          <h2 className="text-xl font-bold">Your journey starts with one step</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Record a walk or a run and your stats, streaks and badges will appear here.
          </p>
          <Button asChild size="lg" className="h-14 rounded-2xl bg-walk-gradient px-6 text-base font-semibold text-ink-on-accent hover:opacity-90">
            <Link href="/track" onClick={() => useTrackingStore.getState().setType('walk')}>
              <Play className="fill-current" aria-hidden /> Start your first walk
            </Link>
          </Button>
        </section>
        <TodayShortcuts today={data.todayKey} />
      </div>
    );
  }

  const cmp = data.comparisons[period];
  const dist = (m: number) => distanceValue(m, units);
  const recent = activities.slice(0, 3);

  return (
    <div className="grid gap-4 py-2 md:grid-cols-2 xl:grid-cols-4">
      <div className="md:col-span-2">
        <QuickStart now={data.now} />
      </div>

      <section aria-labelledby="today-ring" className="glass flex items-center gap-5 rounded-2xl p-5 md:flex-col md:items-stretch lg:flex-row lg:items-center xl:flex-col xl:items-stretch">
        <GoalRing value={data.today.steps} goal={settings.dailyGoalSteps} label="est. steps" size={148} />
        <div className="flex flex-1 flex-col gap-2">
          <h2 id="today-ring" className="font-semibold">
            Today
          </h2>
          <dl className="grid grid-cols-1 gap-1 text-sm xl:grid-cols-3 xl:gap-2">
            <div className="flex justify-between xl:flex-col">
              <dt className="text-muted-foreground">Activities</dt>
              <dd className="font-semibold">{data.today.count}</dd>
            </div>
            <div className="flex justify-between xl:flex-col">
              <dt className="text-muted-foreground">Distance</dt>
              <dd className="font-semibold">
                {dist(data.today.distanceM).toFixed(2)} {units}
              </dd>
            </div>
            <div className="flex justify-between xl:flex-col">
              <dt className="text-muted-foreground">Calories</dt>
              <dd className="font-semibold">{data.today.calories} kcal</dd>
            </div>
          </dl>
        </div>
      </section>

      <StreakCard current={data.current} longest={data.longest} activeToday={data.activeToday} />

      <section aria-labelledby="stats-title" className="flex flex-col gap-3 md:col-span-2 xl:col-span-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="stats-title" className="font-semibold">
            Your stats
          </h2>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList aria-label="Period">
              <TabsTrigger value="day" className="px-4">Day</TabsTrigger>
              <TabsTrigger value="week" className="px-4">Week</TabsTrigger>
              <TabsTrigger value="month" className="px-4">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Activities"
            icon={ActivityIcon}
            value={cmp.current.count}
            delta={percentChange(cmp.current.count, cmp.previous.count)}
            comparedTo={COMPARED_TO[period]}
          />
          <StatCard
            label="Distance"
            icon={Route}
            value={dist(cmp.current.distanceM)}
            format={(n) => n.toFixed(1)}
            unit={units}
            delta={percentChange(cmp.current.distanceM, cmp.previous.distanceM)}
            comparedTo={COMPARED_TO[period]}
          />
          <StatCard
            label="Active time"
            icon={Clock}
            value={cmp.current.durationSec}
            format={formatDurationShort}
            delta={percentChange(cmp.current.durationSec, cmp.previous.durationSec)}
            comparedTo={COMPARED_TO[period]}
          />
          <StatCard
            label="Calories"
            icon={Flame}
            value={cmp.current.calories}
            unit="kcal"
            delta={percentChange(cmp.current.calories, cmp.previous.calories)}
            comparedTo={COMPARED_TO[period]}
          />
        </div>
      </section>

      <section aria-labelledby="week-chart-title" className="glass flex flex-col gap-3 rounded-2xl p-5 md:col-span-2">
        <h2 id="week-chart-title" className="font-semibold">
          This week ({units})
        </h2>
        <WeeklyChart days={data.weekDays} units={units} />
      </section>

      <div className="flex flex-col gap-4 md:col-span-2">
        <WeeklyGoalCard
          activities={data.weekTotals.count}
          activitiesGoal={settings.weeklyGoalActivities}
          distance={dist(data.weekTotals.distanceM)}
          distanceGoal={settings.weeklyGoalKm}
          unit={units}
        />
      </div>

      <section aria-labelledby="month-chart-title" className="glass flex flex-col gap-3 rounded-2xl p-5 md:col-span-2">
        <h2 id="month-chart-title" className="font-semibold">
          {format(data.now, 'MMMM')}: distance per day
        </h2>
        <MonthlyChart days={data.monthDays} total={data.monthTotals} activeDays={data.monthActiveDays} units={units} />
      </section>

      <div className="md:col-span-2">
        <RecentActivities activities={recent} units={units} />
      </div>

      <div className="md:col-span-2 xl:col-span-4">
        <TodayShortcuts today={data.todayKey} />
      </div>
    </div>
  );
}

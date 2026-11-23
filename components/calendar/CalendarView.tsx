'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDaysInMonth,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Camera, ChevronLeft, ChevronRight, NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivities, useNoteDates, usePhotoDates } from '@/hooks/useData';
import { distanceValue } from '@/lib/format';
import { currentStreak, dayKey, groupByDay, longestStreak, WEEK_STARTS_ON } from '@/lib/stats';
import { useSettingsStore } from '@/store/settingsStore';
import type { DayInfo } from './DayCell';
import { DayDetailSheet } from './DayDetailSheet';
import { MonthCalendar } from './MonthCalendar';

export function CalendarView() {
  const activities = useActivities();
  const noteDates = useNoteDates();
  const photoDates = usePhotoDates();
  const units = useSettingsStore((s) => s.units);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [direction, setDirection] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => groupByDay(activities ?? []), [activities]);

  const view = useMemo(() => {
    if (!activities) return null;
    const today = startOfDay(new Date());
    const notes = new Set(noteDates ?? []);
    const photos = new Set(photoDates ?? []);
    const dates = eachDayOfInterval({
      start: startOfWeek(month, { weekStartsOn: WEEK_STARTS_ON }),
      end: endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON }),
    });
    const distanceOf = (key: string) => (byDay.get(key) ?? []).reduce((s, a) => s + a.distanceM, 0);
    const monthKeys = dates.filter((d) => isSameMonth(d, month)).map(dayKey);
    const maxDistance = Math.max(0, ...monthKeys.map(distanceOf));

    const days: DayInfo[] = dates.map((date) => {
      const key = dayKey(date);
      const acts = byDay.get(key) ?? [];
      const distanceM = distanceOf(key);
      return {
        date,
        key,
        inMonth: isSameMonth(date, month),
        isToday: date.getTime() === today.getTime(),
        isFuture: date > today,
        runs: acts.filter((a) => a.type === 'run').length,
        walks: acts.filter((a) => a.type === 'walk').length,
        distanceM,
        intensity: distanceM > 0 && maxDistance > 0 ? Math.max(1, Math.ceil((distanceM / maxDistance) * 4)) : 0,
        hasNote: notes.has(key),
        hasPhoto: photos.has(key),
      };
    });

    const inMonth = days.filter((d) => d.inMonth);
    return {
      days,
      activeDays: inMonth.filter((d) => d.runs + d.walks > 0).length,
      daysInMonth: getDaysInMonth(month),
      totalM: inMonth.reduce((s, d) => s + d.distanceM, 0),
      current: currentStreak(activities),
      longest: longestStreak(activities),
    };
  }, [activities, noteDates, photoDates, month, byDay]);

  const go = (delta: number) => {
    setDirection(delta);
    setMonth((m) => addMonths(m, delta));
  };
  const isCurrentMonth = isSameMonth(month, new Date());

  if (!view) {
    return (
      <div className="flex flex-col gap-4 py-2" aria-busy="true" aria-label="Loading calendar">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  const summary = [
    ['Active days', `${view.activeDays} / ${view.daysInMonth}`],
    ['Total distance', `${distanceValue(view.totalM, units).toFixed(1)} ${units}`],
    ['Current streak', `${view.current} ${view.current === 1 ? 'day' : 'days'}`],
    ['Longest streak', `${view.longest} ${view.longest === 1 ? 'day' : 'days'}`],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 py-2 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section aria-labelledby="month-title" className="glass flex flex-col gap-4 rounded-2xl p-3 sm:p-5">
        <div className="flex items-center gap-2">
          <h2 id="month-title" className="flex-1 text-lg font-bold" aria-live="polite">
            {format(month, 'MMMM yyyy')}
          </h2>
          {!isCurrentMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const thisMonth = startOfMonth(new Date());
                setDirection(thisMonth > month ? 1 : -1);
                setMonth(thisMonth);
              }}
            >
              Today
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => go(-1)} aria-label="Previous month">
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => go(1)} aria-label="Next month">
            <ChevronRight aria-hidden />
          </Button>
        </div>
        <MonthCalendar
          month={month}
          days={view.days}
          direction={direction}
          onSelect={(d) => setSelected(d.key)}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
        />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-run" aria-hidden /> Run
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-walk" aria-hidden /> Walk
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-[color-mix(in_oklab,var(--chart-run)_34%,transparent)]" aria-hidden /> More distance
          </li>
          <li className="flex items-center gap-1.5">
            <NotebookPen className="size-3" aria-hidden /> Note
          </li>
          <li className="flex items-center gap-1.5">
            <Camera className="size-3" aria-hidden /> Photo
          </li>
        </ul>
      </section>

      <section aria-label="Month summary" className="grid grid-cols-2 gap-3 self-start lg:grid-cols-1">
        {summary.map(([label, value]) => (
          <div key={label} className="glass rounded-2xl px-4 py-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-bold">{value}</div>
          </div>
        ))}
      </section>

      <DayDetailSheet
        dateKey={selected}
        activities={selected ? (byDay.get(selected) ?? []) : []}
        units={units}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

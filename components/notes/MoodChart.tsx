'use client';

import { format } from 'date-fns';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyNote } from '@/data/types';
import { AXIS_TICK, ChartTable, ChartTooltipBox } from '@/components/charts/ChartTooltip';
import { fromDayKey } from '@/lib/stats';
import { moodFor } from './moods';

const COLOR = 'var(--chart-run)';

/** Mood over the last 30 notes. */
export function MoodChart({ notes }: { notes: DailyNote[] }) {
  const data = notes
    .slice(0, 30)
    .reverse()
    .map((n) => ({ date: n.date, label: format(fromDayKey(n.date), 'd MMM'), mood: n.mood, energy: n.energy }));

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 3, 5]}
            width={30}
            tickLine={false}
            axisLine={false}
            tick={{ ...AXIS_TICK, fontSize: 14 }}
            tickFormatter={(v: number) => moodFor(v).emoji}
          />
          <Tooltip
            cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <ChartTooltipBox
                  title={payload[0].payload.label}
                  rows={[{ color: COLOR, name: 'mood', value: `${moodFor(payload[0].payload.mood).emoji} ${moodFor(payload[0].payload.mood).label}` }]}
                />
              ) : null
            }
          />
          <Line
            type="monotone"
            dataKey="mood"
            name="Mood"
            stroke={COLOR}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)', fill: COLOR }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--background)', fill: COLOR }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartTable caption="Mood by day" headers={['Date', 'Mood', 'Energy']} rows={data.map((d) => [d.date, moodFor(d.mood).label, d.energy])} />
    </div>
  );
}

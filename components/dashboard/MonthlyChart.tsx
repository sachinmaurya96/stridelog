'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Units } from '@/data/types';
import type { DayPoint, Totals } from '@/lib/stats';
import { distanceValue, formatDurationShort } from '@/lib/format';
import { AXIS_TICK, ChartTable, ChartTooltipBox } from '@/components/charts/ChartTooltip';

const COLOR = 'var(--chart-run)';

/** Distance per day for the current month, with the month's totals above. */
export function MonthlyChart({ days, total, activeDays, units }: { days: DayPoint[]; total: Totals; activeDays: number; units: Units }) {
  const data = days.map((d) => ({ day: Number(d.label), date: d.date, distance: +distanceValue(d.totalM, units).toFixed(2) }));
  const tiles = [
    ['Distance', `${distanceValue(total.distanceM, units).toFixed(1)} ${units}`],
    ['Activities', String(total.count)],
    ['Active days', `${activeDays} / ${days.length}`],
    ['Active time', formatDurationShort(total.durationSec)],
  ];

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted/60 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
            <defs>
              <linearGradient id="month-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR} stopOpacity={0.18} />
                <stop offset="100%" stopColor={COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <ChartTooltipBox
                    title={payload[0].payload.date}
                    rows={[{ color: COLOR, name: 'distance', value: `${payload[0].payload.distance.toFixed(2)} ${units}` }]}
                  />
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey="distance"
              name="Distance"
              stroke={COLOR}
              strokeWidth={2}
              fill="url(#month-fill)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)', fill: COLOR }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption={`Distance per day this month in ${units}`}
        headers={['Date', 'Distance']}
        rows={data.filter((d) => d.distance > 0).map((d) => [d.date, d.distance])}
      />
    </div>
  );
}

'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ActivityType, Units } from '@/data/types';
import type { PacePoint } from '@/lib/geo';
import { formatDuration, formatPaceValue } from '@/lib/format';
import { AXIS_TICK, ChartTable, ChartTooltipBox, SERIES_COLOR } from './ChartTooltip';

/** Pace over moving time. The y-axis is reversed so faster is higher. */
export function PaceChart({ series, units, type }: { series: PacePoint[]; units: Units; type: ActivityType }) {
  const color = SERIES_COLOR[type];
  const gradientId = `pace-fill-${type}`;

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(t: number) => `${Math.round(t / 60)}m`}
          />
          <YAxis
            reversed
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            domain={['dataMin - 15', 'dataMax + 15']}
            tickFormatter={(v: number) => formatPaceValue(v, units)}
          />
          <Tooltip
            cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <ChartTooltipBox
                  title={`at ${formatDuration(payload[0].payload.t)}`}
                  rows={[{ color, name: 'pace', value: `${formatPaceValue(payload[0].payload.paceSecPerKm, units)}/${units}` }]}
                />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="paceSecPerKm"
            name="Pace"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)', fill: color }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <ChartTable
        caption="Pace over time"
        headers={['Moving time', `Pace (per ${units})`]}
        rows={series.map((p) => [formatDuration(p.t), formatPaceValue(p.paceSecPerKm, units)])}
      />
    </div>
  );
}

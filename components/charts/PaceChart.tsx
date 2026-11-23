'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ActivityType, Units } from '@/data/types';
import type { PacePoint } from '@/lib/geo';
import { formatDuration, formatPaceValue, M_PER_MI } from '@/lib/format';
import { AXIS_TICK, ChartTable, ChartTooltipBox, SERIES_COLOR } from './ChartTooltip';

export type PaceMetric = 'pace' | 'speed';

/** Pace (y reversed, so faster is higher) or speed over moving time. */
export function PaceChart({
  series,
  units,
  type,
  metric = 'pace',
}: {
  series: PacePoint[];
  units: Units;
  type: ActivityType;
  metric?: PaceMetric;
}) {
  const color = SERIES_COLOR[type];
  const gradientId = `pace-fill-${type}-${metric}`;
  const speedUnit = units === 'mi' ? 'mph' : 'km/h';
  const toSpeed = (secPerKm: number) => (units === 'mi' ? 3600 / secPerKm / (M_PER_MI / 1000) : 3600 / secPerKm);
  const data = series.map((p) => ({ t: p.t, pace: p.paceSecPerKm, value: metric === 'speed' ? +toSpeed(p.paceSecPerKm).toFixed(1) : p.paceSecPerKm }));
  const format = (v: number) => (metric === 'speed' ? `${v.toFixed(1)}` : formatPaceValue(v, units));
  const label = (v: number) => (metric === 'speed' ? `${v.toFixed(1)} ${speedUnit}` : `${formatPaceValue(v, units)}/${units}`);

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
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
            reversed={metric === 'pace'}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            domain={metric === 'pace' ? ['dataMin - 15', 'dataMax + 15'] : [0, 'auto']}
            tickFormatter={format}
          />
          <Tooltip
            cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <ChartTooltipBox
                  title={`at ${formatDuration(payload[0].payload.t)}`}
                  rows={[{ color, name: metric, value: label(payload[0].payload.value) }]}
                />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            name={metric === 'speed' ? 'Speed' : 'Pace'}
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
        caption={metric === 'speed' ? 'Speed over time' : 'Pace over time'}
        headers={['Moving time', metric === 'speed' ? `Speed (${speedUnit})` : `Pace (per ${units})`]}
        rows={data.map((p) => [formatDuration(p.t), format(p.value)])}
      />
    </div>
  );
}

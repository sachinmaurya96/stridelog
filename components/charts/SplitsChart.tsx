'use client';

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ActivityType, Split, Units } from '@/data/types';
import { formatPaceValue } from '@/lib/format';
import { AXIS_TICK, ChartTable, ChartTooltipBox, SERIES_COLOR } from './ChartTooltip';

/** One column per km/mile; taller = slower. The fastest split is labelled. */
export function SplitsChart({ splits, units, type }: { splits: Split[]; units: Units; type: ActivityType }) {
  const unitLabel = units === 'mi' ? 'Mile' : 'Km';
  const fastest = Math.min(...splits.map((s) => s.paceSecPerKm));
  const data = splits.map((s) => ({
    name: `${unitLabel} ${s.km}`,
    km: s.km,
    pace: s.paceSecPerKm,
    label: s.paceSecPerKm === fastest ? `${formatPaceValue(s.paceSecPerKm, units)} fastest` : '',
  }));
  const color = SERIES_COLOR[type];

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 4, left: 0, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="km" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => formatPaceValue(v, units)}
            domain={[(min: number) => Math.max(0, Math.floor(min * 0.85)), 'auto']}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <ChartTooltipBox
                  title={payload[0].payload.name}
                  rows={[{ color, name: 'pace', value: `${formatPaceValue(payload[0].payload.pace, units)}/${units}` }]}
                />
              ) : null
            }
          />
          <Bar dataKey="pace" name="Pace" fill={color} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
            <LabelList dataKey="label" position="top" fill="var(--muted-foreground)" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartTable
        caption={`Pace per ${unitLabel.toLowerCase()}`}
        headers={[unitLabel, `Pace (per ${units})`]}
        rows={data.map((d) => [d.km, formatPaceValue(d.pace, units)])}
      />
    </div>
  );
}

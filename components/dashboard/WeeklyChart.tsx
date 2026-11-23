'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Units } from '@/data/types';
import type { DayPoint } from '@/lib/stats';
import { distanceValue } from '@/lib/format';
import { AXIS_TICK, ChartTable, ChartTooltipBox, SERIES_COLOR } from '@/components/charts/ChartTooltip';

interface Datum {
  label: string;
  run: number;
  walk: number;
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

interface SegProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: Datum;
}

/** Walk sits at the bottom; it only gets the rounded cap when no run is stacked on top. A 2px gap separates them. */
function WalkSeg({ x = 0, y = 0, width = 0, height = 0, fill, payload }: SegProps) {
  if (height <= 0) return null;
  const hasRun = (payload?.run ?? 0) > 0;
  if (hasRun) return <rect x={x} y={y + 2} width={width} height={Math.max(0, height - 2)} fill={fill} />;
  return <path d={roundedTop(x, y, width, height, 4)} fill={fill} />;
}

function RunSeg({ x = 0, y = 0, width = 0, height = 0, fill }: SegProps) {
  if (height <= 0) return null;
  return <path d={roundedTop(x, y, width, height, 4)} fill={fill} />;
}

/** Mon–Sun distance, stacked by run and walk. */
export function WeeklyChart({ days, units }: { days: DayPoint[]; units: Units }) {
  const data: Datum[] = days.map((d) => ({
    label: d.label,
    run: +distanceValue(d.runM, units).toFixed(2),
    walk: +distanceValue(d.walkM, units).toFixed(2),
  }));

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex gap-4 text-xs text-muted-foreground" aria-label="Legend">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: SERIES_COLOR.run }} aria-hidden /> Run
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: SERIES_COLOR.walk }} aria-hidden /> Walk
        </li>
      </ul>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <ChartTooltipBox
                    title={String(label)}
                    rows={[
                      { color: SERIES_COLOR.run, name: 'run', value: `${payload[0].payload.run.toFixed(2)} ${units}` },
                      { color: SERIES_COLOR.walk, name: 'walk', value: `${payload[0].payload.walk.toFixed(2)} ${units}` },
                    ]}
                  />
                ) : null
              }
            />
            <Bar dataKey="walk" name="Walk" stackId="d" fill={SERIES_COLOR.walk} maxBarSize={24} shape={WalkSeg} isAnimationActive={false} />
            <Bar dataKey="run" name="Run" stackId="d" fill={SERIES_COLOR.run} maxBarSize={24} shape={RunSeg} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption={`Distance this week in ${units}`}
        headers={['Day', 'Run', 'Walk']}
        rows={data.map((d) => [d.label, d.run, d.walk])}
      />
    </div>
  );
}

'use client';

import { useId } from 'react';
import { motion } from 'motion/react';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';

/** Circular progress toward a goal with a count-up value in the middle. */
export function GoalRing({
  value,
  goal,
  label,
  size = 168,
  stroke = 14,
}: {
  value: number;
  goal: number;
  label: string;
  size?: number;
  stroke?: number;
}) {
  const id = useId();
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const r = (size - stroke) / 2;

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(value).toLocaleString()} of ${goal.toLocaleString()} ${label} (${Math.round(pct * 100)}%)`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--run)" />
            <stop offset="100%" stopColor="var(--run-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: pct }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ opacity: pct > 0 ? 1 : 0 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden>
        <span className="text-3xl font-bold">
          <AnimatedNumber value={value} />
        </span>
        <span className="text-xs text-muted-foreground">
          of {goal.toLocaleString()} {label}
        </span>
      </div>
    </div>
  );
}

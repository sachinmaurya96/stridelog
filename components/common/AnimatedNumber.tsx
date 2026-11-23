'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';

const defaultFormat = (n: number) => Math.round(n).toLocaleString();

/** Counts up from the previous value (0 on first show) to `value`. */
export function AnimatedNumber({
  value,
  format = defaultFormat,
  duration = 0.9,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const reduce = useReducedMotion();
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  });

  // Reset to the start value before paint so the final number doesn't flash first.
  useLayoutEffect(() => {
    if (ref.current && !reduce) ref.current.textContent = formatRef.current(from.current);
  }, [value, reduce]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = formatRef.current(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        el.textContent = formatRef.current(v);
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <span ref={ref}>{format(value)}</span>;
}
